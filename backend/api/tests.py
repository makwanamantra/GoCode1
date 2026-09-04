<<<<<<< HEAD
"""End-to-end API tests for the agency workflow.

Covers: auth (register/login/logout), custom requests, the admin offer ->
client accept -> project pipeline, payments, tasks, deliverables, chat threads
and analytics.

Run with:  python manage.py test api -v 2
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import (
    AuditLog, ChatMessage, CustomRequest, Deliverable, LoginHistory, Payment,
    Project, ProjectTemplate, Task, UserProfile,
)


def make_user(username, role='CLIENT', sub_role='NONE', password='pass1234', **extra):
    user = User.objects.create_user(username=username, password=password,
                                    email=f'{username}@example.com', **extra)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = role
    profile.sub_role = sub_role
    profile.save()
    return user


class AuthFlowTests(TestCase):
    def test_register_creates_client_profile(self):
        res = self.client.post('/api/auth/register/', {
            'username': 'newclient',
            'email': 'new@client.com',
            'password': 'secret123',
            'full_name': 'New Client',
            'company': 'Acme',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 201, res.content)
        user = User.objects.get(username='newclient')
        self.assertEqual(user.profile.role, 'CLIENT')
        self.assertEqual(user.profile.company, 'Acme')
        self.assertTrue(LoginHistory.objects.filter(user=user).exists())

    def test_register_rejects_short_password_and_duplicates(self):
        make_user('taken')
        short = self.client.post('/api/auth/register/', {'username': 'x', 'password': '123'},
                                 content_type='application/json')
        self.assertEqual(short.status_code, 400)

        dup = self.client.post('/api/auth/register/', {'username': 'TAKEN', 'password': 'secret123'},
                               content_type='application/json')
        self.assertEqual(dup.status_code, 400)

    def test_login_success_and_failure(self):
        make_user('lisa', role='CLIENT')
        ok = self.client.post('/api/auth/login/', {'username': 'lisa', 'password': 'pass1234'},
                              content_type='application/json')
        self.assertEqual(ok.status_code, 200, ok.content)
        self.assertEqual(ok.json()['role'], 'CLIENT')
        self.assertEqual(ok.json()['user']['username'], 'lisa')

        bad = self.client.post('/api/auth/login/', {'username': 'lisa', 'password': 'nope'},
                               content_type='application/json')
        self.assertEqual(bad.status_code, 401)

        missing = self.client.post('/api/auth/login/', {}, content_type='application/json')
        self.assertEqual(missing.status_code, 400)

    def test_logout_closes_open_session(self):
        user = make_user('logan')
        self.client.post('/api/auth/login/', {'username': 'logan', 'password': 'pass1234'},
                         content_type='application/json')
        res = self.client.post('/api/auth/logout/', {'user_id': user.id},
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(LoginHistory.objects.filter(user=user).first().logout_time)


class CustomRequestFlowTests(TestCase):
    def setUp(self):
        self.client_user = make_user('clara', role='CLIENT')
        self.other_client = make_user('otto', role='CLIENT')

    def _create_request(self, client_user=None, **overrides):
        payload = {
            'client': (client_user or self.client_user).id,
            'title': 'AI Dashboard',
            'description': 'Realtime analytics dashboard',
            'category': 'WEB',
            'user_budget': '5000.00',
        }
        payload.update(overrides)
        return self.client.post('/api/custom-requests/', payload, content_type='application/json')

    def test_client_can_submit_request(self):
        res = self._create_request()
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['status'], 'PENDING')
        self.assertEqual(body['client_name'], 'clara')
        self.assertTrue(AuditLog.objects.filter(action='Custom Request Submitted').exists())

    def test_request_validation(self):
        no_title = self._create_request(title='   ')
        self.assertEqual(no_title.status_code, 400)

        bad_budget = self._create_request(user_budget='-10')
        self.assertEqual(bad_budget.status_code, 400)

        no_client = self.client.post('/api/custom-requests/', {
            'title': 'x', 'description': 'y', 'category': 'WEB', 'user_budget': '10'
        }, content_type='application/json')
        self.assertEqual(no_client.status_code, 400)

    def test_requests_can_be_filtered_per_client(self):
        self._create_request()
        self._create_request(client_user=self.other_client, title='Other project')

        res = self.client.get(f'/api/custom-requests/?client={self.client_user.id}')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'AI Dashboard')

        pending = self.client.get('/api/custom-requests/?status=PENDING')
        self.assertEqual(len(pending.json()), 2)

    def test_admin_offer_requires_valid_price_and_date(self):
        req_id = self._create_request().json()['id']

        missing = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/',
                                   {'action': 'OFFER'}, content_type='application/json')
        self.assertEqual(missing.status_code, 400)

        negative = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/', {
            'action': 'OFFER', 'proposed_price': '-500', 'predicted_date': '2026-01-01'
        }, content_type='application/json')
        self.assertEqual(negative.status_code, 400)

        junk = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/', {
            'action': 'OFFER', 'proposed_price': 'abc', 'predicted_date': '2026-01-01'
        }, content_type='application/json')
        self.assertEqual(junk.status_code, 400)

        self.assertEqual(CustomRequest.objects.get(pk=req_id).status, 'PENDING')

    def test_full_offer_accept_pipeline_creates_project(self):
        req_id = self._create_request().json()['id']
        target = (date.today() + timedelta(days=30)).isoformat()

        offer = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/', {
            'action': 'OFFER', 'proposed_price': '6000', 'predicted_date': target,
        }, content_type='application/json')
        self.assertEqual(offer.status_code, 200, offer.content)
        self.assertEqual(offer.json()['request']['status'], 'ADMIN_OFFER')

        accept = self.client.post(f'/api/custom-requests/{req_id}/client_accept/', {},
                                  content_type='application/json')
        self.assertEqual(accept.status_code, 200, accept.content)
        project = accept.json()['project']
        self.assertEqual(project['title'], 'AI Dashboard')
        self.assertEqual(Decimal(project['total_budget']), Decimal('6000.00'))
        self.assertEqual(Decimal(project['advance_amount']), Decimal('1800.00'))
        self.assertEqual(project['status'], 'IN_PROGRESS')
        self.assertEqual(accept.json()['request']['status'], 'APPROVED')

        # Accepting twice must not create a second project.
        again = self.client.post(f'/api/custom-requests/{req_id}/client_accept/', {},
                                 content_type='application/json')
        self.assertEqual(again.status_code, 400)
        self.assertEqual(Project.objects.count(), 1)

    def test_admin_reject_and_no_offer_after_decision(self):
        req_id = self._create_request().json()['id']
        rej = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/', {'action': 'REJECT'},
                               content_type='application/json')
        self.assertEqual(rej.json()['request']['status'], 'REJECTED')

        late_offer = self.client.post(f'/api/custom-requests/{req_id}/admin_respond/', {
            'action': 'OFFER', 'proposed_price': '100', 'predicted_date': '2026-05-05'
        }, content_type='application/json')
        self.assertEqual(late_offer.status_code, 400)

    def test_client_edit_budget(self):
        req_id = self._create_request().json()['id']
        ok = self.client.post(f'/api/custom-requests/{req_id}/edit_budget/', {'new_budget': '7500'},
                              content_type='application/json')
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(Decimal(ok.json()['request']['user_budget']), Decimal('7500.00'))

        bad = self.client.post(f'/api/custom-requests/{req_id}/edit_budget/', {'new_budget': '0'},
                               content_type='application/json')
        self.assertEqual(bad.status_code, 400)


class ProjectAndPaymentTests(TestCase):
    def setUp(self):
        self.client_user = make_user('pia', role='CLIENT')
        self.project = Project.objects.create(
            client=self.client_user, title='Storefront', description='Shop build',
            total_budget=Decimal('4000.00'), advance_amount=Decimal('1200.00'),
        )

    def test_pay_advance_records_payment_once(self):
        res = self.client.post(f'/api/projects/{self.project.id}/pay_advance/', {},
                               content_type='application/json')
        self.assertEqual(res.status_code, 200, res.content)
        self.project.refresh_from_db()
        self.assertTrue(self.project.advance_paid)
        self.assertEqual(Payment.objects.filter(project=self.project).count(), 1)

        dup = self.client.post(f'/api/projects/{self.project.id}/pay_advance/', {},
                               content_type='application/json')
        self.assertEqual(dup.status_code, 400)
        self.assertEqual(Payment.objects.filter(project=self.project).count(), 1)

    def test_projects_filter_by_client_and_status(self):
        other = make_user('quinn', role='CLIENT')
        Project.objects.create(client=other, title='Other', description='d',
                               total_budget=Decimal('100'), status='COMPLETED')

        mine = self.client.get(f'/api/projects/?client={self.client_user.id}').json()
        self.assertEqual([p['title'] for p in mine], ['Storefront'])

        done = self.client.get('/api/projects/?status=COMPLETED').json()
        self.assertEqual([p['title'] for p in done], ['Other'])

    def test_project_can_be_cancelled_and_completed_via_patch(self):
        res = self.client.patch(f'/api/projects/{self.project.id}/', {'status': 'CANCELLED'},
                                content_type='application/json')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()['status'], 'CANCELLED')


class TaskAndDeliverableTests(TestCase):
    def setUp(self):
        self.client_user = make_user('carl', role='CLIENT')
        self.employee = make_user('alex', role='EMPLOYEE', sub_role='FRONTEND')
        self.project = Project.objects.create(
            client=self.client_user, title='Portal', description='Portal build',
            total_budget=Decimal('9000.00'), advance_amount=Decimal('2700.00'),
        )

    def test_assign_task_and_update_status(self):
        created = self.client.post('/api/tasks/', {
            'project': self.project.id,
            'assigned_employee': self.employee.id,
            'role_type': 'FRONTEND',
            'title': 'Build landing page',
            'description': 'Hero + pricing',
            'payout': '800.00',
        }, content_type='application/json')
        self.assertEqual(created.status_code, 201, created.content)
        task_id = created.json()['id']
        self.assertEqual(created.json()['assigned_employee_name'], 'alex')
        self.assertTrue(AuditLog.objects.filter(action='Task Assigned').exists())

        ok = self.client.post(f'/api/tasks/{task_id}/update_status/', {'status': 'COMPLETED'},
                              content_type='application/json')
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(Task.objects.get(pk=task_id).status, 'COMPLETED')

        bad = self.client.post(f'/api/tasks/{task_id}/update_status/', {'status': 'NOPE'},
                               content_type='application/json')
        self.assertEqual(bad.status_code, 400)

    def test_tasks_filter_by_employee_and_project(self):
        Task.objects.create(project=self.project, assigned_employee=self.employee,
                            title='A', description='a')
        other_emp = make_user('sara', role='EMPLOYEE', sub_role='BACKEND')
        Task.objects.create(project=self.project, assigned_employee=other_emp,
                            title='B', description='b')

        mine = self.client.get(f'/api/tasks/?assigned_employee={self.employee.id}').json()
        self.assertEqual([t['title'] for t in mine], ['A'])
        self.assertEqual(len(self.client.get(f'/api/tasks/?project={self.project.id}').json()), 2)

    def test_submit_deliverable(self):
        task = Task.objects.create(project=self.project, assigned_employee=self.employee,
                                   title='API', description='endpoints')
        res = self.client.post('/api/deliverables/', {
            'project': self.project.id,
            'task': task.id,
            'uploaded_by': self.employee.id,
            'title': 'v1 build',
            'description': 'First cut',
            'file_url': 'https://example.com/build.zip',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()['uploaded_by_name'], 'alex')
        self.assertEqual(Deliverable.objects.filter(project=self.project).count(), 1)

        scoped = self.client.get(f'/api/deliverables/?project={self.project.id}').json()
        self.assertEqual(len(scoped), 1)


class ChatTests(TestCase):
    def setUp(self):
        self.client_user = make_user('cleo', role='CLIENT', first_name='Cleo', last_name='Kim')
        self.owner = make_user('boss', role='OWNER')
        self.project_a = Project.objects.create(client=self.client_user, title='A',
                                                description='a', total_budget=Decimal('100'))
        self.project_b = Project.objects.create(client=self.client_user, title='B',
                                                description='b', total_budget=Decimal('200'))

    def _send(self, **payload):
        return self.client.post('/api/chat-messages/', payload, content_type='application/json')

    def test_send_message_fills_sender_identity(self):
        res = self._send(project=self.project_a.id, sender=self.client_user.id,
                         message='  Hello team  ')
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['message'], 'Hello team')
        self.assertEqual(body['sender_name'], 'Cleo Kim')
        self.assertEqual(body['sender_role'], 'CLIENT')

    def test_message_requires_thread_and_content(self):
        orphan = self._send(sender=self.client_user.id, message='hi')
        self.assertEqual(orphan.status_code, 400)

        empty = self._send(project=self.project_a.id, sender=self.client_user.id, message='   ')
        self.assertEqual(empty.status_code, 400)

    def test_messages_are_scoped_to_their_thread(self):
        self._send(project=self.project_a.id, sender=self.client_user.id, message='about A')
        self._send(project=self.project_b.id, sender=self.owner.id, message='about B')

        thread_a = self.client.get(f'/api/chat-messages/?project={self.project_a.id}').json()
        self.assertEqual([m['message'] for m in thread_a], ['about A'])

        thread_b = self.client.get(f'/api/chat-messages/?project={self.project_b.id}').json()
        self.assertEqual([m['message'] for m in thread_b], ['about B'])

    def test_budget_proposal_message(self):
        res = self._send(project=self.project_a.id, sender=self.owner.id,
                         message='Revised budget', budget_proposal='2500.00')
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(Decimal(res.json()['budget_proposal']), Decimal('2500.00'))

    def test_request_chat_moves_to_project_on_accept(self):
        req = CustomRequest.objects.create(client=self.client_user, title='Chatty request',
                                           description='d', category='WEB',
                                           user_budget=Decimal('1000'), status='ADMIN_OFFER',
                                           admin_proposed_price=Decimal('1200'))
        self._send(custom_request=req.id, sender=self.client_user.id, message='pre-sales question')

        accept = self.client.post(f'/api/custom-requests/{req.id}/client_accept/', {},
                                  content_type='application/json')
        project_id = accept.json()['project']['id']

        moved = self.client.get(f'/api/chat-messages/?project={project_id}').json()
        self.assertEqual([m['message'] for m in moved], ['pre-sales question'])
        self.assertEqual(ChatMessage.objects.filter(custom_request=req).count(), 1)


class TemplateAndAnalyticsTests(TestCase):
    def setUp(self):
        self.owner = make_user('owner1', role='OWNER')
        self.client_user = make_user('cindy', role='CLIENT')

    def test_template_crud(self):
        res = self.client.post('/api/templates/', {
            'title': 'SaaS Starter', 'description': 'Full stack starter',
            'category': 'WEB', 'price': '1500.00',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 201, res.content)
        tmpl_id = res.json()['id']
        self.assertEqual(len(self.client.get('/api/templates/').json()), 1)

        upd = self.client.patch(f'/api/templates/{tmpl_id}/', {'price': '1750.00'},
                                content_type='application/json')
        self.assertEqual(Decimal(upd.json()['price']), Decimal('1750.00'))

        self.assertEqual(self.client.delete(f'/api/templates/{tmpl_id}/').status_code, 204)
        self.assertEqual(ProjectTemplate.objects.count(), 0)

    def test_analytics_overview(self):
        project = Project.objects.create(client=self.client_user, title='P', description='d',
                                         total_budget=Decimal('5000'), advance_amount=Decimal('1500'))
        Payment.objects.create(project=project, client=self.client_user, amount=Decimal('1500'),
                               payment_type='ADVANCE_30', transaction_id='T1')

        res = self.client.get('/api/analytics/')
        self.assertEqual(res.status_code, 200, res.content)
        body = res.json()
        for key in ('total_gross_revenue', 'total_developer_payouts', 'net_agency_profit',
                    'total_projects', 'employee_rankings'):
            self.assertIn(key, body)
        self.assertEqual(Decimal(str(body['total_gross_revenue'])), Decimal('1500'))

    def test_users_endpoint_lists_roles(self):
        res = self.client.get('/api/users/')
        self.assertEqual(res.status_code, 200)
        usernames = {u['username'] for u in res.json()}
        self.assertTrue({'owner1', 'cindy'}.issubset(usernames))
=======
from django.test import TestCase

# Create your tests here.
>>>>>>> 6d0e7a91a3a313c6eaf65e02dca23891615345ea
