from django.db import models


class BookingStatus(models.Model):
    status_id = models.BigAutoField(primary_key=True)
    status_name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_status'

    def __str__(self):
        """
        Return string representation of the booking status.

        Returns:
            str: Name of the status (e.g., 'confirmed', 'cancelled')
        """
        return self.status_name


class Booking(models.Model):
    booking_id = models.BigAutoField(primary_key=True)
    court = models.ForeignKey('facilities.Court', on_delete=models.RESTRICT)
    user = models.ForeignKey('users.User', on_delete=models.RESTRICT)
    availability = models.OneToOneField('facilities.Availability', on_delete=models.RESTRICT)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    hourly_rate_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate_snapshot = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.ForeignKey(BookingStatus, on_delete=models.RESTRICT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        constraints = [
            models.UniqueConstraint(fields=['court', 'start_time'], name='unique_court_booking_time')
        ]
        indexes = [
            models.Index(fields=['user', 'created_at'], name='idx_bookings_user_created_at')
        ]

    def __str__(self):
        """
        Return string representation of the booking.

        Returns:
            str: Formatted string with booking ID, court, and start time
        """
        return f"Booking {self.booking_id} - {self.court} - {self.start_time}"


class TemporaryReservation(models.Model):
    """
    Temporary reservation for availability slots during checkout process.
    Prevents double-booking while giving users time to complete payment.
    Automatically expires after RESERVATION_DURATION minutes.
    """
    reservation_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'temporary_reservations'
        indexes = [
            models.Index(fields=['user', 'expires_at'], name='idx_temp_res_user_expires'),
            models.Index(fields=['expires_at'], name='idx_temp_res_expires'),
        ]

    def __str__(self):
        """
        Return string representation of the temporary reservation.

        Returns:
            str: Formatted string with reservation ID, user ID, and expiration time
        """
        return f"Reservation {self.reservation_id} - User {self.user_id} - Expires {self.expires_at}"

    @property
    def is_expired(self):
        """
        Check if the temporary reservation has expired.

        Returns:
            bool: True if reservation has expired, False otherwise
        """
        from django.utils import timezone
        return timezone.now() > self.expires_at


class ReservationSlot(models.Model):
    """
    Individual availability slots that are part of a temporary reservation.
    Allows multi-slot reservations (e.g., booking 2-3 consecutive hours).
    """
    reservation_slot_id = models.BigAutoField(primary_key=True)
    reservation = models.ForeignKey(TemporaryReservation, on_delete=models.CASCADE, related_name='slots')
    availability = models.ForeignKey('facilities.Availability', on_delete=models.CASCADE)

    class Meta:
        db_table = 'reservation_slots'
        unique_together = [['reservation', 'availability']]
        indexes = [
            models.Index(fields=['availability'], name='idx_res_slot_availability'),
        ]

    def __str__(self):
        """
        Return string representation of the reservation slot.

        Returns:
            str: Formatted string with slot ID and availability ID
        """
        return f"ReservationSlot {self.reservation_slot_id} - Availability {self.availability_id}"