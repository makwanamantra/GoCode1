from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    UserViewSet, ProjectTemplateViewSet, CustomRequestViewSet,
    ProjectViewSet, TaskViewSet, DeliverableViewSet,
    ChatMessageViewSet, AuditLogViewSet, LoginHistoryViewSet,
    analytics_overview, auth_login, auth_logout, auth_register,
    VisitorLogViewSet, ResumeDownloadRequestViewSet,
    site_settings, track_visit, download_resume
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'templates', ProjectTemplateViewSet)
router.register(r'custom-requests', CustomRequestViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'deliverables', DeliverableViewSet)
router.register(r'chat-messages', ChatMessageViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'login-history', LoginHistoryViewSet)
router.register(r'visitors', VisitorLogViewSet)
router.register(r'resume-requests', ResumeDownloadRequestViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/analytics/', analytics_overview, name='analytics'),
    path('api/auth/login/', auth_login, name='auth-login'),
    path('api/auth/logout/', auth_logout, name='auth-logout'),
    path('api/auth/register/', auth_register, name='auth-register'),
    path('api/site-settings/', site_settings, name='site-settings'),
    path('api/track-visit/', track_visit, name='track-visit'),
    path('api/resume-download/<int:request_id>/', download_resume, name='resume-download'),
    path('api/', include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
