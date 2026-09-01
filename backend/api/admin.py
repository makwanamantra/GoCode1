from django.contrib import admin

from .models import (
    UserProfile, ProjectTemplate, CustomRequest, Project, Task,
    Deliverable, ChatMessage, Payment, AuditLog, Resume, LoginHistory,
    SiteSetting, VisitorLog, VisitorEvent, ResumeDownloadRequest
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'sub_role', 'company', 'total_earned')
    list_filter = ('role', 'sub_role')
    search_fields = ('user__username', 'user__email', 'company')


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('user', 'version', 'is_current', 'uploaded_by', 'uploaded_at')
    list_filter = ('is_current',)
    search_fields = ('user__username', 'original_name')


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'login_time', 'ip_address')
    list_filter = ('role',)
    search_fields = ('user__username', 'ip_address')


for model in (ProjectTemplate, CustomRequest, Project, Task, Deliverable, ChatMessage, Payment, AuditLog):
    admin.site.register(model)


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'public_email', 'admin_notification_email', 'updated_at')


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'role', 'ip_address', 'path', 'visit_count', 'last_seen')
    list_filter = ('role', 'device')
    search_fields = ('display_name', 'email', 'ip_address', 'path', 'visitor_id')


@admin.register(VisitorEvent)
class VisitorEventAdmin(admin.ModelAdmin):
    list_display = ('visitor', 'event_type', 'path', 'occurred_at')


@admin.register(ResumeDownloadRequest)
class ResumeDownloadRequestAdmin(admin.ModelAdmin):
    list_display = ('requester', 'status', 'reviewed_by', 'download_count', 'created_at')
    list_filter = ('status',)
    search_fields = ('requester__username', 'requester__email')
