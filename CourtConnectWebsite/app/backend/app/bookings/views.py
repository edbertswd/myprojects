from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Booking
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    BookingCancelSerializer
)
from .permissions import (
    IsAuthenticatedAndVerified,
    IsBookingOwner,
    IsBookingOwnerOrManager,
    CanCreateBooking
)
from .services import BookingService
from .exceptions import BookingException
from app.utils.audit import ActivityLogger


class CreateBookingView(generics.CreateAPIView):
    """
    Create a new booking
    POST /bookings/v1/
    """
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticatedAndVerified, CanCreateBooking]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Support both single and multiple availability IDs
            validated_data = serializer.validated_data
            availability_id = validated_data.get('availability_id')
            availability_ids = validated_data.get('availability_ids')

            booking = BookingService.create_booking(
                user=request.user,
                availability_id=availability_id,
                availability_ids=availability_ids
            )

            # Log booking creation
            ActivityLogger.log_user_action(
                user=request.user,
                action='create_booking',
                resource_type='booking',
                resource_id=booking.booking_id,
                metadata={
                    'facility_id': booking.court.facility.facility_id,
                    'facility_name': booking.court.facility.facility_name,
                    'court_id': booking.court.court_id,
                    'court_name': booking.court.name,
                    'start_time': booking.start_time.isoformat(),
                    'end_time': booking.end_time.isoformat(),
                    'hourly_rate': str(booking.hourly_rate_snapshot),
                }
            )

            response_serializer = BookingDetailSerializer(booking)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        except BookingException as e:
            return Response(
                {
                    'error': {
                        'code': e.__class__.__name__,
                        'message': str(e),
                        'type': 'booking_error'
                    }
                },
                status=e.status_code
            )


class BookingDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific booking
    GET /bookings/v1/{booking_id}/
    """
    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticatedAndVerified, IsBookingOwnerOrManager]
    lookup_field = 'booking_id'
    lookup_url_kwarg = 'booking_id'

    def get_queryset(self):
        return Booking.objects.select_related(
            'court', 'court__facility', 'court__sport_type',
            'status', 'user'
        )


class CancelBookingView(generics.UpdateAPIView):
    """
    Cancel a booking
    DELETE /bookings/v1/{booking_id}/cancel/
    """
    serializer_class = BookingCancelSerializer
    permission_classes = [IsAuthenticatedAndVerified, IsBookingOwner]
    lookup_field = 'booking_id'
    lookup_url_kwarg = 'booking_id'

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        serializer = self.get_serializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cancelled_booking = BookingService.cancel_booking(
                booking=booking,
                user=request.user,
                reason=serializer.validated_data.get('reason')
            )

            # Log booking cancellation
            ActivityLogger.log_user_action(
                user=request.user,
                action='cancel_booking',
                resource_type='booking',
                resource_id=cancelled_booking.booking_id,
                metadata={
                    'facility_id': cancelled_booking.court.facility.facility_id,
                    'facility_name': cancelled_booking.court.facility.facility_name,
                    'court_id': cancelled_booking.court.court_id,
                    'court_name': cancelled_booking.court.name,
                    'cancellation_reason': serializer.validated_data.get('reason', ''),
                    'original_start_time': cancelled_booking.start_time.isoformat(),
                    'original_end_time': cancelled_booking.end_time.isoformat(),
                }
            )

            response_serializer = BookingDetailSerializer(cancelled_booking)
            return Response(response_serializer.data)

        except BookingException as e:
            return Response(
                {
                    'error': {
                        'code': e.__class__.__name__,
                        'message': str(e),
                        'type': 'booking_error'
                    }
                },
                status=e.status_code
            )

    def delete(self, request, *args, **kwargs):
        """Support DELETE method for cancellation"""
        return self.update(request, *args, **kwargs)


class MyBookingsListView(generics.ListAPIView):
    """
    List current user's bookings with filtering
    GET /bookings/v1/my-bookings/
    """
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticatedAndVerified]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        upcoming_only = self.request.query_params.get('upcoming', 'false').lower() == 'true'

        return BookingService.get_user_bookings(
            user=self.request.user,
            status_filter=status_filter,
            upcoming_only=upcoming_only
        )


@api_view(['GET'])
@permission_classes([IsAuthenticatedAndVerified])
def booking_stats_view(request):
    """
    Get booking statistics for the current user
    GET /bookings/v1/stats/
    """
    user_bookings = Booking.objects.filter(user=request.user)

    stats = {
        'total_bookings': user_bookings.count(),
        'completed_bookings': user_bookings.filter(status__status_name='completed').count(),
        'active_bookings': user_bookings.filter(
            status__status_name__in=['pending_payment', 'confirmed'],
            start_time__gt=timezone.now()
        ).count(),
        'cancelled_bookings': user_bookings.filter(status__status_name='cancelled').count(),
    }

    return Response(stats)