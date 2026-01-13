from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class BookingException(Exception):
    """Base exception for booking-related errors"""
    default_message = "A booking error occurred"
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message=None):
        self.message = message or self.default_message
        super().__init__(self.message)


class BookingNotAvailableException(BookingException):
    """Raised when trying to book an unavailable time slot"""
    default_message = "The selected time slot is not available"


class BookingAlreadyExistsException(BookingException):
    """Raised when trying to book a slot that's already booked"""
    default_message = "This time slot has already been booked"
    status_code = status.HTTP_409_CONFLICT


class MaxBookingsExceededException(BookingException):
    """Raised when user tries to exceed maximum active bookings"""
    default_message = "You have reached the maximum number of active bookings (5)"
    status_code = status.HTTP_403_FORBIDDEN


class BookingCancellationException(BookingException):
    """Raised when booking cannot be cancelled"""
    default_message = "This booking cannot be cancelled"


class BookingNotOwnedException(BookingException):
    """Raised when user tries to access booking they don't own"""
    default_message = "You can only access your own bookings"
    status_code = status.HTTP_403_FORBIDDEN


class BookingNotFoundException(BookingException):
    """Raised when booking is not found"""
    default_message = "Booking not found"
    status_code = status.HTTP_404_NOT_FOUND


class InvalidTimeSlotException(BookingException):
    """Raised when time slot is invalid (past time, etc.)"""
    default_message = "Invalid time slot selected"


class PaymentRequiredException(BookingException):
    """Raised when booking requires payment to proceed"""
    default_message = "Payment is required to confirm this booking"
    status_code = status.HTTP_402_PAYMENT_REQUIRED


def custom_exception_handler(exc, context):
    """Custom exception handler for booking exceptions"""
    response = exception_handler(exc, context)

    if isinstance(exc, BookingException):
        custom_response_data = {
            'error': {
                'code': exc.__class__.__name__,
                'message': str(exc),
                'type': 'booking_error'
            }
        }
        return Response(
            custom_response_data,
            status=exc.status_code
        )

    return response