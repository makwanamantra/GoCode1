"""Admin e-mail notifications for codemantra.

Every alert goes to the mailbox the admin configured in the dashboard
(`SiteSetting.admin_notification_email`) — never hardcoded to the public
contact address. If no mailbox is configured, sending is skipped silently so
the request never fails because of e-mail problems.
"""
from django.conf import settings
from django.core.mail import EmailMessage

from .models import SiteSetting, AuditLog


def _target_mailbox():
    cfg = SiteSetting.load()
    return cfg, (cfg.admin_notification_email or '').strip()


def send_admin_alert(subject, lines, category='general'):
    """Send a plain-text alert with all captured details. Returns True if sent."""
    cfg, mailbox = _target_mailbox()

    toggles = {
        'visitor': cfg.notify_on_visitor,
        'signup': cfg.notify_on_signup,
        'login': cfg.notify_on_login,
        'resume': cfg.notify_on_resume_request,
    }
    if category in toggles and not toggles[category]:
        return False
    if not mailbox:
        return False

    body = '\n'.join(str(line) for line in lines if line is not None)
    try:
        EmailMessage(
            subject=f"[{cfg.site_name}] {subject}",
            body=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@codemantra.dev'),
            to=[mailbox],
        ).send(fail_silently=True)
    except Exception as exc:  # pragma: no cover - never break the request
        AuditLog.objects.create(
            action='Admin Email Failed',
            details=f"{subject}: {exc}",
        )
        return False

    AuditLog.objects.create(
        action='Admin Email Sent',
        details=f"{subject} -> {mailbox}",
    )
    return True


def describe_visitor(visitor):
    return [
        f"Name: {visitor.display_name}",
        f"Email: {visitor.email or 'not provided'}",
        f"Role: {visitor.role}",
        f"Visitor ID: {visitor.visitor_id}",
        f"Page: {visitor.path or '/'}",
        f"Referrer: {visitor.referrer or 'direct'}",
        f"IP address: {visitor.ip_address or 'unknown'}",
        f"Device: {visitor.device or 'unknown'} | Screen: {visitor.screen or 'unknown'}",
        f"Language: {visitor.language or 'unknown'} | Timezone: {visitor.timezone_name or 'unknown'}",
        f"User agent: {visitor.user_agent or 'unknown'}",
        f"Total visits: {visitor.visit_count}",
        f"First seen: {visitor.first_seen:%Y-%m-%d %H:%M:%S} UTC",
        f"Last seen: {visitor.last_seen:%Y-%m-%d %H:%M:%S} UTC",
    ]
