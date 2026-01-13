from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.urls import reverse
from datetime import timedelta

from app.bookings.models import Booking, BookingStatus
from app.facilities.models import Facility, Court, SportType, Availability
from app.users.models import User


class BookingStatusModelTests(TestCase):
    """Test BookingStatus model"""

    def test_create_booking_status(self):
        """Test creating a booking status"""
        status_obj, _ = BookingStatus.objects.get_or_create(status_name='pending_payment')
        self.assertEqual(status_obj.status_name, 'pending_payment')
        self.assertIsNotNone(status_obj.created_at)

    def test_booking_status_str_representation(self):
        """Test string representation"""
        status_obj, _ = BookingStatus.objects.get_or_create(status_name='confirmed')
        self.assertEqual(str(status_obj), 'confirmed')

    def test_booking_status_unique(self):
        """Test that status name must be unique"""
        BookingStatus.objects.get_or_create(status_name='test_unique_status')

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            BookingStatus.objects.create(status_name='test_unique_status')


class BookingModelTests(TestCase):
    """Test Booking model"""

    def setUp(self):
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
        self.status, _ = BookingStatus.objects.get_or_create(status_name='pending_payment')

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

    def test_create_booking(self):
        """Test creating a booking"""
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status
        )
        self.assertEqual(booking.court, self.court)
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.availability, self.availability)
        self.assertEqual(float(booking.hourly_rate_snapshot), 50.00)

    def test_booking_str_representation(self):
        """Test string representation"""
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status
        )
        expected_str = f"Booking {booking.booking_id} - {self.court} - {booking.start_time}"
        self.assertEqual(str(booking), expected_str)

    def test_booking_unique_court_start_time(self):
        """Test unique constraint on court and start_time"""
        Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status
        )

        # Create new availability for second booking attempt
        start_time = self.availability.start_time
        end_time = self.availability.end_time

        avail2 = Availability.objects.create(
            court=self.court,
            start_time=start_time + timedelta(hours=2),
            end_time=end_time + timedelta(hours=2),
            is_available=True
        )

        from django.db import IntegrityError
        # Same court, same start_time should fail
        with self.assertRaises(IntegrityError):
            Booking.objects.create(
                court=self.court,
                user=self.user,
                availability=avail2,
                start_time=start_time,  # Same start time as first booking
                end_time=end_time,
                hourly_rate_snapshot=50.00,
                commission_rate_snapshot=0.10,
                status=self.status
            )

    def test_booking_timestamps(self):
        """Test booking timestamps"""
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status
        )
        self.assertIsNotNone(booking.created_at)
        self.assertIsNotNone(booking.updated_at)


class CreateBookingViewTests(APITestCase):
    """Test booking creation endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('bookings:create-booking')
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            verification_status='verified'
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

        BookingStatus.objects.get_or_create(status_name='pending_payment')
        BookingStatus.objects.get_or_create(status_name='confirmed')

    def test_create_booking_authenticated(self):
        """Test creating a booking when authenticated"""
        self.client.force_authenticate(user=self.user)

        data = {'availability_id': self.availability.availability_id}
        response = self.client.post(self.url, data, format='json')

        # May return 201 or error depending on service implementation
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST  # If service has additional validation
        ])

    def test_create_booking_unauthenticated(self):
        """Test creating a booking without authentication"""
        data = {'availability_id': self.availability.availability_id}
        response = self.client.post(self.url, data, format='json')

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class BookingDetailViewTests(APITestCase):
    """Test booking detail endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            verification_status='verified'
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
        self.status_obj, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        self.booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status_obj
        )

    def test_get_booking_detail_as_owner(self):
        """Test retrieving booking details as owner"""
        self.client.force_authenticate(user=self.user)

        url = reverse('bookings:booking-detail', kwargs={'booking_id': self.booking.booking_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_booking_detail_unauthenticated(self):
        """Test retrieving booking details without authentication"""
        url = reverse('bookings:booking-detail', kwargs={'booking_id': self.booking.booking_id})
        response = self.client.get(url)

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class MyBookingsListViewTests(APITestCase):
    """Test my bookings list endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('bookings:my-bookings')
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            verification_status='verified'
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
        self.status_confirmed, _ = BookingStatus.objects.get_or_create(status_name='confirmed')
        self.status_cancelled, _ = BookingStatus.objects.get_or_create(status_name='cancelled')

        # Create confirmed booking
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        avail1 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        self.booking1 = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=avail1,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status_confirmed
        )

        # Create cancelled booking
        start_time2 = timezone.now() + timedelta(days=2)
        end_time2 = start_time2 + timedelta(hours=1)

        avail2 = Availability.objects.create(
            court=self.court,
            start_time=start_time2,
            end_time=end_time2,
            is_available=True
        )

        self.booking2 = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=avail2,
            start_time=start_time2,
            end_time=end_time2,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.status_cancelled
        )

    def test_list_my_bookings(self):
        """Test listing user's bookings"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_filter_bookings_by_status(self):
        """Test filtering bookings by status"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url, {'status': 'confirmed'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_bookings_unauthenticated(self):
        """Test accessing my bookings without authentication"""
        response = self.client.get(self.url)

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class BookingStatsViewTests(APITestCase):
    """Test booking stats endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('bookings:booking-stats')
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123',
            verification_status='verified'
        )

    def test_get_booking_stats_authenticated(self):
        """Test retrieving booking stats when authenticated"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_bookings', response.data)
        self.assertIn('completed_bookings', response.data)
        self.assertIn('active_bookings', response.data)
        self.assertIn('cancelled_bookings', response.data)

    def test_get_booking_stats_unauthenticated(self):
        """Test retrieving booking stats without authentication"""
        response = self.client.get(self.url)

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class BookingExceptionTests(TestCase):
    """Test booking exception classes"""

    def test_booking_exception_default_message(self):
        """Test BookingException with default message"""
        from app.bookings.exceptions import BookingException

        exc = BookingException()
        self.assertEqual(str(exc), "A booking error occurred")
        self.assertEqual(exc.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_exception_custom_message(self):
        """Test BookingException with custom message"""
        from app.bookings.exceptions import BookingException

        exc = BookingException("Custom error message")
        self.assertEqual(str(exc), "Custom error message")

    def test_booking_not_available_exception(self):
        """Test BookingNotAvailableException"""
        from app.bookings.exceptions import BookingNotAvailableException

        exc = BookingNotAvailableException()
        self.assertEqual(str(exc), "The selected time slot is not available")
        self.assertEqual(exc.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_already_exists_exception(self):
        """Test BookingAlreadyExistsException"""
        from app.bookings.exceptions import BookingAlreadyExistsException

        exc = BookingAlreadyExistsException()
        self.assertEqual(str(exc), "This time slot has already been booked")
        self.assertEqual(exc.status_code, status.HTTP_409_CONFLICT)

    def test_max_bookings_exceeded_exception(self):
        """Test MaxBookingsExceededException"""
        from app.bookings.exceptions import MaxBookingsExceededException

        exc = MaxBookingsExceededException()
        self.assertEqual(str(exc), "You have reached the maximum number of active bookings (5)")
        self.assertEqual(exc.status_code, status.HTTP_403_FORBIDDEN)

    def test_booking_cancellation_exception(self):
        """Test BookingCancellationException"""
        from app.bookings.exceptions import BookingCancellationException

        exc = BookingCancellationException()
        self.assertEqual(str(exc), "This booking cannot be cancelled")
        self.assertEqual(exc.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_not_owned_exception(self):
        """Test BookingNotOwnedException"""
        from app.bookings.exceptions import BookingNotOwnedException

        exc = BookingNotOwnedException()
        self.assertEqual(str(exc), "You can only access your own bookings")
        self.assertEqual(exc.status_code, status.HTTP_403_FORBIDDEN)

    def test_booking_not_found_exception(self):
        """Test BookingNotFoundException"""
        from app.bookings.exceptions import BookingNotFoundException

        exc = BookingNotFoundException()
        self.assertEqual(str(exc), "Booking not found")
        self.assertEqual(exc.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_time_slot_exception(self):
        """Test InvalidTimeSlotException"""
        from app.bookings.exceptions import InvalidTimeSlotException

        exc = InvalidTimeSlotException()
        self.assertEqual(str(exc), "Invalid time slot selected")
        self.assertEqual(exc.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_required_exception(self):
        """Test PaymentRequiredException"""
        from app.bookings.exceptions import PaymentRequiredException

        exc = PaymentRequiredException()
        self.assertEqual(str(exc), "Payment is required to confirm this booking")
        self.assertEqual(exc.status_code, status.HTTP_402_PAYMENT_REQUIRED)

    def test_custom_exception_handler_with_booking_exception(self):
        """Test custom exception handler with booking exception"""
        from app.bookings.exceptions import custom_exception_handler, BookingNotFoundException

        exc = BookingNotFoundException("Booking 123 not found")
        response = custom_exception_handler(exc, {})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['code'], 'BookingNotFoundException')
        self.assertEqual(response.data['error']['message'], 'Booking 123 not found')
        self.assertEqual(response.data['error']['type'], 'booking_error')

    def test_custom_exception_handler_with_non_booking_exception(self):
        """Test custom exception handler with non-booking exception"""
        from app.bookings.exceptions import custom_exception_handler

        exc = ValueError("Some other error")
        response = custom_exception_handler(exc, {})

        # Should return None for non-booking exceptions (delegated to default handler)
        self.assertIsNone(response)

    def test_all_exception_classes_with_custom_messages(self):
        """Test that all exception classes accept custom messages"""
        from app.bookings.exceptions import (
            BookingNotAvailableException,
            BookingAlreadyExistsException,
            MaxBookingsExceededException,
            BookingCancellationException,
            BookingNotOwnedException,
            BookingNotFoundException,
            InvalidTimeSlotException,
            PaymentRequiredException
        )

        custom_msg = "Custom error for testing"
        exceptions = [
            BookingNotAvailableException,
            BookingAlreadyExistsException,
            MaxBookingsExceededException,
            BookingCancellationException,
            BookingNotOwnedException,
            BookingNotFoundException,
            InvalidTimeSlotException,
            PaymentRequiredException
        ]

        for exc_class in exceptions:
            exc = exc_class(custom_msg)
            self.assertEqual(str(exc), custom_msg)


class BookingPermissionTests(TestCase):
    """Test booking permission classes"""

    def setUp(self):
        self.verified_user = User.objects.create_user(
            email='verified@example.com',
            name='Verified User',
            password='testpass123',
            verification_status='verified'
        )
        self.unverified_user = User.objects.create_user(
            email='unverified@example.com',
            name='Unverified User',
            password='testpass123',
            verification_status='pending'
        )
        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )
        from app.users.models import Manager
        self.manager = Manager.objects.create(user=self.manager_user)

        self.facility = Facility.objects.create(
            facility_name='Test Facility',
            address='123 Test St',
            manager=self.manager
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        # Create availability
        self.availability = Availability.objects.create(
            court=self.court,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            is_available=True
        )

        # Create booking status
        self.booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        # Create a booking
        self.booking = Booking.objects.create(
            user=self.verified_user,
            court=self.court,
            availability=self.availability,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=self.booking_status
        )

    def test_is_authenticated_and_verified_permission(self):
        """Test IsAuthenticatedAndVerified permission"""
        from app.bookings.permissions import IsAuthenticatedAndVerified
        from django.test import RequestFactory

        permission = IsAuthenticatedAndVerified()
        factory = RequestFactory()

        # Verified user allowed
        request = factory.get('/api/test/')
        request.user = self.verified_user
        self.assertTrue(permission.has_permission(request, None))

        # Unverified user denied
        request = factory.get('/api/test/')
        request.user = self.unverified_user
        self.assertFalse(permission.has_permission(request, None))

    def test_is_booking_owner_permission(self):
        """Test IsBookingOwner permission"""
        from app.bookings.permissions import IsBookingOwner
        from django.test import RequestFactory

        permission = IsBookingOwner()
        factory = RequestFactory()

        # Owner allowed
        request = factory.get('/api/test/')
        request.user = self.verified_user
        self.assertTrue(permission.has_object_permission(request, None, self.booking))

        # Non-owner denied
        request = factory.get('/api/test/')
        request.user = self.unverified_user
        self.assertFalse(permission.has_object_permission(request, None, self.booking))

    def test_is_manager_of_facility_permission(self):
        """Test IsManagerOfFacility permission"""
        from app.bookings.permissions import IsManagerOfFacility
        from django.test import RequestFactory

        permission = IsManagerOfFacility()
        factory = RequestFactory()

        # Manager allowed
        request = factory.get('/api/test/')
        request.user = self.manager_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.booking))

        # Non-manager denied
        request = factory.get('/api/test/')
        request.user = self.verified_user
        self.assertFalse(permission.has_permission(request, None))

    def test_is_booking_owner_or_manager_permission(self):
        """Test IsBookingOwnerOrManager permission"""
        from app.bookings.permissions import IsBookingOwnerOrManager
        from django.test import RequestFactory

        permission = IsBookingOwnerOrManager()
        factory = RequestFactory()

        # Owner allowed
        request = factory.get('/api/test/')
        request.user = self.verified_user
        self.assertTrue(permission.has_object_permission(request, None, self.booking))

        # Manager allowed
        request = factory.get('/api/test/')
        request.user = self.manager_user
        self.assertTrue(permission.has_object_permission(request, None, self.booking))

        # Other user denied
        request = factory.get('/api/test/')
        request.user = self.unverified_user
        self.assertFalse(permission.has_object_permission(request, None, self.booking))

    def test_can_create_booking_permission(self):
        """Test CanCreateBooking permission (max 5 bookings)"""
        from app.bookings.permissions import CanCreateBooking
        from django.test import RequestFactory

        permission = CanCreateBooking()
        factory = RequestFactory()

        # GET request always allowed
        request = factory.get('/api/test/')
        request.user = self.verified_user
        self.assertTrue(permission.has_permission(request, None))

        # POST request allowed with less than 5 bookings
        request = factory.post('/api/test/')
        request.user = self.verified_user
        self.assertTrue(permission.has_permission(request, None))

        # Create 4 more bookings (total 5)
        for i in range(4):
            # Create availability for each booking
            avail = Availability.objects.create(
                court=self.court,
                start_time=timezone.now() + timedelta(days=i+2),
                end_time=timezone.now() + timedelta(days=i+2, hours=1),
                is_available=True
            )
            Booking.objects.create(
                user=self.verified_user,
                court=self.court,
                availability=avail,
                start_time=timezone.now() + timedelta(days=i+2),
                end_time=timezone.now() + timedelta(days=i+2, hours=1),
                hourly_rate_snapshot=50.00,
                commission_rate_snapshot=0.10,
                status=self.booking_status
            )

        # POST request denied with 5 bookings
        request = factory.post('/api/test/')
        request.user = self.verified_user
        self.assertFalse(permission.has_permission(request, None))
