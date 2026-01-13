"""
Facility Moderation Views for Admin Dashboard
Handles facility suspension, analytics, and commission adjustments
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from app.auth.permissions import IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Avg, F, Q, FloatField, ExpressionWrapper
from django.db.models.functions import ExtractHour, Extract, Cast
from datetime import timedelta
from decimal import Decimal

from app.facilities.models import Facility, Court
from app.bookings.models import Booking
from .models import FacilitySuspension, CommissionAdjustment, AdminActionLog
from .serializers import (
    FacilitySuspensionSerializer, FacilityUnsuspensionSerializer,
    CommissionAdjustmentSerializer, FacilityAnalyticsSerializer
)


# ====== Facility Suspension Endpoints ======

@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_facility(request, facility_id):
    """
    Suspend a facility
    POST /api/admin/facilities/{facility_id}/suspend/
    Body: { "reason": "Policy violation...", "duration_days": 30 }
    """
    serializer = FacilitySuspensionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if facility.is_suspended:
        return Response(
            {'detail': 'Facility is already suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate expiration date if duration is provided
    duration_days = serializer.validated_data.get('duration_days')
    expires_at = None
    if duration_days:
        expires_at = timezone.now() + timedelta(days=duration_days)

    # Create suspension record
    suspension = FacilitySuspension.objects.create(
        facility=facility,
        suspended_by=request.user,
        reason=serializer.validated_data['reason'],
        duration_days=duration_days,
        expires_at=expires_at,
        status='active'
    )

    # Update facility status
    facility.is_suspended = True
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='suspend_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'duration_days': duration_days,
            'expires_at': expires_at.isoformat() if expires_at else None,
            'suspension_id': suspension.suspension_id,
            'facility_name': facility.facility_name,
        }
    )

    return Response({
        'detail': 'Facility suspended successfully',
        'data': {
            'suspension_id': suspension.suspension_id,
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
            'suspended_until': expires_at.isoformat() if expires_at else 'Indefinite',
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def unsuspend_facility(request, facility_id):
    """
    Unsuspend a facility
    POST /api/admin/facilities/{facility_id}/unsuspend/
    Body: { "reason": "Suspension lifted because..." }
    """
    serializer = FacilityUnsuspensionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if not facility.is_suspended:
        return Response(
            {'detail': 'Facility is not currently suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find active suspension
    active_suspension = FacilitySuspension.objects.filter(
        facility=facility,
        status='active'
    ).order_by('-suspended_at').first()

    if active_suspension:
        active_suspension.status = 'lifted'
        active_suspension.unsuspended_at = timezone.now()
        active_suspension.unsuspended_by = request.user
        active_suspension.unsuspension_reason = serializer.validated_data['reason']
        active_suspension.save()

    # Update facility status
    facility.is_suspended = False
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='unsuspend_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'suspension_id': active_suspension.suspension_id if active_suspension else None,
            'facility_name': facility.facility_name,
        }
    )

    return Response({
        'detail': 'Facility unsuspended successfully',
        'data': {
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
        }
    }, status=status.HTTP_200_OK)


# ====== Facility Analytics Endpoint ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def facility_analytics(request, facility_id):
    """
    Get analytics for a specific facility
    GET /api/admin/facilities/{facility_id}/analytics/
    """
    facility = get_object_or_404(Facility.objects.select_related('manager__user'), facility_id=facility_id)

    # Get courts
    courts = Court.objects.filter(facility=facility)
    total_courts = courts.count()
    active_courts = courts.filter(is_active=True).count()

    # Get all bookings for this facility
    bookings = Booking.objects.filter(
        court__facility=facility
    ).select_related('status', 'court__sport_type')

    total_bookings = bookings.count()

    # Count bookings by status
    completed_bookings = bookings.filter(status__status_name='confirmed').count()
    cancelled_bookings = bookings.filter(status__status_name='cancelled').count()

    # Calculate revenue (hourly_rate_snapshot * hours)
    revenue_data = bookings.aggregate(
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

    # Average booking rate (occupancy)
    if total_courts > 0:
        # Simple calculation: bookings / (courts * days in operation)
        days_in_operation = max((timezone.now().date() - facility.created_at.date()).days, 1)
        average_booking_rate = (total_bookings / (total_courts * days_in_operation)) * 100
    else:
        average_booking_rate = 0.0

    # This month's data
    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    bookings_this_month = bookings.filter(created_at__gte=month_start).count()

    month_revenue_data = bookings.filter(created_at__gte=month_start).aggregate(
        month_revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )
    revenue_this_month = Decimal(str(month_revenue_data['month_revenue'] or 0))

    # Peak booking hour
    peak_hour_data = bookings.annotate(
        hour=ExtractHour('start_time')
    ).values('hour').annotate(
        count=Count('booking_id')
    ).order_by('-count').first()

    peak_booking_hour = peak_hour_data['hour'] if peak_hour_data else None

    # Most popular sport
    sport_data = bookings.values('court__sport_type__sport_name').annotate(
        count=Count('booking_id')
    ).order_by('-count').first()

    most_popular_sport = sport_data['court__sport_type__sport_name'] if sport_data else None

    # Build response data
    analytics_data = {
        'facility_id': facility.facility_id,
        'facility_name': facility.facility_name,
        'manager_name': facility.manager.user.name if facility.manager else 'N/A',
        'total_courts': total_courts,
        'active_courts': active_courts,
        'total_bookings': total_bookings,
        'completed_bookings': completed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'total_revenue': round(total_revenue, 2),
        'commission_collected': round(commission_collected, 2),
        'average_booking_rate': round(average_booking_rate, 2),
        'bookings_this_month': bookings_this_month,
        'revenue_this_month': round(revenue_this_month, 2),
        'peak_booking_hour': peak_booking_hour,
        'most_popular_sport': most_popular_sport,
    }

    serializer = FacilityAnalyticsSerializer(data=analytics_data)
    if serializer.is_valid():
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)
    else:
        return Response(analytics_data, status=status.HTTP_200_OK)


# ====== Commission Adjustment Endpoint ======

@api_view(['POST'])
@permission_classes([IsAdminUser])
def adjust_commission_rate(request, facility_id):
    """
    Adjust commission rate for a facility
    POST /api/admin/facilities/{facility_id}/commission/
    Body: { "new_rate": 0.15, "reason": "Adjusted due to...", "effective_date": "2025-01-01T00:00:00Z" }
    """
    serializer = CommissionAdjustmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    old_rate = facility.commission_rate
    new_rate = serializer.validated_data['new_rate']
    reason = serializer.validated_data['reason']
    effective_date = serializer.validated_data.get('effective_date', timezone.now())

    # Create adjustment record
    adjustment = CommissionAdjustment.objects.create(
        facility=facility,
        adjusted_by=request.user,
        old_rate=old_rate,
        new_rate=new_rate,
        reason=reason,
        effective_date=effective_date,
        metadata={
            'facility_name': facility.facility_name,
            'manager_email': facility.manager.user.email if facility.manager else None,
        }
    )

    # Update facility commission rate if effective immediately
    if effective_date <= timezone.now():
        facility.commission_rate = new_rate
        facility.save()

    # Calculate financial impact (estimated)
    # Get average monthly revenue
    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_revenue_data = Booking.objects.filter(
        court__facility=facility,
        created_at__gte=month_start
    ).aggregate(
        month_revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )
    monthly_revenue = Decimal(str(month_revenue_data['month_revenue'] or 0))
    financial_impact = monthly_revenue * (new_rate - old_rate)

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='adjust_commission_rate',
        resource_type='facility',
        resource_id=facility_id,
        reason=reason,
        financial_impact=financial_impact,
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'adjustment_id': adjustment.adjustment_id,
            'old_rate': str(old_rate),
            'new_rate': str(new_rate),
            'effective_date': effective_date.isoformat(),
            'facility_name': facility.facility_name,
            'estimated_monthly_impact': str(round(financial_impact, 2)),
        }
    )

    return Response({
        'detail': 'Commission rate adjusted successfully',
        'data': {
            'adjustment_id': adjustment.adjustment_id,
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
            'old_rate': f"{float(old_rate) * 100}%",
            'new_rate': f"{float(new_rate) * 100}%",
            'effective_date': effective_date.isoformat(),
            'estimated_monthly_impact': f"${round(financial_impact, 2)}",
        }
    }, status=status.HTTP_200_OK)
