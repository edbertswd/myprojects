from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from app.users.models import User, Manager
from app.facilities.models import Facility
from app.admindashboard.models import AdminActionLog


class AdminReauthViewTests(APITestCase):
    """Test admin re-authentication endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='testpass123'
        )
        self.url = reverse('admindashboard:admin-reauth')

    def test_reauth_with_password_success(self):
        """Test successful password re-authentication"""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            'method': 'password',
            'credential': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('token', response.data['data'])
        self.assertIn('expiresAt', response.data['data'])
        self.assertEqual(response.data['data']['method'], 'password')

    def test_reauth_with_password_invalid(self):
        """Test password re-authentication with wrong password"""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            'method': 'password',
            'credential': 'wrongpassword'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_reauth_non_admin_forbidden(self):
        """Test that non-admin users cannot re-authenticate"""
        self.client.force_authenticate(user=self.regular_user)

        data = {
            'method': 'password',
            'credential': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reauth_missing_credential(self):
        """Test re-authentication with missing credential"""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            'method': 'password',
            'credential': ''
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_reauth_invalid_method(self):
        """Test re-authentication with invalid method"""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            'method': 'invalid_method',
            'credential': 'testpass123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_reauth_with_otp_success(self, mock_send_email, mock_generate_otp):
        """Test OTP re-authentication request"""
        self.client.force_authenticate(user=self.admin_user)
        mock_generate_otp.return_value = '123456'
        mock_send_email.return_value = True

        data = {
            'method': 'otp',
            'credential': ''
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['method'], 'otp')
        self.assertTrue(response.data['data']['requiresVerification'])
        mock_generate_otp.assert_called_once()
        mock_send_email.assert_called_once()

    @patch('app.auth.services.OTPService.generate_otp')
    @patch('app.auth.services.OTPService.send_otp_email')
    def test_reauth_with_otp_email_failure(self, mock_send_email, mock_generate_otp):
        """Test OTP re-authentication when email fails"""
        self.client.force_authenticate(user=self.admin_user)
        mock_generate_otp.return_value = '123456'
        mock_send_email.return_value = False

        data = {
            'method': 'otp',
            'credential': ''
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)


class AdminReauthVerifyViewTests(APITestCase):
    """Test admin OTP verification endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='testpass123'
        )
        self.url = reverse('admindashboard:admin-reauth-verify')

    def test_verify_otp_non_admin_forbidden(self):
        """Test that non-admin users cannot verify OTP"""
        self.client.force_authenticate(user=self.regular_user)

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_verify_otp_missing_code(self):
        """Test OTP verification with missing code"""
        self.client.force_authenticate(user=self.admin_user)

        data = {'code': ''}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_otp_invalid_format(self):
        """Test OTP verification with invalid format"""
        self.client.force_authenticate(user=self.admin_user)

        # Non-digit code
        data = {'code': 'abcdef'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Wrong length
        data = {'code': '12345'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.auth.services.OTPService.verify_otp')
    def test_verify_otp_success(self, mock_verify):
        """Test successful OTP verification"""
        self.client.force_authenticate(user=self.admin_user)
        mock_verify.return_value = True

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('token', response.data['data'])
        self.assertIn('expiresAt', response.data['data'])
        self.assertEqual(response.data['data']['method'], 'otp')

    @patch('app.auth.services.OTPService.verify_otp')
    def test_verify_otp_invalid(self, mock_verify):
        """Test OTP verification with invalid code"""
        self.client.force_authenticate(user=self.admin_user)
        mock_verify.return_value = False

        data = {'code': '123456'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PendingFacilitiesListViewTests(APITestCase):
    """Test pending facilities list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        # Create pending facilities
        self.pending_facility = Facility.objects.create(
            facility_name='Pending Facility',
            address='123 Test St',
            approval_status='pending',
            submitted_by=self.manager_user
        )

        # Create approved facility (should not appear)
        self.approved_facility = Facility.objects.create(
            facility_name='Approved Facility',
            address='456 Test Ave',
            approval_status='approved',
            manager=self.manager
        )

        self.url = reverse('admindashboard:pending-facilities')

    def test_list_pending_facilities(self):
        """Test listing pending facilities"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['facility_name'], 'Pending Facility')

    def test_list_pending_facilities_non_admin(self):
        """Test that non-admin cannot list pending facilities"""
        self.client.force_authenticate(user=self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ApproveFacilityViewTests(APITestCase):
    """Test facility approval endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        self.pending_facility = Facility.objects.create(
            facility_name='Pending Facility',
            address='123 Test St',
            approval_status='pending',
            submitted_by=self.manager_user
        )

    def test_approve_pending_facility(self):
        """Test approving a pending facility"""
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('admindashboard:approve-facility', kwargs={'facility_id': self.pending_facility.facility_id})
        response = self.client.post(url, {'reason': 'Facility meets all requirements and is approved for operation'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        self.assertIn('facility', response.data)

        # Verify facility was approved
        self.pending_facility.refresh_from_db()
        self.assertEqual(self.pending_facility.approval_status, 'approved')
        self.assertEqual(self.pending_facility.approved_by, self.admin_user)
        self.assertIsNotNone(self.pending_facility.approved_at)
        self.assertEqual(self.pending_facility.manager, self.manager)

    def test_approve_already_approved_facility(self):
        """Test approving an already approved facility"""
        self.client.force_authenticate(user=self.admin_user)

        # Approve first time
        self.pending_facility.approval_status = 'approved'
        self.pending_facility.save()

        url = reverse('admindashboard:approve-facility', kwargs={'facility_id': self.pending_facility.facility_id})
        response = self.client.post(url, {'reason': 'Attempting to approve already approved facility'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_facility_without_manager(self):
        """Test approving facility when submitter has no manager profile"""
        self.client.force_authenticate(user=self.admin_user)

        # Create facility with submitter who has no manager
        user_no_manager = User.objects.create_user(
            email='nomanager@example.com',
            name='No Manager',
            password='testpass123'
        )
        facility = Facility.objects.create(
            facility_name='Test Facility',
            address='789 Test Rd',
            approval_status='pending',
            submitted_by=user_no_manager
        )

        url = reverse('admindashboard:approve-facility', kwargs={'facility_id': facility.facility_id})
        response = self.client.post(url, {'reason': 'Testing approval without manager profile'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)


class RejectFacilityViewTests(APITestCase):
    """Test facility rejection endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        self.pending_facility = Facility.objects.create(
            facility_name='Pending Facility',
            address='123 Test St',
            approval_status='pending',
            submitted_by=self.manager_user
        )

    def test_reject_pending_facility(self):
        """Test rejecting a pending facility"""
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('admindashboard:reject-facility', kwargs={'facility_id': self.pending_facility.facility_id})
        response = self.client.post(url, {'reason': 'Facility does not meet operational requirements'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        self.assertIn('facility', response.data)

        # Verify facility was rejected
        self.pending_facility.refresh_from_db()
        self.assertEqual(self.pending_facility.approval_status, 'rejected')
        self.assertEqual(self.pending_facility.approved_by, self.admin_user)
        self.assertIsNotNone(self.pending_facility.approved_at)

    def test_reject_already_approved_facility(self):
        """Test rejecting an already approved facility"""
        self.client.force_authenticate(user=self.admin_user)

        # Approve first
        self.pending_facility.approval_status = 'approved'
        self.pending_facility.save()

        url = reverse('admindashboard:reject-facility', kwargs={'facility_id': self.pending_facility.facility_id})
        response = self.client.post(url, {'reason': 'Attempting to reject already approved facility'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserListViewTests(APITestCase):
    """Test user list endpoint with filters"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )

        # Create various users
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        self.regular_user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='testpass123'
        )

        self.suspended_user = User.objects.create_user(
            email='suspended@example.com',
            name='Suspended User',
            password='testpass123',
            is_active=False
        )

        self.url = reverse('admindashboard:users-list')

    def test_list_all_users(self):
        """Test listing all users"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns a plain list when not paginated
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 4)

    def test_list_users_with_search(self):
        """Test filtering users by search query"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'q': 'Manager'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        # Should include manager user
        emails = [u['email'] for u in response.data]
        self.assertIn('manager@example.com', emails)

    def test_list_users_filter_by_role_admin(self):
        """Test filtering users by admin role"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'role': 'admin'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return admin users
        for user in response.data:
            self.assertEqual(user.get('role'), 'admin')

    def test_list_users_filter_by_role_manager(self):
        """Test filtering users by manager role"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'role': 'manager'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Manager user should be in results
        emails = [u['email'] for u in response.data]
        self.assertIn('manager@example.com', emails)

    def test_list_users_filter_by_role_user(self):
        """Test filtering users by regular user role"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'role': 'user'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Regular user should be in results
        emails = [u['email'] for u in response.data]
        self.assertIn('user@example.com', emails)

    def test_list_users_filter_by_status_active(self):
        """Test filtering users by active status"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'status': 'active'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user in response.data:
            self.assertEqual(user.get('status'), 'active')

    def test_list_users_filter_by_status_suspended(self):
        """Test filtering users by suspended status"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'status': 'suspended'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Suspended user should be in results
        emails = [u['email'] for u in response.data]
        self.assertIn('suspended@example.com', emails)

    def test_list_users_pagination(self):
        """Test pagination of user list"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {'pageSize': 2, 'page': 1})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns plain list without pagination wrapper when pagination_class not set
        self.assertIsInstance(response.data, list)


class UserDetailViewTests(APITestCase):
    """Test user detail endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='testpass123'
        )

    def test_get_user_detail(self):
        """Test retrieving user details"""
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('admindashboard:user-detail', kwargs={'user_id': self.regular_user.user_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['email'], 'user@example.com')
        self.assertEqual(response.data['data']['name'], 'Regular User')


class SuspendUserViewTests(APITestCase):
    """Test user suspension endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='testpass123'
        )

    def test_suspend_user_success(self):
        """Test successfully suspending a user"""
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('admindashboard:user-suspend', kwargs={'user_id': self.regular_user.user_id})
        data = {
            'reason': 'Violation of terms',
            'duration_days': 7
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)

        # Verify user was suspended
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

        # Verify action was logged
        self.assertTrue(AdminActionLog.objects.filter(
            action_name='suspend_user',
            resource_id=self.regular_user.user_id
        ).exists())

    def test_suspend_already_suspended_user(self):
        """Test suspending an already suspended user"""
        self.client.force_authenticate(user=self.admin_user)

        # Suspend first
        self.regular_user.is_active = False
        self.regular_user.save()

        url = reverse('admindashboard:user-suspend', kwargs={'user_id': self.regular_user.user_id})
        data = {'reason': 'Test'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suspend_admin_user_forbidden(self):
        """Test that admin users cannot be suspended"""
        self.client.force_authenticate(user=self.admin_user)

        another_admin = User.objects.create_user(
            email='admin2@example.com',
            name='Admin 2',
            password='testpass123',
            is_admin=True
        )

        url = reverse('admindashboard:user-suspend', kwargs={'user_id': another_admin.user_id})
        data = {'reason': 'Test'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UnsuspendUserViewTests(APITestCase):
    """Test user unsuspension endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            name='Admin User',
            password='testpass123',
            is_admin=True
        )
        self.suspended_user = User.objects.create_user(
            email='suspended@example.com',
            name='Suspended User',
            password='testpass123',
            is_active=False
        )

    def test_unsuspend_user_success(self):
        """Test successfully unsuspending a user"""
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('admindashboard:user-unsuspend', kwargs={'user_id': self.suspended_user.user_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)

        # Verify user was unsuspended
        self.suspended_user.refresh_from_db()
        self.assertTrue(self.suspended_user.is_active)

        # Verify action was logged
        self.assertTrue(AdminActionLog.objects.filter(
            action_name='unsuspend_user',
            resource_id=self.suspended_user.user_id
        ).exists())

    def test_unsuspend_active_user(self):
        """Test unsuspending an already active user"""
        self.client.force_authenticate(user=self.admin_user)

        active_user = User.objects.create_user(
            email='active@example.com',
            name='Active User',
            password='testpass123',
            is_active=True
        )

        url = reverse('admindashboard:user-unsuspend', kwargs={'user_id': active_user.user_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
