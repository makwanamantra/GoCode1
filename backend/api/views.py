from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q, Max
from django.contrib.auth import authenticate
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    UserProfile, ProjectTemplate, CustomRequest, Project, Task,
    Deliverable, ChatMessage, Payment, AuditLog, Resume, LoginHistory,
    SiteSetting, VisitorLog, VisitorEvent, ResumeDownloadRequest
)
from .serializers import (
    UserSerializer, ProjectTemplateSerializer, CustomRequestSerializer,
    ProjectSerializer, TaskSerializer, DeliverableSerializer,
    ChatMessageSerializer, PaymentSerializer, AuditLogSerializer,
    ResumeSerializer, LoginHistorySerializer, SiteSettingSerializer,
    VisitorLogSerializer, ResumeDownloadRequestSerializer
)
from .notifications import send_admin_alert, describe_visitor
from django.http import FileResponse, Http404


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def record_login(user, request):
    """Create a LoginHistory row and mirror it into the audit trail."""
    role = getattr(getattr(user, 'profile', None), 'role', 'CLIENT')
    entry = LoginHistory.objects.create(
        user=user,
        role=role,
        ip_address=_client_ip(request),
        user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:300],
    )
    AuditLog.objects.create(
        user=user,
        action='User Login',
        details=f"{user.username} ({role}) signed in from {entry.ip_address or 'unknown IP'}",
    )
    send_admin_alert(
        'User signed in',
        [
            f"Username: {user.username}",
            f"Name: {user.get_full_name() or 'not provided'}",
            f"Email: {user.email or 'not provided'}",
            f"Role: {role}",
            f"IP address: {entry.ip_address or 'unknown'}",
            f"Device: {entry.user_agent or 'unknown'}",
            f"Signed in at: {entry.login_time:%Y-%m-%d %H:%M:%S} UTC",
            f"Total logins so far: {user.login_history.count()}",
        ],
        category='login',
    )
    return entry

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = User.objects.select_related('profile').all().order_by('username')

        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(profile__role=role.upper())

        sub_role = self.request.query_params.get('sub_role')
        if sub_role:
            qs = qs.filter(profile__sub_role=sub_role.upper())

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(profile__company__icontains=search) |
                Q(profile__sub_role__icontains=search)
            )
        return qs.distinct()

    @action(detail=False, methods=['get'])
    def current(self, request):
        role = request.query_params.get('role', 'OWNER')
        user = User.objects.filter(profile__role=role).first()
        if not user:
            user = User.objects.first()
        if user:
            return Response(self.get_serializer(user).data)
        return Response({'error': 'No users found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='login-history')
    def login_history(self, request, pk=None):
        """Expanded log detail: how many times a user logged in and exactly when."""
        user = self.get_object()
        history = user.login_history.all()
        return Response({
            'user_id': user.id,
            'username': user.username,
            'role': getattr(getattr(user, 'profile', None), 'role', 'CLIENT'),
            'login_count': history.count(),
            'first_login': history.last().login_time if history.exists() else None,
            'last_login': history.first().login_time if history.exists() else None,
            'history': LoginHistorySerializer(history, many=True).data,
        })

    @action(detail=True, methods=['get', 'post'], url_path='resume')
    def resume(self, request, pk=None):
        """GET  -> full resume version history for this user.
        POST -> admin upload / re-upload (multipart `file` or JSON `external_url`)."""
        user = self.get_object()

        if request.method == 'GET':
            return Response(
                ResumeSerializer(user.resumes.all(), many=True, context={'request': request}).data
            )

        uploaded_file = request.FILES.get('file')
        external_url = request.data.get('external_url')
        if not uploaded_file and not external_url:
            return Response({'error': 'Provide a `file` upload or an `external_url`.'},
                            status=status.HTTP_400_BAD_REQUEST)

        actor_id = request.data.get('actor_id')
        actor = User.objects.filter(pk=actor_id).first() if actor_id else None

        next_version = (user.resumes.aggregate(Max('version'))['version__max'] or 0) + 1
        user.resumes.update(is_current=False)

        resume = Resume.objects.create(
            user=user,
            file=uploaded_file,
            external_url=external_url,
            original_name=getattr(uploaded_file, 'name', None) or (external_url or '')[:255],
            version=next_version,
            is_current=True,
            notes=request.data.get('notes'),
            uploaded_by=actor,
        )

        AuditLog.objects.create(
            user=actor,
            action='Resume Uploaded' if next_version == 1 else 'Resume Re-uploaded',
            details=f"Resume v{next_version} stored for {user.username}.",
        )

        return Response(
            {'status': 'Resume saved', 'resume': ResumeSerializer(resume, context={'request': request}).data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path='resume/(?P<resume_id>[^/.]+)')
    def delete_resume(self, request, pk=None, resume_id=None):
        user = self.get_object()
        resume = user.resumes.filter(pk=resume_id).first()
        if not resume:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        was_current = resume.is_current
        resume.delete()
        if was_current:
            latest = user.resumes.first()
            if latest:
                latest.is_current = True
                latest.save()
        AuditLog.objects.create(action='Resume Deleted', details=f"Removed a resume version for {user.username}.")
        return Response({'status': 'Resume removed'})


class LoginHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Searchable, filterable login trail used by the admin log console."""
    queryset = LoginHistory.objects.select_related('user').all()
    serializer_class = LoginHistorySerializer

    def get_queryset(self):
        qs = LoginHistory.objects.select_related('user').all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role.upper())
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(ip_address__icontains=search)
            )
        return qs


@api_view(['POST'])
def auth_login(request):
    """Sign in and record the login timestamp used by the admin log expander."""
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Username and password are required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    UserProfile.objects.get_or_create(user=user)
    entry = record_login(user, request)
    return Response({
        'user': UserSerializer(user, context={'request': request}).data,
        'role': entry.role,
        'login_time': entry.login_time,
    })


@api_view(['POST'])
def auth_logout(request):
    user_id = request.data.get('user_id')
    entry = LoginHistory.objects.filter(user_id=user_id, logout_time__isnull=True).first()
    if entry:
        entry.logout_time = timezone.now()
        entry.save()
        AuditLog.objects.create(user=entry.user, action='User Logout',
                                details=f"{entry.user.username} signed out.")
    return Response({'status': 'Signed out'})


class ProjectTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProjectTemplate.objects.all().order_by('-created_at')
    serializer_class = ProjectTemplateSerializer


class CustomRequestViewSet(viewsets.ModelViewSet):
    queryset = CustomRequest.objects.all().order_by('-created_at')
    serializer_class = CustomRequestSerializer

    @action(detail=True, methods=['post'])
    def admin_respond(self, request, pk=None):
        custom_req = self.get_object()
        proposed_price = request.data.get('proposed_price')
        predicted_date = request.data.get('predicted_date')
        action_type = request.data.get('action') # 'OFFER', 'REJECT'

        if action_type == 'REJECT':
            custom_req.status = 'REJECTED'
            custom_req.save()
            AuditLog.objects.create(action="Request Rejected", details=f"Admin rejected request '{custom_req.title}'")
            return Response({'status': 'Request rejected', 'request': CustomRequestSerializer(custom_req).data})

        if proposed_price and predicted_date:
            custom_req.admin_proposed_price = proposed_price
            custom_req.admin_predicted_date = predicted_date
            custom_req.status = 'ADMIN_OFFER'
            custom_req.save()

            AuditLog.objects.create(
                action="Admin Offered Price & Date",
                details=f"Offered ${proposed_price} and target {predicted_date} for request '{custom_req.title}'"
            )
            return Response({'status': 'Offer sent to client', 'request': CustomRequestSerializer(custom_req).data})
        return Response({'error': 'Missing price or date'}, status=400)

    @action(detail=True, methods=['post'])
    def client_accept(self, request, pk=None):
        custom_req = self.get_object()
        if custom_req.status not in ['ADMIN_OFFER', 'PENDING']:
            return Response({'error': 'Request cannot be accepted in current status'}, status=400)

        custom_req.status = 'APPROVED'
        custom_req.save()

        # Create actual active project
        total_b = custom_req.admin_proposed_price or custom_req.user_budget
        project = Project.objects.create(
            custom_request=custom_req,
            client=custom_req.client,
            title=custom_req.title,
            description=custom_req.description,
            total_budget=total_b,
            advance_amount=total_b * Decimal("0.30"),

            predicted_completion_date=custom_req.admin_predicted_date or (timezone.now() + timedelta(days=20)).date(),
            status='IN_PROGRESS'
        )

        AuditLog.objects.create(
            user=custom_req.client,
            action="Client Approved Request & Created Project",
            details=f"Project '{project.title}' initialized with 30% advance deposit requirement."
        )

        return Response({
            'status': 'Project initialized successfully',
            'project': ProjectSerializer(project).data
        })

    @action(detail=True, methods=['post'])
    def edit_budget(self, request, pk=None):
        custom_req = self.get_object()
        new_budget = request.data.get('new_budget')
        if new_budget:
            custom_req.user_budget = new_budget
            custom_req.save()
            AuditLog.objects.create(
                user=custom_req.client,
                action="Client Updated Budget",
                details=f"Updated budget to ${new_budget} for '{custom_req.title}'"
            )
            return Response({'status': 'Budget updated', 'request': CustomRequestSerializer(custom_req).data})
        return Response({'error': 'Invalid budget'}, status=400)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['post'])
    def pay_advance(self, request, pk=None):
        project = self.get_object()
        project.advance_paid = True
        project.save()

        Payment.objects.create(
            project=project,
            client=project.client,
            amount=project.advance_amount,
            payment_type='ADVANCE_30',
            transaction_id=f"TXN-ADV-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        )

        AuditLog.objects.create(
            user=project.client,
            action="Advance Paid",
            details=f"Client paid 30% advance (${project.advance_amount}) for project '{project.title}'"
        )
        return Response({'status': 'Advance payment recorded', 'project': ProjectSerializer(project).data})

    @action(detail=True, methods=['post'])
    def cancel_project(self, request, pk=None):
        project = self.get_object()
        now = timezone.now()
        days_passed = (now - project.approved_date).days

        if days_passed > 5:
            return Response({'error': '5-day cancellation window has expired.'}, status=400)

        project.status = 'CANCELLED'
        project.save()

        if project.advance_paid:
            Payment.objects.create(
                project=project,
                client=project.client,
                amount=project.advance_amount,
                payment_type='REFUND',
                transaction_id=f"REF-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                status='REFUNDED'
            )

        AuditLog.objects.create(
            user=project.client,
            action="Project Cancelled by Client (Within 5 days)",
            details=f"Cancelled '{project.title}' within 5-day window. Refund processed."
        )
        return Response({'status': 'Project cancelled successfully', 'project': ProjectSerializer(project).data})

    @action(detail=True, methods=['post'])
    def owner_approve_completion(self, request, pk=None):
        project = self.get_object()
        project.status = 'COMPLETED'
        project.final_paid = True
        project.save()

        final_amt = project.total_budget - project.advance_amount
        Payment.objects.create(
            project=project,
            client=project.client,
            amount=final_amt,
            payment_type='FINAL_70',
            transaction_id=f"TXN-FNL-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        )

        # Distribute earnings payouts to assigned task developers
        for task in project.tasks.all():
            if task.assigned_employee:
                prof = task.assigned_employee.profile
                prof.total_earned += task.payout
                prof.save()

        AuditLog.objects.create(
            action="Owner Approved Final Completion",
            details=f"Project '{project.title}' marked completed. Final payouts credited to developer profiles."
        )
        return Response({'status': 'Project completed & payouts released', 'project': ProjectSerializer(project).data})


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']:
            task.status = new_status
            task.save()
            AuditLog.objects.create(
                user=task.assigned_employee,
                action="Task Status Updated",
                details=f"Task '{task.title}' updated to {new_status}"
            )
            return Response({'status': 'Task updated', 'task': TaskSerializer(task).data})
        return Response({'error': 'Invalid status'}, status=400)


class DeliverableViewSet(viewsets.ModelViewSet):
    queryset = Deliverable.objects.all().order_by('-created_at')
    serializer_class = DeliverableSerializer


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all().order_by('timestamp')
    serializer_class = ChatMessageSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all().order_by('-timestamp')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(action__icontains=search) |
                Q(details__icontains=search) |
                Q(user__username__icontains=search)
            )
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(user__profile__role=role.upper())
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


@api_view(['GET'])
def analytics_overview(request):
    total_projects = Project.objects.count()
    completed_projects = Project.objects.filter(status='COMPLETED').count()
    in_progress_projects = Project.objects.filter(status='IN_PROGRESS').count()
    
    total_gross_revenue = Payment.objects.filter(status='SUCCESS', payment_type__in=['ADVANCE_30', 'FINAL_70']).aggregate(Sum('amount'))['amount__sum'] or 0
    total_payouts = Task.objects.filter(status='COMPLETED').aggregate(Sum('payout'))['payout__sum'] or 0
    net_agency_profit = float(total_gross_revenue) - float(total_payouts)

    # Employee Profit & Performance Rankings
    employees = User.objects.filter(profile__role='EMPLOYEE')
    employee_rankings = []
    for emp in employees:
        completed_tasks = Task.objects.filter(assigned_employee=emp, status='COMPLETED')
        earned = float(emp.profile.total_earned)
        tasks_count = completed_tasks.count()
        employee_rankings.append({
            'id': emp.id,
            'username': emp.username,
            'sub_role': emp.profile.sub_role,
            'total_earned': earned,
            'completed_tasks_count': tasks_count,
            'avatar_url': emp.profile.avatar_url,
        })

    employee_rankings.sort(key=lambda x: x['total_earned'], reverse=True)

    return Response({
        'total_projects': total_projects,
        'completed_projects': completed_projects,
        'in_progress_projects': in_progress_projects,
        'total_gross_revenue': float(total_gross_revenue),
        'total_developer_payouts': float(total_payouts),
        'net_agency_profit': net_agency_profit,
        'employee_rankings': employee_rankings,
    })


# ---------------------------------------------------------------------------
# Site settings (admin-configurable notification mailbox + public contact info)
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST', 'PATCH'])
def site_settings(request):
    cfg = SiteSetting.load()
    if request.method == 'GET':
        return Response(SiteSettingSerializer(cfg).data)

    serializer = SiteSettingSerializer(cfg, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    AuditLog.objects.create(
        action='Site Settings Updated',
        details=f"Admin alert mailbox set to {cfg.admin_notification_email or 'none'}.",
    )
    return Response(serializer.data)


# ---------------------------------------------------------------------------
# Visitor tracking - logs EVERY person who opens the site, signed in or not
# ---------------------------------------------------------------------------

def _device_from_agent(agent):
    agent = (agent or '').lower()
    if 'ipad' in agent or 'tablet' in agent:
        return 'Tablet'
    if 'mobi' in agent or 'android' in agent or 'iphone' in agent:
        return 'Mobile'
    if not agent:
        return 'Unknown'
    return 'Desktop'


@api_view(['POST'])
def track_visit(request):
    """Called by the frontend on every page view (anonymous included)."""
    data = request.data or {}
    visitor_id = (data.get('visitor_id') or '').strip()
    if not visitor_id:
        return Response({'error': 'visitor_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(pk=data.get('user_id')).first() if data.get('user_id') else None
    agent = (request.META.get('HTTP_USER_AGENT') or '')[:300]
    now = timezone.now()

    visitor, created = VisitorLog.objects.get_or_create(
        visitor_id=visitor_id,
        defaults={'first_seen': now},
    )
    visitor.user = user or visitor.user
    visitor.display_name = (
        (user.get_full_name() or user.username) if user
        else (data.get('display_name') or visitor.display_name or 'Anonymous Visitor')
    )
    visitor.email = (user.email if user else data.get('email')) or visitor.email
    visitor.role = getattr(getattr(user, 'profile', None), 'role', None) or ('VISITOR' if not user else 'CLIENT')
    visitor.path = data.get('path') or '/'
    visitor.referrer = (data.get('referrer') or visitor.referrer or '')[:500] or None
    visitor.ip_address = _client_ip(request)
    visitor.user_agent = agent
    visitor.language = (data.get('language') or '')[:40] or visitor.language
    visitor.timezone_name = (data.get('timezone') or '')[:80] or visitor.timezone_name
    visitor.screen = (data.get('screen') or '')[:40] or visitor.screen
    visitor.device = _device_from_agent(agent)
    if not created:
        visitor.visit_count += 1
    visitor.last_seen = now
    visitor.save()

    VisitorEvent.objects.create(
        visitor=visitor,
        path=visitor.path,
        event_type=data.get('event_type') or 'PAGE_VIEW',
        ip_address=visitor.ip_address,
        user_agent=agent,
        occurred_at=now,
    )

    # Mail the admin the very first time we see this person.
    if created and not visitor.notified:
        if send_admin_alert('New visitor on your website', describe_visitor(visitor), category='visitor'):
            visitor.notified = True
            visitor.save(update_fields=['notified'])

    return Response(VisitorLogSerializer(visitor).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class VisitorLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Searchable visitor console for the admin dashboard."""
    queryset = VisitorLog.objects.prefetch_related('events').all()
    serializer_class = VisitorLogSerializer

    def get_queryset(self):
        qs = VisitorLog.objects.select_related('user').prefetch_related('events').all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role.upper())
        only_anon = self.request.query_params.get('anonymous')
        if only_anon in ('1', 'true', 'True'):
            qs = qs.filter(user__isnull=True)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(display_name__icontains=search) |
                Q(email__icontains=search) |
                Q(ip_address__icontains=search) |
                Q(path__icontains=search) |
                Q(referrer__icontains=search) |
                Q(user__username__icontains=search)
            )
        return qs

    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        visitor = self.get_object()
        return Response(VisitorLogSerializer(visitor).data['events'])


# ---------------------------------------------------------------------------
# Resume download: request -> admin approval -> download
# ---------------------------------------------------------------------------

class ResumeDownloadRequestViewSet(viewsets.ModelViewSet):
    queryset = ResumeDownloadRequest.objects.select_related('requester', 'resume').all()
    serializer_class = ResumeDownloadRequestSerializer

    def get_queryset(self):
        qs = ResumeDownloadRequest.objects.select_related('requester', 'resume').all()
        req_status = self.request.query_params.get('status')
        if req_status:
            qs = qs.filter(status=req_status.upper())
        requester = self.request.query_params.get('requester')
        if requester:
            qs = qs.filter(requester_id=requester)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(requester__username__icontains=search) |
                Q(requester__email__icontains=search) |
                Q(reason__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        requester = User.objects.filter(pk=request.data.get('requester')).first()
        if not requester:
            return Response({'error': 'You must be signed in to request the resume.'},
                            status=status.HTTP_400_BAD_REQUEST)

        existing = ResumeDownloadRequest.objects.filter(
            requester=requester, status__in=['PENDING', 'APPROVED']
        ).first()
        if existing:
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)

        resume = Resume.objects.filter(is_current=True).order_by('-uploaded_at').first()
        obj = ResumeDownloadRequest.objects.create(
            requester=requester,
            resume=resume,
            reason=request.data.get('reason') or '',
        )
        AuditLog.objects.create(
            user=requester,
            action='Resume Download Requested',
            details=f"{requester.username} requested resume access.",
        )
        send_admin_alert(
            'Resume download request awaiting approval',
            [
                f"User: {requester.get_full_name() or requester.username}",
                f"Email: {requester.email or 'not provided'}",
                f"Reason: {obj.reason or 'not provided'}",
                f"Requested at: {obj.created_at:%Y-%m-%d %H:%M:%S} UTC",
                "Approve or reject it from the admin dashboard.",
            ],
            category='resume',
        )
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        obj = self.get_object()
        actor = User.objects.filter(pk=request.data.get('actor_id')).first()
        obj.status = 'APPROVED'
        obj.reviewed_by = actor
        obj.reviewed_at = timezone.now()
        obj.admin_note = request.data.get('note') or obj.admin_note
        if not obj.resume:
            obj.resume = Resume.objects.filter(is_current=True).order_by('-uploaded_at').first()
        obj.save()
        AuditLog.objects.create(
            user=actor,
            action='Resume Download Approved',
            details=f"{obj.requester.username} may now download the resume.",
        )
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        obj = self.get_object()
        actor = User.objects.filter(pk=request.data.get('actor_id')).first()
        obj.status = 'REJECTED'
        obj.reviewed_by = actor
        obj.reviewed_at = timezone.now()
        obj.admin_note = request.data.get('note') or obj.admin_note
        obj.save()
        AuditLog.objects.create(
            user=actor,
            action='Resume Download Rejected',
            details=f"Resume access denied for {obj.requester.username}.",
        )
        return Response(self.get_serializer(obj).data)

    @action(detail=False, methods=['get'], url_path='my-status')
    def my_status(self, request):
        requester_id = request.query_params.get('requester')
        obj = ResumeDownloadRequest.objects.filter(requester_id=requester_id).first()
        current = Resume.objects.filter(is_current=True).order_by('-uploaded_at').first()
        return Response({
            'request': self.get_serializer(obj).data if obj else None,
            'resume_available': bool(current),
            'can_download': bool(obj and obj.status == 'APPROVED' and current),
        })


@api_view(['GET'])
def download_resume(request, request_id):
    """Serve the resume file only for an APPROVED request."""
    obj = ResumeDownloadRequest.objects.filter(pk=request_id).select_related('resume').first()
    if not obj:
        return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
    if obj.status != 'APPROVED':
        return Response({'error': 'Your download is not approved by the admin yet.'},
                        status=status.HTTP_403_FORBIDDEN)

    resume = obj.resume or Resume.objects.filter(is_current=True).order_by('-uploaded_at').first()
    if not resume:
        return Response({'error': 'No resume has been uploaded yet.'}, status=status.HTTP_404_NOT_FOUND)

    obj.download_count += 1
    obj.save(update_fields=['download_count'])
    AuditLog.objects.create(
        user=obj.requester,
        action='Resume Downloaded',
        details=f"{obj.requester.username} downloaded resume v{resume.version}.",
    )

    if resume.file:
        try:
            return FileResponse(resume.file.open('rb'), as_attachment=True,
                                filename=resume.original_name or resume.file.name.split('/')[-1])
        except FileNotFoundError:
            raise Http404('Resume file is missing on disk.')
    return Response({'url': resume.external_url})


# ---------------------------------------------------------------------------
# Sign up
# ---------------------------------------------------------------------------

@api_view(['POST'])
def auth_register(request):
    data = request.data or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return Response({'error': 'Username and password are required.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'That username is already taken.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if email and User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'That email is already registered.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=(data.get('full_name') or '').split(' ')[0][:30],
        last_name=' '.join((data.get('full_name') or '').split(' ')[1:])[:150],
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = 'CLIENT'
    profile.company = data.get('company') or ''
    profile.phone = data.get('phone') or ''
    profile.save()

    record_login(user, request)
    AuditLog.objects.create(user=user, action='User Signed Up',
                            details=f"{username} created an account.")
    send_admin_alert(
        'New account created on your website',
        [
            f"Username: {user.username}",
            f"Name: {user.get_full_name() or 'not provided'}",
            f"Email: {user.email or 'not provided'}",
            f"Phone: {profile.phone or 'not provided'}",
            f"Company: {profile.company or 'not provided'}",
            f"IP address: {_client_ip(request)}",
            f"Device: {request.META.get('HTTP_USER_AGENT', 'unknown')}",
            f"Signed up at: {timezone.now():%Y-%m-%d %H:%M:%S} UTC",
        ],
        category='signup',
    )
    return Response({'user': UserSerializer(user, context={'request': request}).data},
                    status=status.HTTP_201_CREATED)
