from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.urls import reverse
from datetime import datetime, timedelta
import pytz

from app.facilities.models import Facility, Court, SportType, Availability
from app.users.models import User, Manager


class SportTypeModelTests(TestCase):
    """Test SportType model"""

    def test_create_sport_type(self):
        """Test creating a sport type"""
        sport = SportType.objects.create(sport_name='Tennis')
        self.assertEqual(sport.sport_name, 'Tennis')
        self.assertIsNotNone(sport.created_at)

    def test_sport_type_str_representation(self):
        """Test string representation"""
        sport = SportType.objects.create(sport_name='Basketball')
        self.assertEqual(str(sport), 'Basketball')

    def test_sport_name_unique(self):
        """Test that sport name must be unique"""
        SportType.objects.create(sport_name='Tennis')

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            SportType.objects.create(sport_name='Tennis')


class FacilityModelTests(TestCase):
    """Test Facility model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        self.manager = Manager.objects.create(user=self.user)

    def test_create_facility(self):
        """Test creating a facility"""
        facility = Facility.objects.create(
            manager=self.manager,
            facility_name='Test Sports Center',
            address='123 Test St, Sydney NSW 2000',
            timezone='Australia/Sydney',
            latitude=-33.8688,
            longitude=151.2093
        )
        self.assertEqual(facility.facility_name, 'Test Sports Center')
        self.assertEqual(facility.manager, self.manager)
        self.assertEqual(facility.approval_status, 'pending')
        self.assertTrue(facility.is_active)

    def test_facility_default_values(self):
        """Test default values for facility"""
        facility = Facility.objects.create(
            facility_name='Test Center',
            address='123 Test St'
        )
        self.assertEqual(facility.timezone, 'Australia/Sydney')
        self.assertEqual(facility.approval_status, 'pending')
        self.assertTrue(facility.is_active)
        self.assertEqual(float(facility.commission_rate), 0.1)

    def test_facility_str_representation(self):
        """Test string representation"""
        facility = Facility.objects.create(
            facility_name='Tennis Club',
            address='456 Test Ave'
        )
        self.assertEqual(str(facility), 'Tennis Club')

    def test_facility_unique_constraint_manager_name(self):
        """Test unique constraint on manager and facility_name"""
        Facility.objects.create(
            manager=self.manager,
            facility_name='Sports Center',
            address='123 Test St'
        )

        from django.db import IntegrityError
        # Same manager, same name should fail
        with self.assertRaises(IntegrityError):
            Facility.objects.create(
                manager=self.manager,
                facility_name='Sports Center',
                address='456 Different St'
            )

    def test_facility_timestamps(self):
        """Test facility timestamps"""
        facility = Facility.objects.create(
            facility_name='Test Center',
            address='123 Test St'
        )
        self.assertIsNotNone(facility.created_at)
        self.assertIsNotNone(facility.updated_at)


class CourtModelTests(TestCase):
    """Test Court model"""

    def setUp(self):
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
            address='123 Test St'
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')

    def test_create_court(self):
        """Test creating a court"""
        court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00,
            opening_time='06:00',
            closing_time='22:00'
        )
        self.assertEqual(court.name, 'Court 1')
        self.assertEqual(court.facility, self.facility)
        self.assertEqual(court.sport_type, self.sport_type)
        self.assertEqual(float(court.hourly_rate), 50.00)
        self.assertTrue(court.is_active)

    def test_court_str_representation(self):
        """Test string representation"""
        court = Court.objects.create(
            facility=self.facility,
            name='Court 2',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )
        self.assertEqual(str(court), f'{self.facility.facility_name} - Court 2')

    def test_court_unique_per_facility(self):
        """Test unique constraint on facility and court name"""
        Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Court.objects.create(
                facility=self.facility,
                name='Court 1',
                sport_type=self.sport_type,
                hourly_rate=60.00
            )

    def test_court_hourly_rate_constraint(self):
        """Test hourly rate must be between 10 and 200"""
        from django.db import IntegrityError, transaction

        # Rate too low (below 10)
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Court.objects.create(
                    facility=self.facility,
                    name='Court Low',
                    sport_type=self.sport_type,
                    hourly_rate=5.00
                )

        # Rate too high (above 200)
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Court.objects.create(
                    facility=self.facility,
                    name='Court High',
                    sport_type=self.sport_type,
                    hourly_rate=250.00
                )


class AvailabilityModelTests(TestCase):
    """Test Availability model"""

    def setUp(self):
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
            address='123 Test St'
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

    def test_create_availability(self):
        """Test creating an availability slot"""
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )
        self.assertEqual(availability.court, self.court)
        self.assertTrue(availability.is_available)

    def test_availability_str_representation(self):
        """Test string representation"""
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )
        expected_str = f"{self.court} - {start_time} to {end_time}"
        self.assertEqual(str(availability), expected_str)

    def test_availability_unique_court_start_time(self):
        """Test unique constraint on court and start_time"""
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=1)

        Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Availability.objects.create(
                court=self.court,
                start_time=start_time,
                end_time=end_time + timedelta(hours=1),
                is_available=False
            )


class FacilityListViewTests(APITestCase):
    """Test facility list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('facilities:facility-list')

        # Create approved facilities
        self.facility1 = Facility.objects.create(
            facility_name='Active Sports Center',
            address='123 Test St',
            is_active=True,
            approval_status='approved'
        )
        self.facility2 = Facility.objects.create(
            facility_name='Another Center',
            address='456 Test Ave',
            is_active=True,
            approval_status='approved'
        )

        # Create inactive facility (should not appear)
        self.facility3 = Facility.objects.create(
            facility_name='Inactive Center',
            address='789 Test Rd',
            is_active=False,
            approval_status='approved'
        )

        # Create pending facility (should not appear)
        self.facility4 = Facility.objects.create(
            facility_name='Pending Center',
            address='321 Test Blvd',
            is_active=True,
            approval_status='pending'
        )

    def test_list_facilities(self):
        """Test listing all active approved facilities"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only active and approved

    def test_search_facilities_by_name(self):
        """Test searching facilities by name"""
        response = self.client.get(self.url, {'search': 'Active'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['facility_name'], 'Active Sports Center')

    def test_filter_facilities_by_timezone(self):
        """Test filtering facilities by timezone"""
        self.facility1.timezone = 'Australia/Sydney'
        self.facility1.save()

        self.facility2.timezone = 'Australia/Melbourne'
        self.facility2.save()

        response = self.client.get(self.url, {'timezone': 'Australia/Sydney'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class FacilityDetailViewTests(APITestCase):
    """Test facility detail endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
            address='123 Test St',
            is_active=True,
            approval_status='approved'
        )

    def test_get_facility_detail(self):
        """Test retrieving facility details"""
        url = reverse('facilities:facility-detail', kwargs={'facility_id': self.facility.facility_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['facility_name'], 'Test Sports Center')


class FacilityCreateViewTests(APITestCase):
    """Test facility creation endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('facilities:facility-create')
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_create_facility_authenticated(self):
        """Test creating a facility when authenticated"""
        self.client.force_authenticate(user=self.user)

        data = {
            'facility_name': 'New Sports Center',
            'address': '999 New St',
            'timezone': 'Australia/Sydney'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify facility was created
        self.assertTrue(
            Facility.objects.filter(facility_name='New Sports Center').exists()
        )

        # Verify submitted_by was set
        facility = Facility.objects.get(facility_name='New Sports Center')
        self.assertEqual(facility.submitted_by, self.user)

    def test_create_facility_unauthenticated(self):
        """Test creating a facility without authentication"""
        data = {
            'facility_name': 'New Sports Center',
            'address': '999 New St'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class SportTypeListViewTests(APITestCase):
    """Test sport type list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('facilities:sport-type-list')

        SportType.objects.create(sport_name='Tennis')
        SportType.objects.create(sport_name='Basketball')
        SportType.objects.create(sport_name='Badminton')

    def test_list_sport_types(self):
        """Test listing all sport types"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)


class CourtListViewTests(APITestCase):
    """Test court list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
            address='123 Test St'
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')

        # Create active courts
        self.court1 = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00,
            is_active=True
        )
        self.court2 = Court.objects.create(
            facility=self.facility,
            name='Court 2',
            sport_type=self.sport_type,
            hourly_rate=60.00,
            is_active=True
        )

        # Create inactive court (should not appear)
        self.court3 = Court.objects.create(
            facility=self.facility,
            name='Court 3',
            sport_type=self.sport_type,
            hourly_rate=55.00,
            is_active=False
        )

    def test_list_courts_for_facility(self):
        """Test listing courts for a facility"""
        url = reverse('facilities:court-list', kwargs={'facility_id': self.facility.facility_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only active courts


class CourtDetailViewTests(APITestCase):
    """Test court detail endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
            address='123 Test St'
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00,
            is_active=True
        )

    def test_get_court_detail(self):
        """Test retrieving court details"""
        url = reverse('facilities:court-detail', kwargs={'court_id': self.court.court_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Court 1')


class AvailabilityListViewTests(APITestCase):
    """Test availability list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(
            facility_name='Test Sports Center',
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

        # Create available slots
        tz = pytz.timezone('Australia/Sydney')
        now = datetime.now(tz)

        self.avail1 = Availability.objects.create(
            court=self.court,
            start_time=now,
            end_time=now + timedelta(hours=1),
            is_available=True
        )
        self.avail2 = Availability.objects.create(
            court=self.court,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            is_available=True
        )

        # Create unavailable slot (should not appear)
        self.avail3 = Availability.objects.create(
            court=self.court,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=3),
            is_available=False
        )

    def test_list_availability_for_court(self):
        """Test listing availability for a court"""
        url = reverse('facilities:availability-list', kwargs={'court_id': self.court.court_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only available slots


class FacilitySearchViewTests(APITestCase):
    """Test facility search endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('facilities:facility-search')

        self.sport_type = SportType.objects.create(sport_name='Tennis')

        self.facility1 = Facility.objects.create(
            facility_name='Sydney Tennis Club',
            address='123 Tennis St, Sydney',
            is_active=True,
            approval_status='approved',
            timezone='Australia/Sydney'
        )

        self.facility2 = Facility.objects.create(
            facility_name='Melbourne Sports Center',
            address='456 Sports Ave, Melbourne',
            is_active=True,
            approval_status='approved',
            timezone='Australia/Melbourne'
        )

        # Add courts to facilities
        Court.objects.create(
            facility=self.facility1,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

    def test_search_by_name(self):
        """Test searching by facility name"""
        response = self.client.get(self.url, {'q': 'Tennis'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns paginated response with 'results' key
        self.assertIn('results', response.data)
        facility_names = [f['facility_name'] for f in response.data['results']]
        self.assertIn('Sydney Tennis Club', facility_names)

    def test_search_by_address(self):
        """Test searching by address"""
        response = self.client.get(self.url, {'q': 'Melbourne'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns paginated response with 'results' key
        self.assertIn('results', response.data)
        facility_names = [f['facility_name'] for f in response.data['results']]
        self.assertIn('Melbourne Sports Center', facility_names)

    def test_filter_by_timezone(self):
        """Test filtering by timezone"""
        response = self.client.get(self.url, {'timezone': 'Australia/Sydney'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns paginated response with 'results' key
        self.assertIn('results', response.data)
        facility_names = [f['facility_name'] for f in response.data['results']]
        self.assertIn('Sydney Tennis Club', facility_names)
        # Verify all results have the correct timezone
        for facility in response.data['results']:
            self.assertEqual(facility['timezone'], 'Australia/Sydney')

    def test_filter_by_sport_type(self):
        """Test filtering by sport type"""
        response = self.client.get(self.url, {'sport_type': 'Tennis'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Backend returns paginated response with 'results' key
        self.assertIn('results', response.data)
        facility_names = [f['facility_name'] for f in response.data['results']]
        self.assertIn('Sydney Tennis Club', facility_names)
