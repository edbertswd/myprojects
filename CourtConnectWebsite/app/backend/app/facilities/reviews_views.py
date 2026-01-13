from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import FacilityReview, Facility
from app.bookings.models import Booking
from .serializers import (
    FacilityReviewSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer
)


class CreateReviewView(generics.CreateAPIView):
    """
    Create a facility review for a completed booking
    POST /facilities/reviews/
    """
    serializer_class = ReviewCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Return the created review with full details
        response_serializer = FacilityReviewSerializer(review)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class FacilityReviewsListView(generics.ListAPIView):
    """
    List all reviews for a specific facility
    GET /facilities/{facility_id}/reviews/
    """
    serializer_class = FacilityReviewSerializer
    permission_classes = []  # Public endpoint

    def get_queryset(self):
        facility_id = self.kwargs.get('facility_id')
        return FacilityReview.objects.filter(
            facility_id=facility_id
        ).select_related('user', 'facility').order_by('-created_at')


class UpdateReviewView(generics.UpdateAPIView):
    """
    Update an existing review
    PUT/PATCH /facilities/reviews/{review_id}/
    """
    serializer_class = ReviewUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'review_id'
    lookup_url_kwarg = 'review_id'

    def get_queryset(self):
        # Only allow users to update their own reviews
        return FacilityReview.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_booking_reviewed(request, booking_id):
    """
    Check if a booking has been reviewed
    GET /facilities/bookings/{booking_id}/review-status/
    """
    booking = get_object_or_404(Booking, booking_id=booking_id, user=request.user)

    # Check if review exists
    has_review = hasattr(booking, 'review')

    response_data = {
        'has_review': has_review,
        'can_review': False,
        'review': None
    }

    if has_review:
        # Return existing review
        response_data['review'] = FacilityReviewSerializer(booking.review).data
    else:
        # Check if user can review
        can_review = (
            booking.end_time <= timezone.now() and
            booking.status.status_name != 'cancelled'
        )
        response_data['can_review'] = can_review

    return Response(response_data)


@api_view(['GET'])
def get_user_reviews(request):
    """
    Get all reviews by the current user
    GET /facilities/my-reviews/
    """
    if not request.user.is_authenticated:
        return Response([], status=status.HTTP_200_OK)

    reviews = FacilityReview.objects.filter(
        user=request.user
    ).select_related('facility', 'booking').order_by('-created_at')

    serializer = FacilityReviewSerializer(reviews, many=True)
    return Response(serializer.data)
