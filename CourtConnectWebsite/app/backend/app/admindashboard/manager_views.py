"""
Manager Moderation Views for Admin Dashboard
Handles manager applications, suspensions, and performance analytics
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from app.auth.permissions import IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, F, Case, When, Value, CharField, FloatField, ExpressionWrapper
from django.db.models.functions import Extract, Cast
from datetime import timedelta
from decimal import Decimal

from app.users.models import User, Manager
from app.facilities.models import Facility, Court, FacilitySportType
from app.bookings.models import Booking
from .models import ManagerRequest, ManagerRequestSportType, ManagerSuspension, AdminActionLog
from .serializers import (
    ManagerListSerializer, ManagerDetailSerializer,
    ManagerRequestSerializer, ManagerRequestActionSerializer,
    ManagerSuspensionSerializer, ManagerUnsuspensionSerializer,
    ManagerPerformanceSerializer
)


# ====== Manager Listing Endpoints ======

class ManagerPagination(PageNumberPagination):
    """Custom pagination for manager list"""
    page_size = 10
    page_size_query_param = 'pageSize'
    max_page_size = 100


class ManagerListView(generics.ListAPIView):
    """
    List all managers with filtering and pagination
    GET /api/admin/managers/?q=search&status=active&page=1&pageSize=10
    """
    serializer_class = ManagerListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Manager.objects.select_related('user').order_by('-created_at')

        # Search filter
        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(user__name__icontains=q) | Q(user__email__icontains=q)
            )

        # Status filter
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter == 'active':
            queryset = queryset.filter(is_suspended=False, user__is_active=True)
        elif status_filter == 'suspended':
            queryset = queryset.filter(is_suspended=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(user__is_active=False)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_paginated_response(self, data):
        """Custom pagination response format"""
        return Response({
            'data': data,
            'meta': {
                'page': self.paginator.page.number,
                'pageSize': self.paginator.page.paginator.per_page,
                'total': self.paginator.page.paginator.count,
            }
        })


class ManagerDetailView(generics.RetrieveAPIView):
    """
    Get detailed manager information
    GET /api/admin/managers/{user_id}/
    """
    serializer_class = ManagerDetailSerializer
    permission_classes = [IsAdminUser]
    queryset = Manager.objects.select_related('user')
    lookup_field = 'user_id'

    def get_object(self):
        user_id = self.kwargs.get('user_id')
        return get_object_or_404(Manager, user__user_id=user_id)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'data': serializer.data})


# ====== Manager Application Endpoints ======

class ManagerApplicationListView(generics.ListAPIView):
    """
    List pending manager application requests
    GET /api/admin/managers/applications/
    """
    serializer_class = ManagerRequestSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status', 'pending').strip()
        queryset = ManagerRequest.objects.select_related('user', 'admin_user').order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_manager_application(request, request_id):
    """
    Approve a manager application request
    POST /api/admin/managers/applications/{request_id}/approve/
    Body: { "reason": "Approved due to..." }
    """
    serializer = ManagerRequestActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    manager_request = get_object_or_404(ManagerRequest, request_id=request_id)

    if manager_request.status != 'pending':
        return Response(
            {'detail': f'Request is already {manager_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create Manager account for the user
    user = manager_request.user
    if hasattr(user, 'manager'):
        return Response(
            {'detail': 'User already has a manager account'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create Manager instance
    manager = Manager.objects.create(
        user=user,
        payout_verification_status='unverified'
    )

    # Create Facility from the manager request data
    facility = Facility.objects.create(
        manager=manager,
        submitted_by=user,
        facility_name=manager_request.facility_name,
        address=manager_request.facility_address,
        timezone=manager_request.proposed_timezone,
        latitude=manager_request.proposed_latitude,
        longitude=manager_request.proposed_longitude,
        court_count=manager_request.court_count,
        operating_hours=manager_request.operating_hours,
        approval_status='approved',  # Auto-approve facility
        approved_by=request.user,
        approved_at=timezone.now()
    )

    # Copy sport types from manager request to facility
    manager_sport_types = ManagerRequestSportType.objects.filter(request=manager_request)
    for manager_sport_type in manager_sport_types:
        FacilitySportType.objects.create(
            facility=facility,
            sport_type=manager_sport_type.sport_type
        )

    # Update manager request status and link to created facility
    manager_request.status = 'approved'
    manager_request.admin_user = request.user
    manager_request.decided_at = timezone.now()
    manager_request.approved_facility = facility
    manager_request.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='approve_manager_application',
        resource_type='manager_request',
        resource_id=request_id,
        reason=serializer.validated_data['reason'],
        target_user=user,
        metadata={
            'request_id': request_id,
            'facility_name': manager_request.facility_name,
            'facility_id': facility.facility_id,
            'facility_address': facility.address,
        }
    )

    return Response({
        'detail': 'Manager application approved successfully. Facility created and approved.',
        'data': {
            'manager_id': manager.user_id,
            'user_email': user.email,
            'user_name': user.name,
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_manager_application(request, request_id):
    """
    Reject a manager application request
    POST /api/admin/managers/applications/{request_id}/reject/
    Body: { "reason": "Rejected because..." }
    """
    serializer = ManagerRequestActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    manager_request = get_object_or_404(ManagerRequest, request_id=request_id)

    if manager_request.status != 'pending':
        return Response(
            {'detail': f'Request is already {manager_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update manager request status
    manager_request.status = 'rejected'
    manager_request.admin_user = request.user
    manager_request.decided_at = timezone.now()
    manager_request.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='reject_manager_application',
        resource_type='manager_request',
        resource_id=request_id,
        reason=serializer.validated_data['reason'],
        target_user=manager_request.user,
        metadata={
            'request_id': request_id,
            'facility_name': manager_request.facility_name,
        }
    )

    return Response({
        'detail': 'Manager application rejected successfully'
    }, status=status.HTTP_200_OK)


# ====== Manager Suspension Endpoints ======

@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_manager(request, user_id):
    """
    Suspend a manager account
    POST /api/admin/managers/{user_id}/suspend/
    Body: { "reason": "Violating terms...", "duration_days": 30 }
    """
    serializer = ManagerSuspensionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    manager = get_object_or_404(Manager, user__user_id=user_id)

    if manager.is_suspended:
        return Response(
            {'detail': 'Manager is already suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate expiration date if duration is provided
    duration_days = serializer.validated_data.get('duration_days')
    expires_at = None
    if duration_days:
        expires_at = timezone.now() + timedelta(days=duration_days)

    # Create suspension record
    suspension = ManagerSuspension.objects.create(
        manager=manager,
        suspended_by=request.user,
        reason=serializer.validated_data['reason'],
        duration_days=duration_days,
        expires_at=expires_at,
        status='active'
    )

    # Update manager status
    manager.is_suspended = True
    manager.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='suspend_manager',
        resource_type='manager',
        resource_id=user_id,
        reason=serializer.validated_data['reason'],
        target_user=manager.user,
        metadata={
            'duration_days': duration_days,
            'expires_at': expires_at.isoformat() if expires_at else None,
            'suspension_id': suspension.suspension_id,
        }
    )

    return Response({
        'detail': 'Manager suspended successfully',
        'data': {
            'suspension_id': suspension.suspension_id,
            'manager_id': manager.user_id,
            'suspended_until': expires_at.isoformat() if expires_at else 'Indefinite',
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def unsuspend_manager(request, user_id):
    """
    Unsuspend a manager account
    POST /api/admin/managers/{user_id}/unsuspend/
    Body: { "reason": "Suspension lifted because..." }
    """
    serializer = ManagerUnsuspensionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    manager = get_object_or_404(Manager, user__user_id=user_id)

    if not manager.is_suspended:
        return Response(
            {'detail': 'Manager is not currently suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find active suspension
    active_suspension = ManagerSuspension.objects.filter(
        manager=manager,
        status='active'
    ).order_by('-suspended_at').first()

    if active_suspension:
        active_suspension.status = 'lifted'
        active_suspension.unsuspended_at = timezone.now()
        active_suspension.unsuspended_by = request.user
        active_suspension.unsuspension_reason = serializer.validated_data['reason']
        active_suspension.save()

    # Update manager status
    manager.is_suspended = False
    manager.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='unsuspend_manager',
        resource_type='manager',
        resource_id=user_id,
        reason=serializer.validated_data['reason'],
        target_user=manager.user,
        metadata={
            'suspension_id': active_suspension.suspension_id if active_suspension else None,
        }
    )

    return Response({
        'detail': 'Manager unsuspended successfully',
        'data': {
            'manager_id': manager.user_id,
        }
    }, status=status.HTTP_200_OK)


# ====== Manager Performance Analytics ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def manager_performance(request, user_id):
    """
    Get performance analytics for a specific manager
    GET /api/admin/managers/{user_id}/performance/
    """
    manager = get_object_or_404(Manager, user__user_id=user_id)

    # Get facilities managed
    facilities = Facility.objects.filter(manager=manager)
    total_facilities = facilities.count()
    active_facilities = facilities.filter(is_active=True, is_suspended=False).count()
    suspended_facilities = facilities.filter(is_suspended=True).count()

    # Get courts
    total_courts = Court.objects.filter(facility__manager=manager).count()

    # Get all bookings for this manager's facilities
    bookings = Booking.objects.filter(
        court__facility__manager=manager
    ).select_related('status')

    total_bookings = bookings.count()

    # Calculate revenue (using hourly_rate_snapshot from bookings)
    revenue_data = bookings.aggregate(
        total_revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') * Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        ),
        total_commission=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') * F('commission_rate_snapshot') * Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )

    total_revenue = revenue_data['total_revenue'] or Decimal('0.00')
    commission_collected = revenue_data['total_commission'] or Decimal('0.00')

    # This month's data
    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    bookings_this_month = bookings.filter(created_at__gte=month_start).count()

    month_revenue_data = bookings.filter(created_at__gte=month_start).aggregate(
        month_revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') * Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )
    revenue_this_month = month_revenue_data['month_revenue'] or Decimal('0.00')

    # Build response data
    performance_data = {
        'manager_id': manager.user_id,
        'manager_name': manager.user.name,
        'manager_email': manager.user.email,
        'total_facilities': total_facilities,
        'active_facilities': active_facilities,
        'suspended_facilities': suspended_facilities,
        'total_courts': total_courts,
        'total_bookings': total_bookings,
        'total_revenue': round(total_revenue, 2),
        'commission_collected': round(commission_collected, 2),
        'average_facility_rating': None,  # Placeholder for future rating system
        'bookings_this_month': bookings_this_month,
        'revenue_this_month': round(revenue_this_month, 2),
    }

    serializer = ManagerPerformanceSerializer(data=performance_data)
    if serializer.is_valid():
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)
    else:
        return Response(performance_data, status=status.HTTP_200_OK)
