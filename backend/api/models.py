from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

ROLE_CHOICES = (
    ('OWNER', 'Owner / Admin'),
    ('EMPLOYEE', 'Employee / Developer'),
    ('CLIENT', 'Client'),
)

SUB_ROLE_CHOICES = (
    ('FRONTEND', 'Frontend Developer'),
    ('BACKEND', 'Backend Developer'),
    ('UIUX', 'UI/UX Designer'),
    ('FULLSTACK', 'Fullstack Engineer'),
    ('DEVOPS', 'DevOps / Infrastructure'),
    ('NONE', 'None'),
)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENT')
    sub_role = models.CharField(max_length=20, choices=SUB_ROLE_CHOICES, default='NONE')
    company = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar_url = models.CharField(max_length=255, blank=True, null=True)
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class ProjectTemplate(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50) # SaaS, 3D WebGL, E-Commerce, Mobile, AI/ML, Portfolio
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    preview_video_url = models.CharField(max_length=500)
    demo_url = models.CharField(max_length=500, blank=True, null=True)
    tags = models.CharField(max_length=250, help_text="Comma separated tags", default="React, ThreeJS")
    rating = models.FloatField(default=4.9)
    downloads_count = models.IntegerField(default=120)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CustomRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Admin Review'),
        ('ADMIN_OFFER', 'Price & Delivery Offered'),
        ('APPROVED', 'Approved by Client'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50)
    user_budget = models.DecimalField(max_digits=10, decimal_places=2)
    admin_proposed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    admin_predicted_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.client.username}"


class Project(models.Model):
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('UNDER_REVIEW', 'Under Review'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    custom_request = models.ForeignKey(CustomRequest, on_delete=models.SET_NULL, null=True, blank=True)
    template = models.ForeignKey(ProjectTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    advance_paid = models.BooleanField(default=False)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_paid = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='IN_PROGRESS')
    approved_date = models.DateTimeField(auto_now_add=True)
    predicted_completion_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Task(models.Model):
    STATUS_CHOICES = (
        ('TO_DO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('IN_REVIEW', 'In Review'),
        ('COMPLETED', 'Completed'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assigned_employee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    role_type = models.CharField(max_length=20, choices=SUB_ROLE_CHOICES, default='FRONTEND')
    title = models.CharField(max_length=200)
    description = models.TextField()
    payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TO_DO')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.role_type})"


class Deliverable(models.Model):
    STATUS_CHOICES = (
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved by Admin'),
        ('REJECTED', 'Needs Revision'),
    )

    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliverables')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deliverables')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    code_url = models.CharField(max_length=500, blank=True, null=True)
    video_demo_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.uploaded_by.username}"


class ChatMessage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_messages')
    custom_request = models.ForeignKey(CustomRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    sender_name = models.CharField(max_length=100)
    sender_role = models.CharField(max_length=50)
    message = models.TextField()
    budget_proposal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender_name}: {self.message[:30]}"


class Payment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20) # ADVANCE_30, FINAL_70, REFUND
    transaction_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=150)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class Resume(models.Model):
    """Resume / CV document attached to a user.

    Admins can upload and re-upload; every re-upload creates a new version so the
    full history stays auditable. `is_current` marks the active document.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/', blank=True, null=True)
    external_url = models.CharField(max_length=500, blank=True, null=True)
    original_name = models.CharField(max_length=255, blank=True, null=True)
    version = models.PositiveIntegerField(default=1)
    is_current = models.BooleanField(default=True)
    notes = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_resumes'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version', '-uploaded_at']

    def __str__(self):
        return f"Resume v{self.version} - {self.user.username}"


class LoginHistory(models.Model):
    """One row per successful sign-in, powering the expandable admin log view."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENT')
    ip_address = models.CharField(max_length=64, blank=True, null=True)
    user_agent = models.CharField(max_length=300, blank=True, null=True)
    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-login_time']
        verbose_name_plural = 'Login history'

    def __str__(self):
        return f"{self.user.username} @ {self.login_time:%Y-%m-%d %H:%M}"


class SiteSetting(models.Model):
    """Single-row configuration the admin edits from the dashboard.

    `admin_notification_email` is the mailbox that receives visitor/user
    alerts. It is intentionally NOT the public contact address, so the admin
    can route notifications wherever they like.
    """
    site_name = models.CharField(max_length=100, default='codemantra')
    public_email = models.EmailField(default='codemantracore@gmail.com')
    public_phone = models.CharField(max_length=40, default='7433937560')
    admin_notification_email = models.EmailField(
        blank=True, null=True,
        help_text='Where visitor/user activity alerts are sent. Set by the admin.'
    )
    notify_on_visitor = models.BooleanField(default=True)
    notify_on_signup = models.BooleanField(default=True)
    notify_on_login = models.BooleanField(default=True)
    notify_on_resume_request = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site setting'

    def __str__(self):
        return f"{self.site_name} settings"

    @classmethod
    def load(cls):
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj


class VisitorLog(models.Model):
    """Every hit on the site, signed in or purely anonymous."""
    visitor_id = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits'
    )
    display_name = models.CharField(max_length=150, default='Anonymous Visitor')
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=20, default='VISITOR')
    path = models.CharField(max_length=300, blank=True, null=True)
    referrer = models.CharField(max_length=500, blank=True, null=True)
    ip_address = models.CharField(max_length=64, blank=True, null=True)
    user_agent = models.CharField(max_length=300, blank=True, null=True)
    language = models.CharField(max_length=40, blank=True, null=True)
    timezone_name = models.CharField(max_length=80, blank=True, null=True)
    screen = models.CharField(max_length=40, blank=True, null=True)
    device = models.CharField(max_length=40, blank=True, null=True)
    visit_count = models.PositiveIntegerField(default=1)
    first_seen = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(default=timezone.now)
    notified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-last_seen']

    def __str__(self):
        return f"{self.display_name} ({self.visitor_id[:8]})"


class VisitorEvent(models.Model):
    """Expandable per-visit detail rows for a VisitorLog."""
    visitor = models.ForeignKey(VisitorLog, on_delete=models.CASCADE, related_name='events')
    path = models.CharField(max_length=300, blank=True, null=True)
    event_type = models.CharField(max_length=40, default='PAGE_VIEW')
    ip_address = models.CharField(max_length=64, blank=True, null=True)
    user_agent = models.CharField(max_length=300, blank=True, null=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-occurred_at']


class ResumeDownloadRequest(models.Model):
    """A signed-in user asks for the resume; only an approved request unlocks it."""
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='resume_requests'
    )
    resume = models.ForeignKey(
        Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name='download_requests'
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_resume_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_note = models.CharField(max_length=255, blank=True, null=True)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.requester.username} -> resume [{self.status}]"
