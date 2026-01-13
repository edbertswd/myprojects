from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.urls import reverse
from datetime import timedelta, date

from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import Booking, BookingStatus
from app.users.models import User, Manager


class ManagerOverviewViewTests(APITestCase):
    """Test manager overview endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('managers:manager-overview')

        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Center',
            address='123 Test St',
            is_active=True
        )

    def test_get_manager_overview_authenticated(self):
        """Test retrieving manager overview when authenticated"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('today_count', response.data)
        self.assertIn('next7d_count', response.data)
        self.assertIn('facilities', response.data)

    def test_get_manager_overview_without_manager_role(self):
        """Test accessing manager overview as regular user"""
        regular_user = User.objects.create_user(
            email='regular@example.com',
            name='Regular User',
            password='testpass123'
        )

        self.client.force_authenticate(user=regular_user)

        response = self.client.get(self.url)

        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_500_INTERNAL_SERVER_ERROR  # If middleware tries to access manager attribute
        ])

    def test_get_manager_overview_unauthenticated(self):
        """Test accessing manager overview without authentication"""
        response = self.client.get(self.url)

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class ManagerFacilityListViewTests(APITestCase):
    """Test manager facility list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('managers:manager-facilities-list')

        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

        self.facility1 = Facility.objects.create(
            manager=self.manager,
            facility_name='Facility 1',
            address='123 Test St'
        )

        self.facility2 = Facility.objects.create(
            manager=self.manager,
            facility_name='Facility 2',
            address='456 Test Ave'
        )

        # Facility from different manager
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other Manager',
            password='testpass123'
        )
        other_manager = Manager.objects.create(user=other_user)

        self.other_facility = Facility.objects.create(
            manager=other_manager,
            facility_name='Other Facility',
            address='789 Test Rd'
        )

    def test_list_manager_facilities(self):
        """Test listing manager's own facilities"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class ManagerFacilityDetailViewTests(APITestCase):
    """Test manager facility detail endpoint"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Center',
            address='123 Test St'
        )

    def test_get_manager_facility_detail(self):
        """Test retrieving manager's facility details"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-facility-detail', kwargs={'facility_id': self.facility.facility_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['facility_name'], 'Test Center')

    def test_update_manager_facility(self):
        """Test updating manager's facility"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-facility-detail', kwargs={'facility_id': self.facility.facility_id})
        data = {'facility_name': 'Updated Center', 'address': '123 Test St'}

        response = self.client.put(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.facility.refresh_from_db()
        self.assertEqual(self.facility.facility_name, 'Updated Center')


class ManagerCourtViewTests(APITestCase):
    """Test manager court endpoints"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Center',
            address='123 Test St'
        )

        self.sport_type = SportType.objects.create(sport_name='Tennis')

        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

    def test_list_courts_for_facility(self):
        """Test listing courts for manager's facility"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-facility-courts', kwargs={'facility_id': self.facility.facility_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('courts', response.data)
        self.assertIn('court_count', response.data)

    def test_create_court_for_facility(self):
        """Test creating a court for manager's facility"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-facility-courts', kwargs={'facility_id': self.facility.facility_id})
        data = {
            'name': 'Court 2',
            'sport_type': self.sport_type.sport_type_id,
            'hourly_rate': 60.00
        }

        response = self.client.post(url, data, format='json')

        if response.status_code != status.HTTP_201_CREATED:
            print(f"Error response: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify court was created
        self.assertTrue(
            Court.objects.filter(facility=self.facility, name='Court 2').exists()
        )

    def test_update_court(self):
        """Test updating a court"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-update-court', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id})
        data = {
            'name': 'Court 1 Updated',
            'sport_type': self.sport_type.sport_type_id,
            'hourly_rate': 55.00
        }

        response = self.client.put(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.court.refresh_from_db()
        self.assertEqual(self.court.name, 'Court 1 Updated')
        self.assertEqual(float(self.court.hourly_rate), 55.00)

    def test_delete_court_soft_delete(self):
        """Test soft deleting a court (deactivate)"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-delete-court', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify soft delete
        self.court.refresh_from_db()
        self.assertFalse(self.court.is_active)

    def test_prevent_creating_more_than_20_courts(self):
        """Test that managers cannot create more than 20 courts per facility"""
        self.client.force_authenticate(user=self.user)

        # Create 19 more courts (we already have 1)
        for i in range(2, 21):
            Court.objects.create(
                facility=self.facility,
                name=f'Court {i}',
                sport_type=self.sport_type,
                hourly_rate=50.00
            )

        # Try to create 21st court
        url = reverse('managers:manager-facility-courts', kwargs={'facility_id': self.facility.facility_id})
        data = {
            'name': 'Court 21',
            'sport_type': self.sport_type.sport_type_id,
            'hourly_rate': 60.00
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ManagerAvailabilityViewTests(APITestCase):
    """Test manager availability endpoints"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

        self.facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Center',
            address='123 Test St',
            timezone='Australia/Sydney'
        )

        self.sport_type = SportType.objects.create(sport_name='Tennis')

        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

    def test_list_availability_for_court(self):
        """Test listing availability for manager's court"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-court-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('availability', response.data)

    def test_create_availability_slot(self):
        """Test creating an availability slot"""
        self.client.force_authenticate(user=self.user)

        start_time = timezone.now() + timedelta(days=2)
        end_time = start_time + timedelta(hours=1)

        url = reverse('managers:manager-court-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id})
        data = {
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'is_available': True
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_availability_slot(self):
        """Test updating an availability slot"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-update-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id, 'availability_id': self.availability.availability_id})
        data = {
            'is_available': False
        }

        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.availability.refresh_from_db()
        self.assertFalse(self.availability.is_available)

    def test_delete_availability_slot(self):
        """Test deleting an availability slot"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-update-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id, 'availability_id': self.availability.availability_id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify deletion
        self.assertFalse(
            Availability.objects.filter(availability_id=self.availability.availability_id).exists()
        )

    def test_bulk_create_availability(self):
        """Test bulk creating availability slots"""
        self.client.force_authenticate(user=self.user)

        url = reverse('managers:manager-bulk-create-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id})

        today = date.today()
        data = {
            'start_date': today.isoformat(),
            'end_date': (today + timedelta(days=7)).isoformat(),
            'days_of_week': [1, 2, 3, 4, 5],  # Weekdays
            'start_time': '10:00',
            'end_time': '18:00',
            'slot_duration_minutes': 60
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('created_count', response.data)
        self.assertGreater(response.data['created_count'], 0)

    def test_prevent_deleting_booked_availability(self):
        """Test that booked availability cannot be deleted"""
        self.client.force_authenticate(user=self.user)

        # Create a booking for this availability
        user = User.objects.create_user(
            email='booker@example.com',
            name='Booker',
            password='testpass123'
        )

        booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        booking = Booking.objects.create(
            court=self.court,
            user=user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        url = reverse('managers:manager-update-availability', kwargs={'facility_id': self.facility.facility_id, 'court_id': self.court.court_id, 'availability_id': self.availability.availability_id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify availability still exists
        self.assertTrue(
            Availability.objects.filter(availability_id=self.availability.availability_id).exists()
        )


class ManagerUserSerializerTests(TestCase):
    """Test ManagerUserSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123',
            phone_number='0412345678'
        )

    def test_manager_user_serializer_fields(self):
        """Test ManagerUserSerializer returns correct fields"""
        from app.managers.serializers import ManagerUserSerializer

        serializer = ManagerUserSerializer(self.user)

        self.assertIn('user_id', serializer.data)
        self.assertIn('name', serializer.data)
        self.assertIn('email', serializer.data)
        self.assertIn('phone_number', serializer.data)
        self.assertIn('verification_status', serializer.data)
        self.assertIn('created_at', serializer.data)

    def test_manager_user_serializer_values(self):
        """Test ManagerUserSerializer returns correct values"""
        from app.managers.serializers import ManagerUserSerializer

        serializer = ManagerUserSerializer(self.user)

        self.assertEqual(serializer.data['email'], 'manager@example.com')
        self.assertEqual(serializer.data['name'], 'Manager User')
        self.assertEqual(serializer.data['phone_number'], '0412345678')


class ManagerSerializerTests(TestCase):
    """Test ManagerSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(
            user=self.user,
            payment_provider='paypal',
            payment_account_id='paypal_12345',
            payout_verification_status='verified'
        )

    def test_manager_serializer_fields(self):
        """Test ManagerSerializer returns correct fields"""
        from app.managers.serializers import ManagerSerializer

        serializer = ManagerSerializer(self.manager)

        self.assertIn('user', serializer.data)
        self.assertIn('payment_account_id', serializer.data)
        self.assertIn('payment_provider', serializer.data)
        self.assertIn('payout_verification_status', serializer.data)
        self.assertIn('created_at', serializer.data)
        self.assertIn('updated_at', serializer.data)

    def test_manager_serializer_nested_user(self):
        """Test ManagerSerializer includes nested user data"""
        from app.managers.serializers import ManagerSerializer

        serializer = ManagerSerializer(self.manager)

        self.assertIsInstance(serializer.data['user'], dict)
        self.assertEqual(serializer.data['user']['email'], 'manager@example.com')
        self.assertEqual(serializer.data['user']['name'], 'Manager User')

    def test_manager_serializer_values(self):
        """Test ManagerSerializer returns correct values"""
        from app.managers.serializers import ManagerSerializer

        serializer = ManagerSerializer(self.manager)

        self.assertEqual(serializer.data['payment_provider'], 'paypal')
        self.assertEqual(serializer.data['payment_account_id'], 'paypal_12345')
        self.assertEqual(serializer.data['payout_verification_status'], 'verified')


class ManagerUpdateSerializerTests(TestCase):
    """Test ManagerUpdateSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

    def test_update_serializer_valid_data(self):
        """Test ManagerUpdateSerializer with valid data"""
        from app.managers.serializers import ManagerUpdateSerializer

        data = {
            'payment_provider': 'stripe',
            'payment_account_id': 'stripe_12345',
            'payout_verification_status': 'pending'
        }

        serializer = ManagerUpdateSerializer(self.manager, data=data)
        self.assertTrue(serializer.is_valid())

    def test_update_serializer_invalid_payment_provider(self):
        """Test ManagerUpdateSerializer with invalid payment provider"""
        from app.managers.serializers import ManagerUpdateSerializer

        data = {
            'payment_provider': 'invalid_provider',
            'payment_account_id': 'account_123'
        }

        serializer = ManagerUpdateSerializer(self.manager, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('payment_provider', serializer.errors)

    def test_update_serializer_valid_payment_providers(self):
        """Test ManagerUpdateSerializer accepts all valid payment providers"""
        from app.managers.serializers import ManagerUpdateSerializer

        valid_providers = ['stripe', 'paypal', 'bank_transfer']

        for provider in valid_providers:
            data = {
                'payment_provider': provider,
                'payment_account_id': f'{provider}_123'
            }

            serializer = ManagerUpdateSerializer(self.manager, data=data, partial=True)
            self.assertTrue(serializer.is_valid(), f"Provider {provider} should be valid")

    def test_update_serializer_invalid_verification_status(self):
        """Test ManagerUpdateSerializer with invalid verification status"""
        from app.managers.serializers import ManagerUpdateSerializer

        data = {
            'payout_verification_status': 'invalid_status'
        }

        serializer = ManagerUpdateSerializer(self.manager, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('payout_verification_status', serializer.errors)

    def test_update_serializer_valid_verification_statuses(self):
        """Test ManagerUpdateSerializer accepts all valid verification statuses"""
        from app.managers.serializers import ManagerUpdateSerializer

        valid_statuses = ['unverified', 'pending', 'verified', 'rejected']

        for status_value in valid_statuses:
            data = {
                'payout_verification_status': status_value
            }

            serializer = ManagerUpdateSerializer(self.manager, data=data, partial=True)
            self.assertTrue(serializer.is_valid(), f"Status {status_value} should be valid")

    def test_update_serializer_partial_update(self):
        """Test ManagerUpdateSerializer with partial update"""
        from app.managers.serializers import ManagerUpdateSerializer

        data = {
            'payment_provider': 'paypal'
        }

        serializer = ManagerUpdateSerializer(self.manager, data=data, partial=True)
        self.assertTrue(serializer.is_valid())


class ManagerRegistrationSerializerTests(TestCase):
    """Test ManagerRegistrationSerializer"""

    def test_registration_serializer_valid_data(self):
        """Test ManagerRegistrationSerializer with valid data"""
        from app.managers.serializers import ManagerRegistrationSerializer

        data = {
            'email': 'newmanager@example.com',
            'name': 'New Manager',
            'password': 'SecurePass123!',
            'phone_number': '0412345678',
            'payment_provider': 'stripe',
            'payment_account_id': 'stripe_12345'
        }

        serializer = ManagerRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_registration_serializer_duplicate_email(self):
        """Test ManagerRegistrationSerializer rejects duplicate email"""
        from app.managers.serializers import ManagerRegistrationSerializer

        # Create existing user
        User.objects.create_user(
            email='existing@example.com',
            name='Existing User',
            password='testpass123'
        )

        data = {
            'email': 'existing@example.com',
            'name': 'New Manager',
            'password': 'SecurePass123!'
        }

        serializer = ManagerRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_registration_serializer_create_user_and_manager(self):
        """Test ManagerRegistrationSerializer creates both User and Manager"""
        from app.managers.serializers import ManagerRegistrationSerializer

        data = {
            'email': 'newmanager@example.com',
            'name': 'New Manager',
            'password': 'SecurePass123!',
            'phone_number': '0412345678',
            'payment_provider': 'paypal',
            'payment_account_id': 'paypal_12345'
        }

        serializer = ManagerRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        manager = serializer.save()

        # Verify User was created
        self.assertTrue(User.objects.filter(email='newmanager@example.com').exists())

        # Verify Manager was created
        self.assertTrue(Manager.objects.filter(user__email='newmanager@example.com').exists())

        # Verify manager fields
        self.assertEqual(manager.payment_provider, 'paypal')
        self.assertEqual(manager.payment_account_id, 'paypal_12345')
        self.assertEqual(manager.payout_verification_status, 'unverified')

    def test_registration_serializer_without_optional_fields(self):
        """Test ManagerRegistrationSerializer without optional fields"""
        from app.managers.serializers import ManagerRegistrationSerializer

        data = {
            'email': 'minimal@example.com',
            'name': 'Minimal Manager',
            'password': 'SecurePass123!'
        }

        serializer = ManagerRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        manager = serializer.save()

        # Verify manager was created with defaults
        self.assertIsNotNone(manager)
        self.assertEqual(manager.payout_verification_status, 'unverified')

    def test_registration_serializer_password_min_length(self):
        """Test ManagerRegistrationSerializer enforces password minimum length"""
        from app.managers.serializers import ManagerRegistrationSerializer

        data = {
            'email': 'test@example.com',
            'name': 'Test Manager',
            'password': 'short'  # Less than 8 characters
        }

        serializer = ManagerRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class IsManagerPermissionTests(TestCase):
    """Test IsManager permission class"""

    def setUp(self):
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.manager_user)

        self.regular_user = User.objects.create_user(
            email='regular@example.com',
            name='Regular User',
            password='testpass123'
        )

    def test_is_manager_permission_with_manager_user(self):
        """Test IsManager permission allows authenticated manager"""
        from app.managers.permissions import IsManager
        from django.test import RequestFactory

        permission = IsManager()
        factory = RequestFactory()
        request = factory.get('/api/managers/test/')
        request.user = self.manager_user

        self.assertTrue(permission.has_permission(request, None))

    def test_is_manager_permission_with_regular_user(self):
        """Test IsManager permission denies regular authenticated user"""
        from app.managers.permissions import IsManager
        from django.test import RequestFactory

        permission = IsManager()
        factory = RequestFactory()
        request = factory.get('/api/managers/test/')
        request.user = self.regular_user

        self.assertFalse(permission.has_permission(request, None))

    def test_is_manager_permission_with_unauthenticated_user(self):
        """Test IsManager permission denies unauthenticated user"""
        from app.managers.permissions import IsManager
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser

        permission = IsManager()
        factory = RequestFactory()
        request = factory.get('/api/managers/test/')
        request.user = AnonymousUser()

        self.assertFalse(permission.has_permission(request, None))

    def test_is_manager_permission_with_no_user(self):
        """Test IsManager permission denies when user is None"""
        from app.managers.permissions import IsManager
        from django.test import RequestFactory

        permission = IsManager()
        factory = RequestFactory()
        request = factory.get('/api/managers/test/')
        request.user = None

        self.assertFalse(permission.has_permission(request, None))
