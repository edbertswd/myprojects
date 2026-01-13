"""
Views for temporary reservation system.
Handles creating and managing temporary slot reservations during checkout.
"""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from app.auth.permissions import IsAuthenticated
from .models import TemporaryReservation
from .serializers import (
    CreateReservationSerializer,
    TemporaryReservationSerializer
)
from .services import ReservationService
from .exceptions import BookingException
from .permissions import IsAuthenticatedAndVerified


class CreateReservationView(generics.CreateAPIView):
    """
    Create a temporary reservation for availability slots
    POST /bookings/v1/reservations/
    """
    serializer_class = CreateReservationSerializer
    permission_classes = [IsAuthenticated]  # Allow unverified users to reserve (payment will create verified booking)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            availability_ids = serializer.validated_data['availability_ids']
            session_id = request.session.session_key

            reservation = ReservationService.create_reservation(
                user=request.user,
                availability_ids=availability_ids,
                session_id=session_id
            )

            response_serializer = TemporaryReservationSerializer(reservation)
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
                        'type': 'reservation_error'
                    }
                },
                status=e.status_code
            )


class ReservationDetailView(generics.RetrieveDestroyAPIView):
    """
    Get or cancel a reservation
    GET/DELETE /bookings/v1/reservations/<reservation_id>/
    """
    serializer_class = TemporaryReservationSerializer
    permission_classes = [IsAuthenticated]  # Allow unverified users to manage their reservations

    def get_object(self):
        reservation_id = self.kwargs['reservation_id']
        reservation = ReservationService.get_reservation(
            reservation_id=reservation_id,
            user=self.request.user
        )
        if not reservation:
            from rest_framework.exceptions import NotFound
            raise NotFound("Reservation not found")
        return reservation

    def destroy(self, request, *args, **kwargs):
        reservation_id = self.kwargs['reservation_id']
        success = ReservationService.cancel_reservation(
            reservation_id=reservation_id,
            user=request.user
        )
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "Reservation not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_reservation(request):
    """
    Get user's active reservation if any
    GET /bookings/v1/reservations/active/
    """
    reservation = ReservationService.get_user_active_reservation(request.user)
    if reservation:
        serializer = TemporaryReservationSerializer(reservation)
        return Response(serializer.data)
    return Response({"message": "No active reservation"}, status=status.HTTP_404_NOT_FOUND)
