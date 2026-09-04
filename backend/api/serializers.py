from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, ProjectTemplate, CustomRequest, Project, Task,
    Deliverable, ChatMessage, Payment, AuditLog, Resume, LoginHistory,
    SiteSetting, VisitorLog, VisitorEvent, ResumeDownloadRequest
)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'sub_role', 'company', 'phone', 'avatar_url', 'total_earned']


class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True, default='System')

    class Meta:
        model = Resume
        fields = [
            'id', 'user', 'file', 'file_url', 'external_url', 'original_name',
            'version', 'is_current', 'notes', 'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['version', 'is_current', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        return obj.external_url


class LoginHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LoginHistory
        fields = ['id', 'user', 'username', 'role', 'ip_address', 'user_agent', 'login_time', 'logout_time']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    login_count = serializers.SerializerMethodField()
    last_login_at = serializers.SerializerMethodField()
    current_resume = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'profile', 'login_count', 'last_login_at', 'current_resume', 'date_joined'
        ]

    def get_full_name(self, obj):
        return (f"{obj.first_name} {obj.last_name}").strip() or obj.username

    def get_login_count(self, obj):
        return obj.login_history.count()

    def get_last_login_at(self, obj):
        latest = obj.login_history.first()
        return latest.login_time if latest else None

    def get_current_resume(self, obj):
        resume = obj.resumes.filter(is_current=True).first()
        return ResumeSerializer(resume, context=self.context).data if resume else None


class ProjectTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTemplate
        fields = '__all__'


class CustomRequestSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)

    class Meta:
        model = CustomRequest
        fields = '__all__'

<<<<<<< HEAD
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Title is required.')
        return value.strip()

    def validate_user_budget(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('Budget must be greater than zero.')
        return value

=======
>>>>>>> 6d0e7a91a3a313c6eaf65e02dca23891615345ea

class TaskSerializer(serializers.ModelSerializer):
    assigned_employee_name = serializers.CharField(source='assigned_employee.username', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'


class DeliverableSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = Deliverable
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    """Chat messages belong to either a project or a custom request.

    `sender_name` / `sender_role` are denormalised snapshots: clients may omit
    them and the viewset fills them in from the sender account/profile.
    """

    class Meta:
        model = ChatMessage
        fields = '__all__'
        extra_kwargs = {
            'sender_name': {'required': False, 'allow_blank': True},
            'sender_role': {'required': False, 'allow_blank': True},
        }

    def validate_message(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        return value.strip()

    def validate(self, attrs):
        project = attrs.get('project', getattr(self.instance, 'project', None))
        custom_request = attrs.get('custom_request', getattr(self.instance, 'custom_request', None))
        if not project and not custom_request:
            raise serializers.ValidationError(
                'A chat message must reference either a project or a custom_request.'
            )
        return attrs
=======
    class Meta:
        model = ChatMessage
        fields = '__all__'
>>>>>>> 6d0e7a91a3a313c6eaf65e02dca23891615345ea


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = '__all__'


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = [
            'id', 'site_name', 'public_email', 'public_phone',
            'admin_notification_email', 'notify_on_visitor', 'notify_on_signup',
            'notify_on_login', 'notify_on_resume_request', 'updated_at'
        ]


class VisitorEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorEvent
        fields = ['id', 'path', 'event_type', 'ip_address', 'user_agent', 'occurred_at']


class VisitorLogSerializer(serializers.ModelSerializer):
    events = VisitorEventSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True, default=None)

    class Meta:
        model = VisitorLog
        fields = [
            'id', 'visitor_id', 'user', 'username', 'display_name', 'email', 'role',
            'path', 'referrer', 'ip_address', 'user_agent', 'language', 'timezone_name',
            'screen', 'device', 'visit_count', 'first_seen', 'last_seen', 'events'
        ]


class ResumeDownloadRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    requester_email = serializers.CharField(source='requester.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, default=None)
    resume_detail = ResumeSerializer(source='resume', read_only=True)

    class Meta:
        model = ResumeDownloadRequest
        fields = [
            'id', 'requester', 'requester_name', 'requester_email', 'resume', 'resume_detail',
            'reason', 'status', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'admin_note', 'download_count', 'created_at'
        ]
        read_only_fields = ['status', 'reviewed_by', 'reviewed_at', 'download_count']
