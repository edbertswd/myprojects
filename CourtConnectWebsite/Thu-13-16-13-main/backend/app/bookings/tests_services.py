"""
Comprehensive tests for Booking and Reservation Services
Tests all business logic for bookings and temporary reservations
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from app.bookings.models import Booking, BookingStatus, TemporaryReservation, ReservationSlot
from app.bookings.services import BookingService, ReservationService
from app.bookings.exceptions import (
    BookingNotAvailableException,
    BookingAlreadyExistsException,
    MaxBookingsExceededException,
    BookingCancellationException,
    InvalidTimeSlotException
)
from app.facilities.models import Facility, Court, SportType, Availability
from app.users.models import User, Manager


class BookingServiceCreateBookingTests(TestCase):
    """Test BookingService.create_booking method"""

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

        BookingStatus.objects.get_or_create(status_name='pending_payment')
        BookingStatus.objects.get_or_create(status_name='confirmed')

    def test_create_booking_single_slot(self):
        """Test creating booking with single time slot"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        booking = BookingService.create_booking(
            user=self.user,
            availability_id=availability.availability_id
        )

        self.assertIsNotNone(booking)
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.court, self.court)
        self.assertEqual(booking.status.status_name, 'pending_payment')

        # Verify availability is now unavailable
        availability.refresh_from_db()
        self.assertFalse(availability.is_available)

    def test_create_booking_multiple_slots(self):
        """Test creating booking with multiple consecutive time slots"""
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

        availability_ids = [a.availability_id for a in availabilities]

        booking = BookingService.create_booking(
            user=self.user,
            availability_ids=availability_ids
        )

        self.assertIsNotNone(booking)
        self.assertEqual(booking.start_time, availabilities[0].start_time)
        self.assertEqual(booking.end_time, availabilities[-1].end_time)

        # Verify all availabilities are now unavailable
        for avail_id in availability_ids:
            avail = Availability.objects.get(availability_id=avail_id)
            self.assertFalse(avail.is_available)

    def test_create_booking_no_availability_provided(self):
        """Test creating booking without providing availability_id"""
        with self.assertRaises(ValueError):
            BookingService.create_booking(user=self.user)

    def test_create_booking_max_bookings_exceeded(self):
        """Test creating booking when user has max bookings"""
        # Create 5 active bookings
        confirmed_status = BookingStatus.objects.get(status_name='confirmed')

        for i in range(5):
            start_time = timezone.now() + timedelta(days=i+1)
            end_time = start_time + timedelta(hours=1)

            avail = Availability.objects.create(
                court=self.court,
                start_time=start_time,
                end_time=end_time,
                is_available=False
            )

            Booking.objects.create(
                court=self.court,
                user=self.user,
                availability=avail,
                start_time=start_time,
                end_time=end_time,
                hourly_rate_snapshot=50.00,
                commission_rate_snapshot=0.10,
                status=confirmed_status
            )

        # Try to create 6th booking
        start_time = timezone.now() + timedelta(days=10)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        with self.assertRaises(MaxBookingsExceededException):
            BookingService.create_booking(
                user=self.user,
                availability_id=availability.availability_id
            )

    def test_create_booking_slot_not_available(self):
        """Test creating booking when slot is not available"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        with self.assertRaises(BookingNotAvailableException):
            BookingService.create_booking(
                user=self.user,
                availability_id=availability.availability_id
            )

    def test_create_booking_different_courts(self):
        """Test creating booking with slots on different courts"""
        court2 = Court.objects.create(
            facility=self.facility,
            name='Court 2',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        start_time = timezone.now() + timedelta(days=1)

        avail1 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=start_time + timedelta(hours=1),
            is_available=True
        )

        avail2 = Availability.objects.create(
            court=court2,
            start_time=start_time + timedelta(hours=1),
            end_time=start_time + timedelta(hours=2),
            is_available=True
        )

        with self.assertRaises(InvalidTimeSlotException):
            BookingService.create_booking(
                user=self.user,
                availability_ids=[avail1.availability_id, avail2.availability_id]
            )

    def test_create_booking_past_time_slot(self):
        """Test creating booking for past time slot"""
        start_time = timezone.now() - timedelta(hours=2)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        with self.assertRaises(InvalidTimeSlotException):
            BookingService.create_booking(
                user=self.user,
                availability_id=availability.availability_id
            )

    def test_create_booking_already_booked(self):
        """Test creating booking when slot already has a booking"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create first booking
        BookingService.create_booking(
            user=self.user,
            availability_id=availability.availability_id
        )

        # Try to create second booking for same slot
        with self.assertRaises(BookingAlreadyExistsException):
            BookingService.create_booking(
                user=self.user,
                availability_id=availability.availability_id
            )


class BookingServiceCancelBookingTests(TestCase):
    """Test BookingService.cancel_booking method"""

    def setUp(self):
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

        BookingStatus.objects.get_or_create(status_name='confirmed')
        BookingStatus.objects.get_or_create(status_name='cancelled')
        BookingStatus.objects.get_or_create(status_name='completed')

    def test_cancel_booking_success(self):
        """Test successful booking cancellation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        confirmed_status = BookingStatus.objects.get(status_name='confirmed')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=confirmed_status
        )

        cancelled_booking = BookingService.cancel_booking(booking, self.user)

        self.assertEqual(cancelled_booking.status.status_name, 'cancelled')
        # Verify availability is now available again
        availability.refresh_from_db()
        self.assertTrue(availability.is_available)

    def test_cancel_booking_not_owner(self):
        """Test cancelling booking by non-owner"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        confirmed_status = BookingStatus.objects.get(status_name='confirmed')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=confirmed_status
        )

        with self.assertRaises(BookingCancellationException):
            BookingService.cancel_booking(booking, self.other_user)

    def test_cancel_booking_too_late(self):
        """Test cancelling booking within cancellation window"""
        # Booking starts in 1 hour (within 2-hour cancellation window)
        start_time = timezone.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        confirmed_status = BookingStatus.objects.get(status_name='confirmed')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=confirmed_status
        )

        with self.assertRaises(BookingCancellationException):
            BookingService.cancel_booking(booking, self.user)

    def test_cancel_already_cancelled_booking(self):
        """Test cancelling already cancelled booking"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        cancelled_status = BookingStatus.objects.get(status_name='cancelled')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=cancelled_status
        )

        with self.assertRaises(BookingCancellationException):
            BookingService.cancel_booking(booking, self.user)

    def test_cancel_completed_booking(self):
        """Test cancelling completed booking"""
        start_time = timezone.now() - timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        completed_status = BookingStatus.objects.get(status_name='completed')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=completed_status
        )

        with self.assertRaises(BookingCancellationException):
            BookingService.cancel_booking(booking, self.user)


class BookingServiceQueryTests(TestCase):
    """Test BookingService query methods"""

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

        confirmed_status = BookingStatus.objects.get_or_create(status_name='confirmed')[0]
        cancelled_status = BookingStatus.objects.get_or_create(status_name='cancelled')[0]

        # Create past booking
        past_start = timezone.now() - timedelta(days=2)
        past_avail = Availability.objects.create(
            court=self.court,
            start_time=past_start,
            end_time=past_start + timedelta(hours=1),
            is_available=False
        )
        self.past_booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=past_avail,
            start_time=past_start,
            end_time=past_start + timedelta(hours=1),
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=confirmed_status
        )

        # Create upcoming booking
        future_start = timezone.now() + timedelta(days=2)
        future_avail = Availability.objects.create(
            court=self.court,
            start_time=future_start,
            end_time=future_start + timedelta(hours=1),
            is_available=False
        )
        self.future_booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=future_avail,
            start_time=future_start,
            end_time=future_start + timedelta(hours=1),
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=confirmed_status
        )

        # Create cancelled booking
        cancelled_start = timezone.now() + timedelta(days=3)
        cancelled_avail = Availability.objects.create(
            court=self.court,
            start_time=cancelled_start,
            end_time=cancelled_start + timedelta(hours=1),
            is_available=False
        )
        self.cancelled_booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=cancelled_avail,
            start_time=cancelled_start,
            end_time=cancelled_start + timedelta(hours=1),
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=cancelled_status
        )

    def test_get_user_bookings(self):
        """Test getting all user bookings"""
        bookings = BookingService.get_user_bookings(self.user)
        self.assertEqual(bookings.count(), 3)

    def test_get_user_bookings_filtered_by_status(self):
        """Test getting user bookings filtered by status"""
        bookings = BookingService.get_user_bookings(self.user, status_filter='confirmed')
        self.assertEqual(bookings.count(), 2)

    def test_get_user_bookings_upcoming_only(self):
        """Test getting only upcoming bookings"""
        bookings = BookingService.get_user_bookings(self.user, upcoming_only=True)
        self.assertGreaterEqual(bookings.count(), 1)

    def test_get_facility_bookings(self):
        """Test getting facility bookings"""
        bookings = BookingService.get_facility_bookings(self.facility)
        self.assertEqual(bookings.count(), 3)

    def test_get_facility_bookings_filtered_by_status(self):
        """Test getting facility bookings filtered by status"""
        bookings = BookingService.get_facility_bookings(self.facility, status_filter='cancelled')
        self.assertEqual(bookings.count(), 1)

    def test_get_facility_bookings_filtered_by_date(self):
        """Test getting facility bookings filtered by date"""
        # Use today's date to ensure we match the timezone-aware datetime correctly
        from django.utils import timezone
        # Get all bookings first to verify they exist
        all_bookings = BookingService.get_facility_bookings(self.facility)
        self.assertGreaterEqual(all_bookings.count(), 3)

        # Now filter by the future booking's date
        self.future_booking.refresh_from_db()
        # Use localtime to get the date in the local timezone
        from django.utils.timezone import localtime
        date = localtime(self.future_booking.start_time).date()
        bookings = BookingService.get_facility_bookings(self.facility, date_filter=date)
        self.assertGreaterEqual(bookings.count(), 1)


class BookingServicePaymentTests(TestCase):
    """Test BookingService payment-related methods"""

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

        BookingStatus.objects.get_or_create(status_name='pending_payment')
        BookingStatus.objects.get_or_create(status_name='confirmed')
        BookingStatus.objects.get_or_create(status_name='payment_failed')

    def test_confirm_booking_payment(self):
        """Test confirming booking payment"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        pending_status = BookingStatus.objects.get(status_name='pending_payment')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=pending_status
        )

        confirmed_booking = BookingService.confirm_booking_payment(booking)

        self.assertEqual(confirmed_booking.status.status_name, 'confirmed')

    def test_fail_booking_payment(self):
        """Test failing booking payment"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        pending_status = BookingStatus.objects.get(status_name='pending_payment')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=pending_status
        )

        failed_booking = BookingService.fail_booking_payment(booking)

        self.assertEqual(failed_booking.status.status_name, 'payment_failed')
        # Verify availability is available again
        availability.refresh_from_db()
        self.assertTrue(availability.is_available)


class BookingServicePermissionTests(TestCase):
    """Test BookingService.check_booking_permissions method"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.manager_user = User.objects.create_user(
            email='manager@example.com',
            name='Manager User',
            password='testpass123'
        )

        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )

        self.manager = Manager.objects.create(user=self.manager_user)

        self.facility = Facility.objects.create(
            facility_name='Test Center',
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

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        booking_status = BookingStatus.objects.get_or_create(status_name='confirmed')[0]
        self.booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

    def test_check_permissions_owner(self):
        """Test permissions check for booking owner"""
        has_permission = BookingService.check_booking_permissions(self.booking, self.user)
        self.assertTrue(has_permission)

    def test_check_permissions_manager(self):
        """Test permissions check for facility manager"""
        has_permission = BookingService.check_booking_permissions(self.booking, self.manager_user)
        self.assertTrue(has_permission)

    def test_check_permissions_other_user(self):
        """Test permissions check for unrelated user"""
        has_permission = BookingService.check_booking_permissions(self.booking, self.other_user)
        self.assertFalse(has_permission)


class ReservationServiceTests(TestCase):
    """Test ReservationService methods"""

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

        BookingStatus.objects.get_or_create(status_name='pending_payment')

    def test_create_reservation(self):
        """Test creating a temporary reservation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        self.assertIsNotNone(reservation)
        self.assertEqual(reservation.user, self.user)
        self.assertEqual(reservation.slots.count(), 1)

    def test_create_reservation_replaces_existing(self):
        """Test that new reservation replaces existing one"""
        start_time = timezone.now() + timedelta(days=1)

        # Create first reservation
        avail1 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=start_time + timedelta(hours=1),
            is_available=True
        )

        reservation1 = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[avail1.availability_id]
        )

        # Create second reservation
        avail2 = Availability.objects.create(
            court=self.court,
            start_time=start_time + timedelta(hours=2),
            end_time=start_time + timedelta(hours=3),
            is_available=True
        )

        reservation2 = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[avail2.availability_id]
        )

        # First reservation should be deleted
        self.assertFalse(
            TemporaryReservation.objects.filter(reservation_id=reservation1.reservation_id).exists()
        )

    def test_create_reservation_slot_not_available(self):
        """Test creating reservation when slot is not available"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=False
        )

        with self.assertRaises(BookingNotAvailableException):
            ReservationService.create_reservation(
                user=self.user,
                availability_ids=[availability.availability_id]
            )

    def test_create_reservation_already_booked(self):
        """Test creating reservation when slot is already booked"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create booking
        booking_status = BookingStatus.objects.get(status_name='pending_payment')
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

        with self.assertRaises(BookingAlreadyExistsException):
            ReservationService.create_reservation(
                user=self.user,
                availability_ids=[availability.availability_id]
            )

    def test_create_reservation_already_reserved_by_other(self):
        """Test creating reservation when slot is reserved by another user"""
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        # Create reservation by other user
        ReservationService.create_reservation(
            user=other_user,
            availability_ids=[availability.availability_id]
        )

        # Try to reserve same slot
        with self.assertRaises(BookingNotAvailableException):
            ReservationService.create_reservation(
                user=self.user,
                availability_ids=[availability.availability_id]
            )

    def test_get_reservation(self):
        """Test getting a reservation by ID"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        retrieved = ReservationService.get_reservation(reservation.reservation_id)

        self.assertEqual(retrieved.reservation_id, reservation.reservation_id)

    def test_validate_reservation_success(self):
        """Test validating a valid reservation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        validated = ReservationService.validate_reservation(reservation.reservation_id, self.user)

        self.assertEqual(validated.reservation_id, reservation.reservation_id)

    def test_validate_reservation_not_found(self):
        """Test validating non-existent reservation"""
        with self.assertRaises(InvalidTimeSlotException):
            ReservationService.validate_reservation(99999, self.user)

    def test_validate_reservation_expired(self):
        """Test validating expired reservation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        # Expire the reservation
        reservation.expires_at = timezone.now() - timedelta(minutes=1)
        reservation.save()

        with self.assertRaises(InvalidTimeSlotException):
            ReservationService.validate_reservation(reservation.reservation_id, self.user)

    def test_convert_reservation_to_booking(self):
        """Test converting reservation to booking"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        booking = ReservationService.convert_reservation_to_booking(
            reservation_id=reservation.reservation_id,
            user=self.user
        )

        self.assertIsNotNone(booking)
        self.assertEqual(booking.user, self.user)
        # Reservation should be deleted
        self.assertFalse(
            TemporaryReservation.objects.filter(reservation_id=reservation.reservation_id).exists()
        )

    def test_cancel_reservation(self):
        """Test cancelling a reservation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        result = ReservationService.cancel_reservation(reservation.reservation_id, self.user)

        self.assertTrue(result)
        self.assertFalse(
            TemporaryReservation.objects.filter(reservation_id=reservation.reservation_id).exists()
        )

    def test_cleanup_expired_reservations(self):
        """Test cleaning up expired reservations"""
        # First, clean up any existing expired reservations from previous tests
        initial_cleanup = ReservationService.cleanup_expired_reservations()

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        # Expire the reservation
        reservation.expires_at = timezone.now() - timedelta(minutes=1)
        reservation.save()

        deleted_count = ReservationService.cleanup_expired_reservations()

        # Should have deleted at least 1 (the one we just created)
        self.assertGreaterEqual(deleted_count, 1)

    def test_get_user_active_reservation(self):
        """Test getting user's active reservation"""
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        reservation = ReservationService.create_reservation(
            user=self.user,
            availability_ids=[availability.availability_id]
        )

        active = ReservationService.get_user_active_reservation(self.user)

        self.assertIsNotNone(active)
        self.assertEqual(active.reservation_id, reservation.reservation_id)
