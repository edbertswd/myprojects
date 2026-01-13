from django.db import transaction, IntegrityError
from django.utils import timezone
from decimal import Decimal
from .models import Booking, BookingStatus, TemporaryReservation, ReservationSlot
from .exceptions import (
    BookingNotAvailableException,
    BookingAlreadyExistsException,
    MaxBookingsExceededException,
    BookingCancellationException,
    InvalidTimeSlotException
)
from app.facilities.models import Availability
from app.users.models import User


MAX_BOOKING_COUNT = 5 # Max active bookings per user
COMISSION_RATE = Decimal('0.10')  # 10% commission
CANCELLATION_TIME_HOURS = 2  # Cancellation allowed up to 2 hours before start
RESERVATION_DURATION_MINUTES = 15  # How long to hold a reservation


class BookingService:
    """Service class for booking business logic"""

    @classmethod
    def create_booking(cls, user, availability_id=None, availability_ids=None):
        """
        Creates a new booking with atomic transaction to prevent double booking.
        Supports single or multiple consecutive time slots.

        Args:
            user: User making the booking
            availability_id: Single availability ID (for backward compatibility)
            availability_ids: List of availability IDs for multi-hour bookings
        """
        with transaction.atomic():
            # Handle both single and multiple availability IDs
            if availability_ids:
                avail_ids = availability_ids
            elif availability_id:
                avail_ids = [availability_id]
            else:
                raise ValueError("Either availability_id or availability_ids must be provided")

            # Validate user booking limits
            active_bookings_count = Booking.objects.filter(
                user=user,
                status__status_name__in=['pending_payment', 'confirmed']
            ).count()

            if active_bookings_count >= MAX_BOOKING_COUNT:
                raise MaxBookingsExceededException()

            # First, get and lock all availabilities (regardless of is_available status)
            # to check if bookings already exist
            all_availabilities = list(Availability.objects.select_for_update().filter(
                availability_id__in=avail_ids
            ))

            if len(all_availabilities) != len(avail_ids):
                raise BookingNotAvailableException("One or more time slots do not exist")

            # Check if any booking already exists first (before checking availability)
            for availability in all_availabilities:
                if Booking.objects.filter(availability=availability).exists():
                    raise BookingAlreadyExistsException(f"Time slot {availability.availability_id} is already booked")

            # Now filter for available slots
            availabilities = [a for a in all_availabilities if a.is_available]

            if len(availabilities) != len(avail_ids):
                raise BookingNotAvailableException("One or more time slots are not available")

            # Sort by start time
            availabilities.sort(key=lambda a: a.start_time)

            # Validate all slots are on the same court
            courts = set(a.court_id for a in availabilities)
            if len(courts) > 1:
                raise InvalidTimeSlotException("All time slots must be on the same court")

            # Validate time slots are in the future (with 1 minute grace period for clock differences)
            grace_period = timezone.timedelta(minutes=1)
            if availabilities[0].start_time < (timezone.now() - grace_period):
                raise InvalidTimeSlotException("Cannot book time slots in the past")

            # Get pending payment status
            pending_status, _ = BookingStatus.objects.get_or_create(status_name='pending_payment')

            # Use first availability as the primary one, span from first to last slot
            primary_availability = availabilities[0]
            start_time = availabilities[0].start_time
            end_time = availabilities[-1].end_time

            # Create booking with snapshot values
            booking = Booking.objects.create(
                court=primary_availability.court,
                user=user,
                availability=primary_availability,  # Primary slot
                start_time=start_time,
                end_time=end_time,
                hourly_rate_snapshot=primary_availability.court.hourly_rate,
                commission_rate_snapshot=Decimal(COMISSION_RATE),
                status=pending_status
            )

            # Mark all availabilities as unavailable
            for availability in availabilities:
                availability.is_available = False
                availability.save()

            return booking

    @classmethod
    def cancel_booking(cls, booking, user, reason=None):
        """
        Cancels a booking if within cancellation window
        """
        with transaction.atomic():
            # Verify user owns the booking
            if booking.user != user:
                raise BookingCancellationException("You can only cancel your own bookings")

            # Check cancellation window (2 hours before start)
            cancellation_deadline = booking.start_time - timezone.timedelta(hours= CANCELLATION_TIME_HOURS)
            if timezone.now() > cancellation_deadline:
                raise BookingCancellationException(
                    f"Bookings can only be cancelled up to {CANCELLATION_TIME_HOURS} hours before the start time"
                )

            # Check if already cancelled
            if booking.status.status_name == 'cancelled':
                raise BookingCancellationException("Booking is already cancelled")

            # Check if completed
            if booking.status.status_name == 'completed':
                raise BookingCancellationException("Cannot cancel completed bookings")

            # Get cancelled status
            cancelled_status, _ = BookingStatus.objects.get_or_create(status_name='cancelled')

            # Update booking status
            booking.status = cancelled_status
            booking.updated_at = timezone.now()
            booking.save()

            # Release ALL availability slots within the booking timespan
            # (handles multi-hour bookings where multiple slots were reserved)
            availabilities = Availability.objects.filter(
                court=booking.court,
                start_time__gte=booking.start_time,
                end_time__lte=booking.end_time
            )
            availabilities.update(is_available=True)

            return booking

    @classmethod
    def get_user_bookings(cls, user, status_filter=None, upcoming_only=False):
        """
        Retrieves user's bookings with optional filtering
        """
        queryset = Booking.objects.filter(user=user).select_related(
            'court', 'court__facility', 'court__sport_type', 'status'
        ).order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status__status_name=status_filter)

        if upcoming_only:
            queryset = queryset.filter(start_time__gt=timezone.now())

        return queryset

    @classmethod
    def get_facility_bookings(cls, facility, status_filter=None, date_filter=None):
        """
        Retrieves bookings for a specific facility (for managers)
        """
        queryset = Booking.objects.filter(
            court__facility=facility
        ).select_related(
            'court', 'user', 'status'
        ).order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status__status_name=status_filter)

        if date_filter:
            queryset = queryset.filter(start_time__date=date_filter)

        return queryset

    @classmethod
    def confirm_booking_payment(cls, booking):
        """
        Confirms a booking after successful payment
        """
        with transaction.atomic():
            confirmed_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

            booking.status = confirmed_status
            booking.updated_at = timezone.now()
            booking.save()

            return booking

    @classmethod
    def fail_booking_payment(cls, booking):
        """
        Handles failed booking payment
        """
        with transaction.atomic():
            failed_status, _ = BookingStatus.objects.get_or_create(status_name='payment_failed')

            booking.status = failed_status
            booking.updated_at = timezone.now()
            booking.save()

            # Make availability slot available again
            availability = booking.availability
            availability.is_available = True
            availability.save()

            return booking

    @classmethod
    def check_booking_permissions(cls, booking, user):
        """
        Checks if user has permission to access a booking
        """
        # User owns the booking
        if booking.user == user:
            return True

        # User is manager of the facility
        try:
            from app.users.models import Manager
            manager = Manager.objects.get(user=user)
            return booking.court.facility.manager == manager
        except Manager.DoesNotExist:
            return False

        return False


class ReservationService:
    """Service class for temporary reservation business logic"""

    @classmethod
    def create_reservation(cls, user, availability_ids, session_id=None):
        """
        Creates a temporary reservation for availability slots.
        Prevents other users from booking these slots for RESERVATION_DURATION_MINUTES.

        Args:
            user: User creating the reservation
            availability_ids: List of availability IDs to reserve
            session_id: Optional session identifier

        Returns:
            TemporaryReservation instance
        """
        with transaction.atomic():
            # Handle single or multiple availability IDs
            if not isinstance(availability_ids, list):
                availability_ids = [availability_ids]

            # Clean up any expired reservations for this user first
            cls.cleanup_expired_reservations(user=user)

            # Check if user already has an active reservation
            existing_reservation = TemporaryReservation.objects.filter(
                user=user,
                expires_at__gt=timezone.now()
            ).first()

            if existing_reservation:
                # Delete old reservation to create new one
                existing_reservation.delete()

            # Get and lock availabilities
            availabilities = list(Availability.objects.select_for_update().filter(
                availability_id__in=availability_ids,
                is_available=True
            ))

            if len(availabilities) != len(availability_ids):
                raise BookingNotAvailableException("One or more time slots are not available")

            # Check if any slots are already reserved or booked
            for availability in availabilities:
                # Check for existing bookings
                if Booking.objects.filter(availability=availability).exists():
                    raise BookingAlreadyExistsException(f"Time slot {availability.availability_id} is already booked")

                # Check for active reservations by other users
                active_reservation = ReservationSlot.objects.filter(
                    availability=availability,
                    reservation__expires_at__gt=timezone.now()
                ).exclude(reservation__user=user).first()

                if active_reservation:
                    raise BookingNotAvailableException(f"Time slot {availability.availability_id} is currently reserved")

            # Create the temporary reservation
            expires_at = timezone.now() + timezone.timedelta(minutes=RESERVATION_DURATION_MINUTES)
            reservation = TemporaryReservation.objects.create(
                user=user,
                session_id=session_id,
                expires_at=expires_at
            )

            # Create reservation slots
            for availability in availabilities:
                ReservationSlot.objects.create(
                    reservation=reservation,
                    availability=availability
                )

            return reservation

    @classmethod
    def get_reservation(cls, reservation_id, user=None):
        """
        Gets a reservation by ID, optionally filtered by user
        """
        queryset = TemporaryReservation.objects.filter(reservation_id=reservation_id)
        if user:
            queryset = queryset.filter(user=user)
        return queryset.select_related('user').prefetch_related('slots__availability').first()

    @classmethod
    def validate_reservation(cls, reservation_id, user):
        """
        Validates that a reservation exists, belongs to user, and hasn't expired
        """
        reservation = cls.get_reservation(reservation_id, user)

        if not reservation:
            raise InvalidTimeSlotException("Reservation not found or does not belong to you")

        if reservation.is_expired:
            # Clean up expired reservation
            reservation.delete()
            raise InvalidTimeSlotException("Reservation has expired. Please select your time slots again.")

        return reservation

    @classmethod
    def convert_reservation_to_booking(cls, reservation_id, user):
        """
        Converts a temporary reservation into a confirmed booking.
        Called after successful payment.
        """
        with transaction.atomic():
            # Validate reservation
            reservation = cls.validate_reservation(reservation_id, user)

            # Get all availability slots from the reservation
            reservation_slots = reservation.slots.select_related('availability').all()
            availability_ids = [slot.availability.availability_id for slot in reservation_slots]

            # Create the booking using BookingService
            booking = BookingService.create_booking(
                user=user,
                availability_ids=availability_ids
            )

            # Delete the reservation
            reservation.delete()

            return booking

    @classmethod
    def cancel_reservation(cls, reservation_id, user):
        """
        Cancels a reservation, making the slots available again
        """
        reservation = cls.get_reservation(reservation_id, user)
        if reservation:
            reservation.delete()
            return True
        return False

    @classmethod
    def cleanup_expired_reservations(cls, user=None):
        """
        Deletes expired reservations.
        If user is provided, only deletes their expired reservations.
        Otherwise deletes all expired reservations (for scheduled cleanup task).
        """
        queryset = TemporaryReservation.objects.filter(
            expires_at__lte=timezone.now()
        )

        if user:
            queryset = queryset.filter(user=user)

        deleted_count, _ = queryset.delete()
        return deleted_count

    @classmethod
    def get_user_active_reservation(cls, user):
        """
        Gets user's active (non-expired) reservation if any
        """
        return TemporaryReservation.objects.filter(
            user=user,
            expires_at__gt=timezone.now()
        ).prefetch_related('slots__availability').first()