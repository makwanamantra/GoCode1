from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomRequest, LoginHistory, Project, Resume, ResumeDownloadRequest, UserProfile, VisitorEvent, VisitorLog


class AuthFlowTests(APITestCase):
    def test_register_creates_client_profile_and_login_history(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'username': 'new_client',
                'password': 'client123',
                'email': 'new_client@example.com',
                'full_name': 'New Client',
                'company': 'Acme',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'new_client')
        user = User.objects.get(username='new_client')
        self.assertEqual(user.profile.role, 'CLIENT')
        self.assertEqual(LoginHistory.objects.filter(user=user).count(), 1)

    def test_login_with_valid_credentials_records_history(self):
        user = User.objects.create_user(username='existing_user', password='strongpass123')
        UserProfile.objects.create(user=user, role='EMPLOYEE', sub_role='BACKEND')

        response = self.client.post(
            reverse('auth-login'),
            {'username': 'existing_user', 'password': 'strongpass123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'EMPLOYEE')
        self.assertEqual(LoginHistory.objects.filter(user=user).count(), 1)


class VisitorTrackingTests(APITestCase):
    def test_track_visit_creates_and_updates_existing_visitor(self):
        payload = {
            'visitor_id': 'visitor-123',
            'display_name': 'Guest User',
            'path': '/landing',
            'event_type': 'PAGE_VIEW',
        }
        first = self.client.post(reverse('track-visit'), payload, format='json')
        second = self.client.post(reverse('track-visit'), payload, format='json')

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        visitor = VisitorLog.objects.get(visitor_id='visitor-123')
        self.assertEqual(visitor.visit_count, 2)
        self.assertEqual(VisitorEvent.objects.filter(visitor=visitor).count(), 2)


class RequestToProjectFlowTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='client_one', password='client123')
        UserProfile.objects.create(user=self.client_user, role='CLIENT')
        self.owner = User.objects.create_user(username='owner_one', password='owner123')
        UserProfile.objects.create(user=self.owner, role='OWNER')

    def test_client_accept_offer_creates_project(self):
        req = CustomRequest.objects.create(
            client=self.client_user,
            title='Analytics Dashboard',
            description='Need a dashboard',
            category='SaaS Platform',
            user_budget=Decimal('5000.00'),
            admin_proposed_price=Decimal('6000.00'),
            status='ADMIN_OFFER',
        )

        response = self.client.post(f'/api/custom-requests/{req.id}/client_accept/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'APPROVED')
        project = Project.objects.get(custom_request=req)
        self.assertEqual(project.total_budget, Decimal('6000.00'))
        self.assertEqual(project.advance_amount, Decimal('1800.00'))

    def test_resume_request_approval_enables_download(self):
        resume = Resume.objects.create(
            user=self.owner,
            external_url='https://example.com/resume.pdf',
            original_name='resume.pdf',
            is_current=True,
        )

        create_response = self.client.post(
            '/api/resume-requests/',
            {'requester': self.client_user.id, 'reason': 'For hiring review'},
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        request_id = create_response.data['id']
        approve_response = self.client.post(
            f'/api/resume-requests/{request_id}/approve/',
            {'actor_id': self.owner.id},
            format='json',
        )
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_response.data['status'], 'APPROVED')

        download_response = self.client.get(f'/api/resume-download/{request_id}/')
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.data['url'], resume.external_url)

        req = ResumeDownloadRequest.objects.get(id=request_id)
        self.assertEqual(req.download_count, 1)
