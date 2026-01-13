"""
Tests for Manager Moderation functionality
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from app.users.models import User, Manager
from app.admindashboard.models import ManagerRequest, ManagerRequestSportType, ManagerSuspension, AdminActionLog
from app.facilities.models import Facility, FacilitySportType, SportType


class ManagerModerationTestCase(TestCase):
    """Test manager moderation endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )

        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            name='Regular User',
            password='testpass123'
        )

        # Create manager user
        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        # Create sport types for testing
        self.basketball = SportType.objects.create(sport_name='Basketball')
        self.tennis = SportType.objects.create(sport_name='Tennis')

        # Authenticate as admin using force_authenticate for tests
        self.client.force_authenticate(user=self.admin_user)

    def test_list_managers_requires_admin(self):
        """Test that listing managers requires admin permission"""
        # Try without authentication
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/admin/managers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_managers_success(self):
        """Test successful manager listing"""
        response = self.client.get('/api/admin/managers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns a plain list when not paginated
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'manager@test.com')

    def test_manager_detail(self):
        """Test retrieving manager details"""
        response = self.client.get(f'/api/admin/managers/{self.manager_user.user_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['email'], 'manager@test.com')
        self.assertIn('facilities', response.data['data'])
        self.assertIn('suspension_history', response.data['data'])

    def test_approve_manager_application_missing_reason(self):
        """Test that approving manager application requires reason"""
        manager_request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage facilities',
            facility_name='Test Facility',
            facility_address='123 Test St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{manager_request.request_id}/approve/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_approve_manager_application_reason_too_short(self):
        """Test that reason must be at least 10 characters"""
        manager_request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage facilities',
            facility_name='Test Facility',
            facility_address='123 Test St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{manager_request.request_id}/approve/',
            data={'reason': 'Short'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_approve_manager_application_success(self):
        """Test successful manager application approval"""
        manager_request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage facilities',
            facility_name='Test Facility',
            facility_address='123 Test St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney',
            proposed_latitude=-33.8688,
            proposed_longitude=151.2093,
            court_count=5,
            operating_hours={'Monday': '9am-9pm', 'Tuesday': '9am-9pm'}
        )

        # Add sport types to the manager request
        ManagerRequestSportType.objects.create(
            request=manager_request,
            sport_type=self.basketball
        )
        ManagerRequestSportType.objects.create(
            request=manager_request,
            sport_type=self.tennis
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{manager_request.request_id}/approve/',
            data={'reason': 'Approved due to good business plan and experience'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify manager account created
        self.assertTrue(Manager.objects.filter(user=self.regular_user).exists())
        manager = Manager.objects.get(user=self.regular_user)

        # Verify facility was created and auto-approved
        self.assertTrue(Facility.objects.filter(
            facility_name='Test Facility',
            manager=manager
        ).exists())
        facility = Facility.objects.get(facility_name='Test Facility', manager=manager)
        self.assertEqual(facility.address, '123 Test St')
        self.assertEqual(facility.timezone, 'Australia/Sydney')
        self.assertEqual(float(facility.latitude), -33.8688)
        self.assertEqual(float(facility.longitude), 151.2093)
        self.assertEqual(facility.court_count, 5)
        self.assertEqual(facility.operating_hours, {'Monday': '9am-9pm', 'Tuesday': '9am-9pm'})
        self.assertEqual(facility.approval_status, 'approved')
        self.assertEqual(facility.approved_by, self.admin_user)
        self.assertIsNotNone(facility.approved_at)
        self.assertEqual(facility.submitted_by, self.regular_user)

        # Verify sport types were copied to facility
        facility_sport_types = FacilitySportType.objects.filter(facility=facility)
        self.assertEqual(facility_sport_types.count(), 2)
        sport_type_names = [fst.sport_type.sport_name for fst in facility_sport_types]
        self.assertIn('Basketball', sport_type_names)
        self.assertIn('Tennis', sport_type_names)

        # Verify request updated
        manager_request.refresh_from_db()
        self.assertEqual(manager_request.status, 'approved')
        self.assertEqual(manager_request.admin_user, self.admin_user)
        self.assertIsNotNone(manager_request.decided_at)
        self.assertEqual(manager_request.approved_facility, facility)

        # Verify admin action logged
        self.assertTrue(AdminActionLog.objects.filter(
            admin_user=self.admin_user,
            action_name='approve_manager_application',
            resource_id=manager_request.request_id
        ).exists())

        # Verify response includes facility info
        self.assertIn('facility_id', response.data['data'])
        self.assertIn('facility_name', response.data['data'])
        self.assertEqual(response.data['data']['facility_name'], 'Test Facility')

    def test_reject_manager_application_success(self):
        """Test successful manager application rejection"""
        manager_request = ManagerRequest.objects.create(
            user=self.regular_user,
            status='pending',
            reason='Want to manage facilities',
            facility_name='Test Facility',
            facility_address='123 Test St',
            contact_phone='1234567890',
            proposed_timezone='Australia/Sydney'
        )

        response = self.client.post(
            f'/api/admin/managers/applications/{manager_request.request_id}/reject/',
            data={'reason': 'Rejected due to insufficient business experience and unclear plan'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify request updated
        manager_request.refresh_from_db()
        self.assertEqual(manager_request.status, 'rejected')

        # Verify no manager account created
        self.assertFalse(Manager.objects.filter(user=self.regular_user).exists())

        # Verify no facility was created
        self.assertFalse(Facility.objects.filter(facility_name='Test Facility').exists())

        # Verify approved_facility is still null
        self.assertIsNone(manager_request.approved_facility)

    def test_suspend_manager_missing_reason(self):
        """Test that suspending manager requires reason"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_suspend_manager_with_duration(self):
        """Test suspending manager with duration"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={
                'reason': 'Suspended for 14 days due to policy violations and user complaints',
                'duration_days': 14
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify manager suspended
        self.manager.refresh_from_db()
        self.assertTrue(self.manager.is_suspended)

        # Verify suspension record created
        suspension = ManagerSuspension.objects.get(manager=self.manager, status='active')
        self.assertEqual(suspension.duration_days, 14)
        self.assertIsNotNone(suspension.expires_at)
        self.assertEqual(suspension.suspended_by, self.admin_user)

        # Verify admin action logged
        log = AdminActionLog.objects.get(
            admin_user=self.admin_user,
            action_name='suspend_manager',
            resource_id=self.manager_user.user_id
        )
        self.assertIn('duration_days', log.metadata)
        self.assertEqual(log.metadata['duration_days'], 14)

    def test_suspend_manager_indefinite(self):
        """Test suspending manager indefinitely"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': 'Indefinite suspension pending investigation of fraud claims'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify suspension is indefinite
        suspension = ManagerSuspension.objects.get(manager=self.manager, status='active')
        self.assertIsNone(suspension.duration_days)
        self.assertIsNone(suspension.expires_at)

    def test_suspend_already_suspended_manager(self):
        """Test that suspending already suspended manager fails"""
        # First suspension
        self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': 'First suspension for policy violation'}
        )

        # Try to suspend again
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': 'Second suspension attempt'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already suspended', response.data['detail'].lower())

    def test_unsuspend_manager_success(self):
        """Test successful manager unsuspension"""
        # First suspend
        self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/suspend/',
            data={'reason': 'Suspended for policy violation'}
        )

        # Then unsuspend
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/unsuspend/',
            data={'reason': 'Unsuspended after review - violation was resolved'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify manager unsuspended
        self.manager.refresh_from_db()
        self.assertFalse(self.manager.is_suspended)

        # Verify suspension lifted
        suspension = ManagerSuspension.objects.get(manager=self.manager)
        self.assertEqual(suspension.status, 'lifted')
        self.assertIsNotNone(suspension.unsuspended_at)
        self.assertEqual(suspension.unsuspended_by, self.admin_user)

    def test_unsuspend_not_suspended_manager(self):
        """Test that unsuspending non-suspended manager fails"""
        response = self.client.post(
            f'/api/admin/managers/{self.manager_user.user_id}/unsuspend/',
            data={'reason': 'Trying to unsuspend'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_performance_analytics(self):
        """Test manager performance analytics endpoint"""
        response = self.client.get(
            f'/api/admin/managers/{self.manager_user.user_id}/performance/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        data = response.data['data']
        self.assertEqual(data['manager_id'], self.manager_user.user_id)
        self.assertEqual(data['manager_email'], 'manager@test.com')
        self.assertIn('total_facilities', data)
        self.assertIn('total_bookings', data)
        self.assertIn('total_revenue', data)
        self.assertIn('commission_collected', data)

    def test_manager_filtering_by_status(self):
        """Test filtering managers by status"""
        # Suspend the manager
        self.manager.is_suspended = True
        self.manager.save()

        # Filter for suspended managers
        response = self.client.get('/api/admin/managers/?status=suspended')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Filter for active managers
        response = self.client.get('/api/admin/managers/?status=active')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_manager_search(self):
        """Test searching managers by name or email"""
        response = self.client.get('/api/admin/managers/?q=manager')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.get('/api/admin/managers/?q=nonexistent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
