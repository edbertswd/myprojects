from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import Facility, Court, SportType, Availability
from .serializers import (
    FacilityListSerializer,
    FacilityDetailSerializer,
    FacilityCreateUpdateSerializer,
    CourtSerializer,
    SportTypeSerializer,
    AvailabilitySerializer
)
from app.utils.audit import ActivityLogger


class FacilityListView(generics.ListAPIView):
    """
    List all active facilities
    GET /facilities/
    """
    serializer_class = FacilityListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Facility.objects.filter(is_active=True, approval_status='approved')

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(facility_name__icontains=search)

        timezone = self.request.query_params.get('timezone', None)
        if timezone:
            queryset = queryset.filter(timezone=timezone)

        return queryset.select_related('manager__user').order_by('-created_at')


class FacilityDetailView(generics.RetrieveAPIView):
    """
    Get facility details
    GET /facilities/{facility_id}/
    """
    serializer_class = FacilityDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'facility_id'
    lookup_url_kwarg = 'facility_id'

    def get_queryset(self):
        return Facility.objects.select_related('manager__user', 'approved_by')


class FacilityCreateView(generics.CreateAPIView):
    """
    Create a new facility
    POST /facilities/create/
    """
    serializer_class = FacilityCreateUpdateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Set the submitted_by to current user
        facility = serializer.save(submitted_by=self.request.user)

        # Log facility creation - check if user is a manager
        is_manager = hasattr(self.request.user, 'manager') and self.request.user.manager is not None

        log_method = ActivityLogger.log_manager_action if is_manager else ActivityLogger.log_user_action
        log_method(
            user=self.request.user,
            action='create_facility',
            resource_type='facility',
            resource_id=facility.facility_id,
            metadata={
                'facility_name': facility.facility_name,
                'approval_status': facility.approval_status,
                'address': facility.address
            }
        )


class FacilityUpdateView(generics.UpdateAPIView):
    """
    Update a facility
    PUT/PATCH /facilities/{facility_id}/update/
    """
    serializer_class = FacilityCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'facility_id'
    lookup_url_kwarg = 'facility_id'

    def get_queryset(self):
        # Only allow managers to update their own facilities
        user = self.request.user
        if hasattr(user, 'manager'):
            return Facility.objects.filter(manager=user.manager)
        return Facility.objects.none()


class SportTypeListView(generics.ListAPIView):
    """
    List all sport types
    GET /facilities/sport-types/
    """
    serializer_class = SportTypeSerializer
    permission_classes = [AllowAny]
    queryset = SportType.objects.all().order_by('sport_name')


class CourtListView(generics.ListAPIView):
    """
    List courts for a facility
    GET /facilities/{facility_id}/courts/
    """
    serializer_class = CourtSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        facility_id = self.kwargs.get('facility_id')
        return Court.objects.filter(
            facility_id=facility_id,
            is_active=True
        ).select_related('facility', 'sport_type').order_by('name')


class CourtDetailView(generics.RetrieveAPIView):
    """
    Get details for a specific court
    GET /facilities/courts/{court_id}/
    """
    serializer_class = CourtSerializer
    permission_classes = [AllowAny]
    lookup_field = 'court_id'
    lookup_url_kwarg = 'court_id'

    def get_queryset(self):
        return Court.objects.filter(is_active=True).select_related('facility', 'sport_type')


class AvailabilityListView(generics.ListAPIView):
    """
    List availability for a court
    GET /facilities/courts/{court_id}/availability/
    """
    serializer_class = AvailabilitySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from django.utils import timezone as django_timezone
        from datetime import datetime
        import pytz
        from django.db.models import Q, Exists, OuterRef
        from app.bookings.models import ReservationSlot

        court_id = self.kwargs.get('court_id')
        current_user = self.request.user

        # Subquery to check if availability has an active reservation by another user
        active_reservations_by_others = ReservationSlot.objects.filter(
            availability_id=OuterRef('availability_id'),
            reservation__expires_at__gt=django_timezone.now()
        )

        # If user is authenticated, exclude their own reservations
        if current_user.is_authenticated:
            active_reservations_by_others = active_reservations_by_others.exclude(
                reservation__user=current_user
            )

        queryset = Availability.objects.filter(
            court_id=court_id,
            is_available=True
        ).select_related('court__facility').annotate(
            has_active_reservation=Exists(active_reservations_by_others)
        ).filter(
            has_active_reservation=False  # Exclude slots reserved by others
        )

        # Optional date filter with timezone handling
        start_date_str = self.request.query_params.get('start_date', None)
        end_date_str = self.request.query_params.get('end_date', None)

        if start_date_str or end_date_str:
            # Get the facility's timezone from the first court
            court = Court.objects.filter(court_id=court_id).select_related('facility').first()
            if court and court.facility:
                tz = pytz.timezone(court.facility.timezone)
            else:
                tz = django_timezone.get_current_timezone()

            if start_date_str:
                # Parse the datetime string and make it timezone-aware
                try:
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                    if start_date.tzinfo is None:
                        start_date = tz.localize(start_date)
                    queryset = queryset.filter(start_time__gte=start_date)
                except (ValueError, AttributeError):
                    pass  # Invalid date format, skip filter

            if end_date_str:
                try:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                    if end_date.tzinfo is None:
                        end_date = tz.localize(end_date)
                    queryset = queryset.filter(end_time__lte=end_date)
                except (ValueError, AttributeError):
                    pass  # Invalid date format, skip filter

        return queryset.order_by('start_time')


@api_view(['GET'])
@permission_classes([AllowAny])
def facility_search_view(request):
    """
    Search facilities with filters
    GET /facilities/search/
    Supports pagination with ?page=N parameter
    """
    from rest_framework.pagination import PageNumberPagination
    from django.db.models import Q

    queryset = Facility.objects.filter(is_active=True, approval_status='approved')

    # Search by name or address
    query = request.query_params.get('q', None)
    if query:
        queryset = queryset.filter(
            Q(facility_name__icontains=query) | Q(address__icontains=query)
        )

    # Filter by timezone
    timezone = request.query_params.get('timezone', None)
    if timezone:
        queryset = queryset.filter(timezone=timezone)

    # Filter by sport type (through courts)
    sport_type = request.query_params.get('sport_type', None)
    if sport_type:
        queryset = queryset.filter(court__sport_type__sport_name__icontains=sport_type).distinct()

    # Order by most recent
    queryset = queryset.select_related('manager__user').order_by('-created_at')

    # Paginate the results
    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated_queryset = paginator.paginate_queryset(queryset, request)

    serializer = FacilityListSerializer(paginated_queryset, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
