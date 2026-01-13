"""
Comprehensive tests for Reservation Views
Tests temporary reservation creation, retrieval, and deletion
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from app.users.models import User
from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import TemporaryReservation, ReservationSlot, Booking, BookingStatus
from app.bookings.exceptions import BookingNotAvailableException


class CreateReservationViewTests(APITestCase):
    """Test CreateReservationView"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/bookings/v1/reservations/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.facility = Facility.objects.create(
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

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

    def test_create_reservation_unauthenticated(self):
        """Test creating reservation without authentication"""
        data = {
            'availability_ids': [self.availability.availability_id]
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_create_reservation_success(self):
        """Test successful reservation creation"""
        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [self.availability.availability_id]
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('reservation_id', response.data)
        self.assertIn('expires_at', response.data)

    def test_create_reservation_invalid_data(self):
        """Test creating reservation with invalid data"""
        self.client.force_authenticate(user=self.user)

        data = {}  # Missing availability_ids
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reservation_not_available(self):
        """Test creating reservation for unavailable slot"""
        # Make availability unavailable
        self.availability.is_available = False
        self.availability.save()

        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [self.availability.availability_id]
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    @patch('app.bookings.reservation_views.ReservationService.create_reservation')
    def test_create_reservation_booking_exception(self, mock_create):
        """Test creating reservation with booking exception"""
        mock_create.side_effect = BookingNotAvailableException("Slot not available")

        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [self.availability.availability_id]
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['message'], 'Slot not available')


class ReservationDetailViewTests(APITestCase):
    """Test ReservationDetailView (GET/DELETE)"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )

        self.facility = Facility.objects.create(
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

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create reservation
        self.reservation = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        ReservationSlot.objects.create(
            reservation=self.reservation,
            availability=self.availability
        )

        self.url = f'/api/bookings/v1/reservations/{self.reservation.reservation_id}/'

    def test_get_reservation_unauthenticated(self):
        """Test getting reservation without authentication"""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_reservation_success(self):
        """Test successfully getting reservation"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reservation_id'], self.reservation.reservation_id)

    def test_get_reservation_other_user(self):
        """Test getting reservation belonging to another user"""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_reservation_not_found(self):
        """Test getting non-existent reservation"""
        self.client.force_authenticate(user=self.user)

        url = '/api/bookings/v1/reservations/99999/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_reservation_success(self):
        """Test successfully deleting reservation"""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Verify reservation is deleted
        self.assertFalse(
            TemporaryReservation.objects.filter(
                reservation_id=self.reservation.reservation_id
            ).exists()
        )

    def test_delete_reservation_not_found(self):
        """Test deleting non-existent reservation"""
        self.client.force_authenticate(user=self.user)

        url = '/api/bookings/v1/reservations/99999/'
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_reservation_other_user(self):
        """Test deleting reservation belonging to another user"""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Verify reservation still exists
        self.assertTrue(
            TemporaryReservation.objects.filter(
                reservation_id=self.reservation.reservation_id
            ).exists()
        )


class GetActiveReservationViewTests(APITestCase):
    """Test get_active_reservation endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/bookings/v1/reservations/active/'

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.facility = Facility.objects.create(
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

    def test_get_active_reservation_unauthenticated(self):
        """Test getting active reservation without authentication"""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_active_reservation_none_exists(self):
        """Test getting active reservation when none exists"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No active reservation', response.data['message'])

    def test_get_active_reservation_success(self):
        """Test successfully getting active reservation"""
        # Create active reservation
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        ReservationSlot.objects.create(
            reservation=reservation,
            availability=availability
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reservation_id'], reservation.reservation_id)

    def test_get_active_reservation_expired_not_returned(self):
        """Test that expired reservations are not returned"""
        # Create expired reservation
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() - timedelta(minutes=1)  # Expired
        )
        ReservationSlot.objects.create(
            reservation=reservation,
            availability=availability
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ReservationEdgeCaseTests(APITestCase):
    """Test edge cases and error handling for reservation views"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.facility = Facility.objects.create(
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

    def test_create_reservation_multiple_slots(self):
        """Test creating reservation with multiple availability slots"""
        start_time = timezone.now() + timedelta(days=1)

        availabilities = []
        for i in range(3):
            avail = Availability.objects.create(
                court=self.court,
                start_time=start_time + timedelta(hours=i),
                end_time=start_time + timedelta(hours=i+1),
                is_available=True
            )
            availabilities.append(avail)

        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [a.availability_id for a in availabilities]
        }
        response = self.client.post('/api/bookings/v1/reservations/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['slots_count'], 3)

    def test_create_reservation_already_booked_slot(self):
        """Test creating reservation for already booked slot"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create booking for this slot
        booking_status = BookingStatus.objects.get_or_create(status_name='confirmed')[0]
        Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [availability.availability_id]
        }
        response = self.client.post('/api/bookings/v1/reservations/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_reservation_replaces_existing(self):
        """Test that creating a new reservation replaces existing one"""
        start_time = timezone.now() + timedelta(days=1)

        # Create first reservation
        avail1 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=start_time + timedelta(hours=1),
            is_available=True
        )

        reservation1 = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        ReservationSlot.objects.create(
            reservation=reservation1,
            availability=avail1
        )

        # Create second reservation
        avail2 = Availability.objects.create(
            court=self.court,
            start_time=start_time + timedelta(hours=2),
            end_time=start_time + timedelta(hours=3),
            is_available=True
        )

        self.client.force_authenticate(user=self.user)

        data = {
            'availability_ids': [avail2.availability_id]
        }
        response = self.client.post('/api/bookings/v1/reservations/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # First reservation should be deleted
        self.assertFalse(
            TemporaryReservation.objects.filter(
                reservation_id=reservation1.reservation_id
            ).exists()
        )
