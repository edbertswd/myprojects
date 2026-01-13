from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import generics, status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count
from datetime import timedelta
from decimal import Decimal

from .permissions import IsManager
from app.facilities.models import Facility, Court, Availability
from app.facilities.serializers import (
    FacilityDetailSerializer,
    FacilityCreateUpdateSerializer,
    CourtSerializer,
    CourtCreateUpdateSerializer,
    AvailabilitySerializer,
    AvailabilityCreateUpdateSerializer
)
from app.bookings.models import Booking
from app.utils.audit import ActivityLogger


@api_view(['GET'])
@permission_classes([IsManager])
def manager_overview_view(request):
    """
    Get manager dashboard overview with booking statistics
    GET /api/manager/overview/
    """
    manager = request.user.manager

    # Get all facilities managed by this manager
    facilities = Facility.objects.filter(
        manager=manager,
        is_active=True
    )

    # Get facility IDs for filtering bookings
    facility_ids = list(facilities.values_list('facility_id', flat=True))

    # Get commission rate (assuming all facilities have same rate, take first)
    commission_rate = facilities.first().commission_rate if facilities.exists() else Decimal('0.10')

    # Calculate today's bookings
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_count = Booking.objects.filter(
        court__facility_id__in=facility_ids,
        start_time__gte=today_start,
        start_time__lt=today_end
    ).exclude(
        status__status_name='cancelled'
    ).count()

    # Calculate next 7 days bookings (including today)
    next7d_end = today_start + timedelta(days=7)

    next7d_count = Booking.objects.filter(
        court__facility_id__in=facility_ids,
        start_time__gte=today_start,
        start_time__lt=next7d_end
    ).exclude(
        status__status_name='cancelled'
    ).count()

    # Calculate revenue (all-time for confirmed bookings)
    from django.db.models import Sum, F, FloatField, ExpressionWrapper
    from django.db.models.functions import Cast, Extract

    confirmed_bookings = Booking.objects.filter(
        court__facility_id__in=facility_ids,
        status__status_name='confirmed'
    )

    revenue_data = confirmed_bookings.aggregate(
        total_revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        ),
        total_commission=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') * F('commission_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )

    total_revenue = Decimal(str(revenue_data['total_revenue'] or 0))
    commission_collected = Decimal(str(revenue_data['total_commission'] or 0))
    net_revenue = total_revenue - commission_collected

    # Format facilities for response
    facilities_list = [
        {
            'id': f.facility_id,
            'name': f.facility_name
        }
        for f in facilities
    ]

    return Response({
        'today_count': today_count,
        'next7d_count': next7d_count,
        'facilities': facilities_list,
        'total_revenue': f"{total_revenue:.2f}",
        'commission_collected': f"{commission_collected:.2f}",
        'commission_rate': f"{float(commission_rate) * 100:.2f}",  # As percentage
        'net_revenue': f"{net_revenue:.2f}",
        'last_updated': timezone.now().isoformat(),
    })


class ManagerFacilityListView(generics.ListAPIView):
    """
    List all facilities owned by the manager
    GET /api/manager/facilities/
    """
    serializer_class = FacilityDetailSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return Facility.objects.filter(
            manager=self.request.user.manager
        ).select_related('approved_by').order_by('-created_at')


class ManagerFacilityDetailView(generics.RetrieveUpdateAPIView):
    """
    Get or update a facility owned by the manager
    GET/PUT /api/manager/facilities/{id}/
    """
    permission_classes = [IsManager]
    lookup_field = 'facility_id'
    lookup_url_kwarg = 'facility_id'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FacilityDetailSerializer
        return FacilityCreateUpdateSerializer

    def get_queryset(self):
        # Only allow managers to access their own facilities
        return Facility.objects.filter(manager=self.request.user.manager)

    def get_object(self):
        """Override to include courts in the response"""
        facility = super().get_object()
        return facility

    def update(self, request, *args, **kwargs):
        """Override to add audit logging"""
        facility = self.get_object()
        response = super().update(request, *args, **kwargs)

        # Log facility update
        ActivityLogger.log_manager_action(
            user=request.user,
            action='update_facility',
            resource_type='facility',
            resource_id=facility.facility_id,
            metadata={
                'facility_name': facility.facility_name,
                'updated_fields': list(request.data.keys())
            }
        )

        return response


@api_view(['GET', 'POST'])
@permission_classes([IsManager])
def manager_facility_courts_view(request, facility_id):
    """
    Get all courts for a facility owned by the manager or create a new court
    GET/POST /api/manager/facilities/{facility_id}/courts/
    """
    # Verify facility ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    if request.method == 'POST':
        # Check max courts limit
        current_count = Court.objects.filter(facility=facility).count()
        if current_count >= 20:
            return Response(
                {'error': 'Maximum of 20 courts per facility allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add facility to request data
        data = request.data.copy()
        data['facility'] = facility.facility_id

        serializer = CourtSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    courts = Court.objects.filter(
        facility=facility
    ).select_related('sport_type').order_by('created_at')

    serializer = CourtSerializer(courts, many=True)
    return Response({
        'facility_id': facility.facility_id,
        'facility_name': facility.facility_name,
        'courts': serializer.data,
        'court_count': courts.count(),
        'max_courts': 20
    })


@api_view(['POST'])
@permission_classes([IsManager])
def manager_create_court_view(request, facility_id):
    """
    Create a new court for a facility owned by the manager
    POST /api/manager/facilities/{facility_id}/courts/
    """
    # Verify facility ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    # Check court limit (max 20)
    current_count = Court.objects.filter(facility=facility).count()
    if current_count >= 20:
        return Response(
            {'error': 'Maximum of 20 courts per facility reached'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = CourtCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        court = serializer.save(facility=facility)

        # Auto-generate availability if operating hours are provided
        if court.opening_time and court.closing_time and court.availability_start_date:
            _generate_court_availability(court, facility)

        # Log court creation
        ActivityLogger.log_manager_action(
            user=request.user,
            action='create_court',
            resource_type='court',
            resource_id=court.court_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_name': court.name,
                'sport_type': court.sport_type.sport_name if court.sport_type else None
            }
        )

        # Return full court data
        court_data = CourtSerializer(court).data
        return Response(court_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsManager])
def manager_update_court_view(request, facility_id, court_id):
    """
    Update a court for a facility owned by the manager
    PUT/PATCH /api/manager/facilities/{facility_id}/courts/{court_id}/
    """
    # Verify facility ownership and court belongs to facility
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)

    partial = request.method == 'PATCH'
    serializer = CourtCreateUpdateSerializer(court, data=request.data, partial=partial)

    if serializer.is_valid():
        updated_court = serializer.save()

        # Regenerate availability if operating hours changed
        hours_changed = (
            'opening_time' in request.data or
            'closing_time' in request.data or
            'availability_start_date' in request.data
        )

        if hours_changed and updated_court.opening_time and updated_court.closing_time and updated_court.availability_start_date:
            # Delete future availability and regenerate
            _regenerate_court_availability(updated_court, facility)

        # Log court update
        ActivityLogger.log_manager_action(
            user=request.user,
            action='update_court',
            resource_type='court',
            resource_id=updated_court.court_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_name': updated_court.name,
                'updated_fields': list(request.data.keys())
            }
        )

        # Return full court data
        court_data = CourtSerializer(updated_court).data
        return Response(court_data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsManager])
def manager_delete_court_view(request, facility_id, court_id):
    """
    Delete or deactivate a court for a facility owned by the manager
    DELETE /api/manager/facilities/{facility_id}/courts/{court_id}/delete/?permanent=true - Hard delete
    PATCH /api/manager/facilities/{facility_id}/courts/{court_id}/delete/ - Soft delete (deactivate)
    """
    # Verify facility ownership and court belongs to facility
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)

    # Check if this is a permanent delete request
    permanent = request.query_params.get('permanent', 'false').lower() == 'true'

    if permanent or request.method == 'DELETE':
        # Check for active bookings before hard delete
        active_bookings = Booking.objects.filter(
            court=court,
            start_time__gte=timezone.now()
        ).exclude(
            status__status_name='cancelled'
        ).count()

        if active_bookings > 0:
            return Response(
                {
                    'error': f'Cannot delete court with {active_bookings} active booking(s)',
                    'active_bookings': active_bookings
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Log court deletion before deleting
        ActivityLogger.log_manager_action(
            user=request.user,
            action='delete_court',
            resource_type='court',
            resource_id=court.court_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_name': court.name,
                'deletion_type': 'permanent'
            }
        )

        # Hard delete - remove the court permanently
        court.delete()
        return Response(
            {'message': 'Court deleted permanently'},
            status=status.HTTP_200_OK
        )
    else:
        # Soft delete by setting is_active to False
        # This preserves data integrity for existing bookings
        court.is_active = False
        court.save()

        # Log court deactivation
        ActivityLogger.log_manager_action(
            user=request.user,
            action='deactivate_court',
            resource_type='court',
            resource_id=court.court_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_name': court.name,
                'deletion_type': 'soft'
            }
        )

        return Response(
            {'message': 'Court deactivated successfully'},
            status=status.HTTP_200_OK
        )


@api_view(['GET', 'POST'])
@permission_classes([IsManager])
def manager_court_availability_view(request, facility_id, court_id):
    """
    Get all availability for a specific court owned by the manager or create new availability
    GET/POST /api/manager/facilities/{facility_id}/courts/{court_id}/availability/
    """
    # Verify facility and court ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)

    if request.method == 'POST':
        # Add court to request data
        data = request.data.copy()
        data['court'] = court.court_id

        serializer = AvailabilitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Get all availability for this court
    availability = Availability.objects.filter(
        court=court
    ).order_by('start_time')

    # Optional date filter
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if start_date:
        availability = availability.filter(start_time__gte=start_date)
    if end_date:
        availability = availability.filter(end_time__lte=end_date)

    serializer = AvailabilitySerializer(availability, many=True)
    return Response({
        'court_id': court.court_id,
        'court_name': court.name,
        'facility_id': facility.facility_id,
        'facility_name': facility.facility_name,
        'availability': serializer.data,
    })


@api_view(['POST'])
@permission_classes([IsManager])
def manager_create_availability_view(request, facility_id, court_id):
    """
    Create new availability slot for a court owned by the manager
    POST /api/manager/facilities/{facility_id}/courts/{court_id}/availability/
    """
    # Verify facility and court ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)

    serializer = AvailabilityCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        # Check for overlapping availability
        start_time = serializer.validated_data['start_time']
        end_time = serializer.validated_data['end_time']

        overlapping = Availability.objects.filter(
            court=court,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        if overlapping:
            return Response(
                {'error': 'This time slot overlaps with existing availability'},
                status=status.HTTP_400_BAD_REQUEST
            )

        availability = serializer.save(court=court)

        # Log availability creation
        ActivityLogger.log_manager_action(
            user=request.user,
            action='create_availability',
            resource_type='availability',
            resource_id=availability.availability_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_id': court.court_id,
                'court_name': court.name,
                'start_time': availability.start_time.isoformat(),
                'end_time': availability.end_time.isoformat()
            }
        )

        # Return full availability data
        availability_data = AvailabilitySerializer(availability).data
        return Response(availability_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsManager])
def manager_update_availability_view(request, facility_id, court_id, availability_id):
    """
    Update or delete availability slot for a court owned by the manager
    PUT/PATCH/DELETE /api/manager/facilities/{facility_id}/courts/{court_id}/availability/{availability_id}/
    """
    # Verify facility and court ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)
    availability = get_object_or_404(Availability, availability_id=availability_id, court=court)

    if request.method == 'DELETE':
        # Check if availability is booked
        from app.bookings.models import Booking
        if Booking.objects.filter(availability=availability).exists():
            return Response(
                {'error': 'Cannot delete availability that has bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )

        availability.delete()
        return Response(
            {'message': 'Availability deleted successfully'},
            status=status.HTTP_200_OK
        )

    partial = request.method == 'PATCH'
    serializer = AvailabilityCreateUpdateSerializer(availability, data=request.data, partial=partial)

    if serializer.is_valid():
        # Check for overlapping availability (excluding current slot)
        start_time = serializer.validated_data.get('start_time', availability.start_time)
        end_time = serializer.validated_data.get('end_time', availability.end_time)

        overlapping = Availability.objects.filter(
            court=court,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exclude(availability_id=availability_id).exists()

        if overlapping:
            return Response(
                {'error': 'This time slot overlaps with existing availability'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_availability = serializer.save()

        # Log availability update
        ActivityLogger.log_manager_action(
            user=request.user,
            action='update_availability',
            resource_type='availability',
            resource_id=updated_availability.availability_id,
            metadata={
                'facility_id': facility.facility_id,
                'facility_name': facility.facility_name,
                'court_id': court.court_id,
                'court_name': court.name,
                'updated_fields': list(request.data.keys()),
                'start_time': updated_availability.start_time.isoformat(),
                'end_time': updated_availability.end_time.isoformat()
            }
        )

        # Return full availability data
        availability_data = AvailabilitySerializer(updated_availability).data
        return Response(availability_data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsManager])
def manager_delete_availability_view(request, facility_id, court_id, availability_id):
    """
    Delete availability slot for a court owned by the manager
    DELETE /api/manager/facilities/{facility_id}/courts/{court_id}/availability/{availability_id}/
    """
    # Verify facility and court ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )

    court = get_object_or_404(Court, court_id=court_id, facility=facility)
    availability = get_object_or_404(Availability, availability_id=availability_id, court=court)

    # Check if availability is already booked
    from app.bookings.models import Booking
    has_bookings = Booking.objects.filter(availability=availability).exists()

    if has_bookings:
        return Response(
            {'error': 'Cannot delete availability with existing bookings'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Log availability deletion before deleting
    ActivityLogger.log_manager_action(
        user=request.user,
        action='delete_availability',
        resource_type='availability',
        resource_id=availability.availability_id,
        metadata={
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
            'court_id': court.court_id,
            'court_name': court.name,
            'start_time': availability.start_time.isoformat(),
            'end_time': availability.end_time.isoformat()
        }
    )

    availability.delete()
    return Response(
        {'message': 'Availability deleted successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsManager])
def manager_bulk_create_availability_view(request, facility_id, court_id):
    """
    Bulk create availability slots for a court
    POST /api/manager/facilities/{facility_id}/courts/{court_id}/availability/bulk/

    Body: {
        "start_date": "2025-10-23",
        "end_date": "2025-11-23",
        "days_of_week": [1, 2, 3, 4, 5],  # Monday=1, Sunday=7
        "start_time": "10:00",
        "end_time": "22:00",
        "slot_duration_minutes": 60
    }
    """
    from datetime import datetime, timedelta
    import pytz

    # Verify facility and court ownership
    facility = get_object_or_404(
        Facility,
        facility_id=facility_id,
        manager=request.user.manager
    )
    court = get_object_or_404(Court, court_id=court_id, facility=facility)

    # Parse request data
    start_date_str = request.data.get('start_date')
    end_date_str = request.data.get('end_date')
    days_of_week = request.data.get('days_of_week', [])  # 1=Monday, 7=Sunday
    start_time_str = request.data.get('start_time')
    end_time_str = request.data.get('end_time')
    slot_duration = request.data.get('slot_duration_minutes', 60)

    # Validation
    if not all([start_date_str, end_date_str, days_of_week, start_time_str, end_time_str]):
        return Response(
            {'error': 'Missing required fields'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

        # Parse times
        start_hour, start_minute = map(int, start_time_str.split(':'))
        end_hour, end_minute = map(int, end_time_str.split(':'))

    except ValueError as e:
        return Response(
            {'error': f'Invalid date/time format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if end_date < start_date:
        return Response(
            {'error': 'End date must be after start date'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get facility timezone
    tz = pytz.timezone(facility.timezone)

    # Generate all slots
    created_slots = []
    skipped_count = 0
    current_date = start_date

    while current_date <= end_date:
        # Check if this day of week is selected (1=Monday, 7=Sunday)
        day_of_week = current_date.isoweekday()

        if day_of_week in days_of_week:
            # Generate slots for this day
            current_time = datetime.combine(current_date, datetime.min.time()).replace(
                hour=start_hour, minute=start_minute, tzinfo=tz
            )
            end_of_day = datetime.combine(current_date, datetime.min.time()).replace(
                hour=end_hour, minute=end_minute, tzinfo=tz
            )

            while current_time < end_of_day:
                slot_end = current_time + timedelta(minutes=slot_duration)

                if slot_end > end_of_day:
                    break

                # Check for overlapping availability
                overlapping = Availability.objects.filter(
                    court=court,
                    start_time__lt=slot_end,
                    end_time__gt=current_time
                ).exists()

                if not overlapping:
                    # Create the slot
                    availability = Availability.objects.create(
                        court=court,
                        start_time=current_time,
                        end_time=slot_end,
                        is_available=True
                    )
                    created_slots.append(availability)
                else:
                    skipped_count += 1

                current_time = slot_end

        current_date += timedelta(days=1)

    # Log bulk availability creation
    ActivityLogger.log_manager_action(
        user=request.user,
        action='bulk_create_availability',
        resource_type='availability',
        resource_id=None,
        metadata={
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
            'court_id': court.court_id,
            'court_name': court.name,
            'created_count': len(created_slots),
            'skipped_count': skipped_count,
            'start_date': start_date_str,
            'end_date': end_date_str,
            'days_of_week': days_of_week,
            'time_range': f'{start_time_str} - {end_time_str}',
            'slot_duration': slot_duration
        }
    )

    # Serialize created slots
    serializer = AvailabilitySerializer(created_slots, many=True)

    return Response({
        'message': f'Created {len(created_slots)} availability slots',
        'created_count': len(created_slots),
        'skipped_count': skipped_count,
        'availability': serializer.data
    }, status=status.HTTP_201_CREATED)


# Helper functions for automatic availability generation

def _generate_court_availability(court, facility):
    """
    Generate availability slots for a court based on its operating hours
    Creates slots for 3 months from the start date
    """
    from datetime import datetime, timedelta
    import pytz

    if not court.opening_time or not court.closing_time or not court.availability_start_date:
        return

    # Generate for 3 months
    start_date = court.availability_start_date
    end_date = start_date + timedelta(days=90)

    # All days of the week
    days_of_week = [1, 2, 3, 4, 5, 6, 7]

    # Convert times to strings for the bulk endpoint logic
    start_time_str = court.opening_time.strftime('%H:%M')
    end_time_str = court.closing_time.strftime('%H:%M')

    tz = pytz.timezone(facility.timezone)

    created_count = 0
    current_date = start_date

    while current_date <= end_date:
        day_of_week = current_date.isoweekday()

        if day_of_week in days_of_week:
            # Generate 1-hour slots for this day
            current_time = tz.localize(datetime.combine(current_date, court.opening_time))
            end_of_day = tz.localize(datetime.combine(current_date, court.closing_time))

            while current_time < end_of_day:
                slot_end = current_time + timedelta(hours=1)

                if slot_end > end_of_day:
                    break

                # Check for overlapping availability
                overlapping = Availability.objects.filter(
                    court=court,
                    start_time__lt=slot_end,
                    end_time__gt=current_time
                ).exists()

                if not overlapping:
                    Availability.objects.create(
                        court=court,
                        start_time=current_time,
                        end_time=slot_end,
                        is_available=True
                    )
                    created_count += 1

                current_time = slot_end

        current_date += timedelta(days=1)

    return created_count


def _regenerate_court_availability(court, facility):
    """
    Delete future un-booked availability and regenerate based on new hours
    """
    # Delete future availability that hasn't been booked
    future_availability = Availability.objects.filter(
        court=court,
        start_time__gte=timezone.now()
    )

    # Only delete slots without bookings
    for slot in future_availability:
        has_booking = Booking.objects.filter(availability=slot).exists()
        if not has_booking:
            slot.delete()

    # Generate new availability
    return _generate_court_availability(court, facility)
