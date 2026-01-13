"""
Comprehensive tests for User Views
Tests manager application submission and status retrieval
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch

from app.users.models import User
from app.admindashboard.models import ManagerRequest
from app.facilities.models import SportType


class SubmitManagerApplicationViewTests(APITestCase):
    """Test submit_manager_application view"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/users/apply-manager/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        # Create sport type for testing
        self.sport_type = SportType.objects.create(
            sport_type_id=1,
            sport_name='Basketball'
        )

    def test_submit_manager_application_unauthenticated(self):
        """Test submitting application without authentication"""
        data = {
            'facility_name': 'Test Facility',
            'facility_address': '123 Test St',
            'contact_phone': '0412345678',
            'court_count': 5,
            'business_experience': 'Test experience',
            'reason': 'Test reason'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_submit_manager_application_success(self):
        """Test successful application submission"""
        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'Test Facility',
            'facility_address': '123 Test St, Sydney NSW 2000',
            'contact_phone': '+61412345678',
            'proposed_timezone': 'Australia/Sydney',
            'proposed_latitude': -33.8688,
            'proposed_longitude': 151.2093,
            'court_count': 5,
            'operating_hours': {'mon': '08:00-22:00'},
            'business_experience': 'Test experience',
            'reason': 'I have extensive experience managing sports facilities and would like to expand my business opportunities through your platform.',
            'sport_type_ids': [self.sport_type.sport_type_id]
        }

        with patch('app.utils.audit.ActivityLogger.log_user_action'):
            response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('request_id', response.data)

    def test_submit_manager_application_duplicate_pending(self):
        """Test submitting application when one is already pending"""
        # Create existing pending application
        ManagerRequest.objects.create(
            user=self.user,
            facility_name='Existing Facility',
            facility_address='456 Old St',
            contact_phone='0412345678',
            court_count=3,
            business_experience='Old experience',
            reason='Old reason',
            status='pending'
        )

        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'New Facility',
            'facility_address': '789 New St',
            'contact_phone': '0412345679',
            'court_count': 5,
            'business_experience': 'New experience',
            'reason': 'New reason'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('pending', response.data['error'])

    def test_submit_manager_application_duplicate_approved(self):
        """Test submitting application when one is already approved"""
        # Create existing approved application
        ManagerRequest.objects.create(
            user=self.user,
            facility_name='Existing Facility',
            facility_address='456 Old St',
            contact_phone='0412345678',
            court_count=3,
            business_experience='Old experience',
            reason='Old reason',
            status='approved'
        )

        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'New Facility',
            'facility_address': '789 New St',
            'contact_phone': '0412345679',
            'court_count': 5,
            'business_experience': 'New experience',
            'reason': 'New reason'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('approved', response.data['error'])

    def test_submit_manager_application_invalid_data(self):
        """Test submitting application with invalid data"""
        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'Test Facility',
            # Missing required fields
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.users.views.ActivityLogger.log_user_action')
    def test_submit_manager_application_with_logging(self, mock_log):
        """Test that application submission logs the activity"""
        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'Test Facility',
            'facility_address': '123 Test St, Sydney NSW 2000',
            'contact_phone': '+61412345678',
            'proposed_timezone': 'Australia/Sydney',
            'proposed_latitude': -33.8688,
            'proposed_longitude': 151.2093,
            'court_count': 5,
            'operating_hours': {'mon': '08:00-22:00'},
            'business_experience': 'Test experience',
            'reason': 'I have extensive experience managing sports facilities and would like to expand my business opportunities through your platform.',
            'sport_type_ids': [self.sport_type.sport_type_id]
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify logging was called
        mock_log.assert_called_once()

    def test_submit_manager_application_integrity_error(self):
        """Test handling of integrity error during application submission"""
        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'Test Facility',
            'facility_address': '123 Test St, Sydney NSW 2000',
            'contact_phone': '+61412345678',
            'proposed_timezone': 'Australia/Sydney',
            'proposed_latitude': -33.8688,
            'proposed_longitude': 151.2093,
            'court_count': 5,
            'operating_hours': {'mon': '08:00-22:00'},
            'business_experience': 'Test experience',
            'reason': 'Test reason that is long enough to satisfy the 50 character minimum requirement',
            'sport_type_ids': [self.sport_type.sport_type_id]
        }

        # Mock ManagerRequest.objects.create to raise IntegrityError
        with patch('app.users.serializers.ManagerRequest.objects.create') as mock_create:
            from django.db import IntegrityError
            mock_create.side_effect = IntegrityError("Duplicate entry")

            response = self.client.post(self.url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', response.data)
            self.assertIn('already exists', response.data['error'])


class GetManagerApplicationStatusViewTests(APITestCase):
    """Test get_manager_application_status view"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/users/manager-application-status/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_get_status_unauthenticated(self):
        """Test getting status without authentication"""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_status_no_application(self):
        """Test getting status when no application exists"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No manager application found', response.data['message'])

    def test_get_status_success(self):
        """Test successfully getting application status"""
        # Create manager request
        manager_request = ManagerRequest.objects.create(
            user=self.user,
            facility_name='Test Facility',
            facility_address='123 Test St',
            contact_phone='0412345678',
            court_count=5,
            business_experience='Test experience',
            reason='Test reason',
            status='pending'
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['request_id'], manager_request.request_id)

    def test_get_status_returns_most_recent(self):
        """Test that status endpoint returns most recent application"""
        # Create older application
        old_request = ManagerRequest.objects.create(
            user=self.user,
            facility_name='Old Facility',
            facility_address='456 Old St',
            contact_phone='0412345678',
            court_count=3,
            business_experience='Old experience',
            reason='Old reason',
            status='rejected'
        )

        # Create newer application
        new_request = ManagerRequest.objects.create(
            user=self.user,
            facility_name='New Facility',
            facility_address='789 New St',
            contact_phone='0412345679',
            court_count=5,
            business_experience='New experience',
            reason='New reason',
            status='pending'
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return the newest application
        self.assertEqual(response.data['data']['request_id'], new_request.request_id)
        self.assertEqual(response.data['data']['facility_name'], 'New Facility')

    def test_get_status_exception_handling(self):
        """Test exception handling in get_manager_application_status"""
        self.client.force_authenticate(user=self.user)

        # Mock the filter method to raise an exception
        with patch('app.admindashboard.models.ManagerRequest.objects.filter') as mock_filter:
            mock_filter.side_effect = Exception("Database error")

            response = self.client.get(self.url)

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('Failed to retrieve application status', response.data['error'])
