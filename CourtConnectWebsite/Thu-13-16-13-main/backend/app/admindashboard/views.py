from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from app.auth.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg, F
from django.contrib.auth import authenticate
from datetime import timedelta
from decimal import Decimal
import secrets

from app.facilities.models import Facility, Court
from app.facilities.serializers import FacilityListSerializer, FacilityDetailSerializer
from app.users.models import User, Manager
from app.bookings.models import Booking
from .serializers import (
    UserListSerializer, UserDetailSerializer,
    ManagerListSerializer, ManagerDetailSerializer, ManagerRequestSerializer,
    ManagerRequestActionSerializer, ManagerSuspensionSerializer, ManagerUnsuspensionSerializer,
    ManagerPerformanceSerializer, FacilityApprovalActionSerializer, FacilitySuspensionSerializer, FacilityUnsuspensionSerializer,
    CommissionAdjustmentSerializer, FacilityAnalyticsSerializer,
    RefundRequestSerializer, RefundActionSerializer, ReportSerializer, ReportActionSerializer
)
from .models import (
    AdminActionLog, ManagerRequest, ManagerSuspension, FacilitySuspension,
    RefundRequest, CommissionAdjustment, Report
)


# ====== Admin Re-authentication Endpoint ======

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reauth(request):
    """
    Re-authenticate admin user for sensitive actions
    POST /api/admin/reauth
    Body: { "method": "password" | "otp", "credential": "..." }

    Returns: { "data": { "token": "...", "method": "...", "expiresAt": timestamp } }
    """
    # Check if user is admin
    if not (request.user.is_admin or request.user.is_superuser):
        return Response(
            {'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}},
            status=status.HTTP_403_FORBIDDEN
        )

    method = request.data.get('method', 'password')
    credential = request.data.get('credential', '')

    # Verify credential based on method
    if method == 'password':
        # Password method requires credential
        if not credential:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Credential is required'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate using Django's authenticate function
        user = authenticate(request, email=request.user.email, password=credential)
        if user is None:
            return Response(
                {'error': {'code': 'UNAUTHORIZED', 'message': 'Invalid password'}},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Password verified successfully - return token
        reauth_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(minutes=5)
        expires_at_ms = int(expires_at.timestamp() * 1000)

        return Response({
            'data': {
                'token': reauth_token,
                'method': method,
                'expiresAt': expires_at_ms
            }
        }, status=status.HTTP_200_OK)

    elif method == 'otp':
        # For OTP method, credential should be empty (we're requesting OTP to be sent)
        # Import OTPService here to avoid circular imports
        from app.auth.services import OTPService

        # Generate and send OTP
        otp_code = OTPService.generate_otp(request.user, purpose='admin_reauth')
        email_sent = OTPService.send_otp_email(request.user, otp_code)

        if not email_sent:
            return Response(
                {'error': {'code': 'EMAIL_ERROR', 'message': 'Failed to send OTP email'}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Return success - frontend should then prompt for OTP code
        return Response({
            'data': {
                'method': 'otp',
                'message': 'OTP code sent to your email',
                'email': request.user.email,
                'requiresVerification': True  # Frontend knows to show OTP input
            }
        }, status=status.HTTP_200_OK)

    else:
        return Response(
            {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid method. Use "password" or "otp"'}},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reauth_verify(request):
    """
    Verify OTP code for admin re-authentication
    POST /api/admin/reauth/verify
    Body: { "code": "123456" }

    Returns: { "data": { "token": "...", "method": "otp", "expiresAt": timestamp } }
    """
    # Check if user is admin
    if not (request.user.is_admin or request.user.is_superuser):
        return Response(
            {'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}},
            status=status.HTTP_403_FORBIDDEN
        )

    code = request.data.get('code', '').strip()

    if not code:
        return Response(
            {'error': {'code': 'VALIDATION_ERROR', 'message': 'OTP code is required'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(code) != 6 or not code.isdigit():
        return Response(
            {'error': {'code': 'VALIDATION_ERROR', 'message': 'OTP code must be 6 digits'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify OTP
    from app.auth.services import OTPService

    is_valid = OTPService.verify_otp(request.user, code, purpose='admin_reauth')

    if not is_valid:
        return Response(
            {'error': {'code': 'INVALID_OTP', 'message': 'Invalid or expired OTP code'}},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # OTP verified successfully - generate reauth token
    reauth_token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(minutes=5)
    expires_at_ms = int(expires_at.timestamp() * 1000)

    return Response({
        'data': {
            'token': reauth_token,
            'method': 'otp',
            'expiresAt': expires_at_ms
        }
    }, status=status.HTTP_200_OK)


class PendingFacilitiesListView(generics.ListAPIView):
    """
    List all pending facility applications
    GET /admin/facilities/pending/
    """
    serializer_class = FacilityDetailSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Facility.objects.filter(approval_status='pending').select_related(
            'manager__user', 'submitted_by'
        ).order_by('-created_at')


class AllFacilitiesListView(generics.ListAPIView):
    """
    List all facilities with optional status filter
    GET /admin/facilities/all/
    Query params:
    - approval_status: pending/approved/rejected (optional, empty = all)
    - is_active: true/false (optional, empty = all)
    """
    serializer_class = FacilityDetailSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Facility.objects.select_related(
            'manager__user', 'submitted_by', 'approved_by'
        ).order_by('-created_at')

        # Filter by approval status
        approval_status = self.request.query_params.get('approval_status', None)
        if approval_status:
            queryset = queryset.filter(approval_status=approval_status)

        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None and is_active != '':
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_facility(request, facility_id):
    """
    Approve a pending facility
    POST /admin/facilities/{facility_id}/approve/
    Body: { "reason": "Approved due to..." }
    """
    serializer = FacilityApprovalActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if facility.approval_status == 'approved':
        return Response(
            {'detail': 'Facility is already approved'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Link facility to the submitter's manager account
    if facility.submitted_by and hasattr(facility.submitted_by, 'manager'):
        facility.manager = facility.submitted_by.manager
    elif not facility.manager:
        # If submitted_by doesn't have a manager profile, return error
        return Response(
            {'detail': 'Cannot approve: Submitter does not have a manager account'},
            status=status.HTTP_400_BAD_REQUEST
        )

    facility.approval_status = 'approved'
    facility.approved_by = request.user
    facility.approved_at = timezone.now()
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='approve_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'facility_id': facility_id,
            'facility_name': facility.facility_name,
            'address': facility.address,
        }
    )

    facility_serializer = FacilityDetailSerializer(facility)
    return Response({
        'detail': 'Facility approved successfully',
        'facility': facility_serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_facility(request, facility_id):
    """
    Reject a pending facility
    POST /admin/facilities/{facility_id}/reject/
    Body: { "reason": "Rejected because..." }
    """
    serializer = FacilityApprovalActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if facility.approval_status == 'approved':
        return Response(
            {'detail': 'Cannot reject an approved facility'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Determine target user before rejection
    target_user = None
    if facility.manager:
        target_user = facility.manager.user
    elif facility.submitted_by:
        target_user = facility.submitted_by

    facility.approval_status = 'rejected'
    facility.approved_by = request.user
    facility.approved_at = timezone.now()
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='reject_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=target_user,
        metadata={
            'facility_id': facility_id,
            'facility_name': facility.facility_name,
            'address': facility.address,
        }
    )

    facility_serializer = FacilityDetailSerializer(facility)
    return Response({
        'detail': 'Facility rejected successfully',
        'facility': facility_serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def activate_facility(request, facility_id):
    """
    Activate a facility (set is_active=True)
    POST /admin/facilities/{facility_id}/activate/
    Body: { "reason": "Activating because..." }
    """
    serializer = FacilityApprovalActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if facility.is_active:
        return Response(
            {'detail': 'Facility is already active'},
            status=status.HTTP_400_BAD_REQUEST
        )

    facility.is_active = True
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='activate_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'facility_id': facility_id,
            'facility_name': facility.facility_name,
            'address': facility.address,
        }
    )

    facility_serializer = FacilityDetailSerializer(facility)
    return Response({
        'detail': 'Facility activated successfully',
        'facility': facility_serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def deactivate_facility(request, facility_id):
    """
    Deactivate a facility (set is_active=False)
    POST /admin/facilities/{facility_id}/deactivate/
    Body: { "reason": "Deactivating because..." }
    """
    serializer = FacilityApprovalActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    facility = get_object_or_404(Facility, facility_id=facility_id)

    if not facility.is_active:
        return Response(
            {'detail': 'Facility is already inactive'},
            status=status.HTTP_400_BAD_REQUEST
        )

    facility.is_active = False
    facility.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='deactivate_facility',
        resource_type='facility',
        resource_id=facility_id,
        reason=serializer.validated_data['reason'],
        target_user=facility.manager.user if facility.manager else None,
        metadata={
            'facility_id': facility_id,
            'facility_name': facility.facility_name,
            'address': facility.address,
        }
    )

    facility_serializer = FacilityDetailSerializer(facility)
    return Response({
        'detail': 'Facility deactivated successfully',
        'facility': facility_serializer.data
    })


# ====== User Moderation Endpoints ======

class UserPagination(PageNumberPagination):
    """Custom pagination for user list"""
    page_size = 10
    page_size_query_param = 'pageSize'
    max_page_size = 100


class UserListView(generics.ListAPIView):
    """
    List users for moderation with filtering and pagination
    GET /admin/users?q=search&role=admin&status=active&page=1&pageSize=10
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.select_related('manager').order_by('-created_at')

        # Search filter
        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) | Q(email__icontains=q)
            )

        # Role filter
        role = self.request.query_params.get('role', '').strip()
        if role == 'admin':
            queryset = queryset.filter(Q(is_admin=True) | Q(is_superuser=True))
        elif role == 'manager':
            queryset = queryset.filter(manager__isnull=False)
        elif role == 'user':
            queryset = queryset.filter(
                is_admin=False,
                is_superuser=False,
                manager__isnull=True
            )

        # Status filter
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'suspended':
            queryset = queryset.filter(is_active=False)

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
        """Custom pagination response format to match frontend expectations"""
        return Response({
            'data': data,
            'meta': {
                'page': self.paginator.page.number,
                'pageSize': self.paginator.page.paginator.per_page,
                'total': self.paginator.page.paginator.count,
            }
        })


class UserDetailView(generics.RetrieveAPIView):
    """
    Get detailed user information
    GET /admin/users/{user_id}
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.select_related('manager')
    lookup_field = 'user_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'data': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_user(request, user_id):
    """
    Suspend a user (set is_active=False)
    POST /admin/users/{user_id}/suspend
    Body: { "reason": "Violation of terms", "duration_days": 7 }
    """
    user = get_object_or_404(User, user_id=user_id)

    if not user.is_active:
        return Response(
            {'detail': 'User is already suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent suspending admins
    if user.is_admin or user.is_superuser:
        return Response(
            {'detail': 'Cannot suspend admin users'},
            status=status.HTTP_403_FORBIDDEN
        )

    reason = request.data.get('reason', 'No reason provided')
    duration_days = request.data.get('duration_days')

    # Suspend the user
    user.is_active = False
    user.save()

    # Log the action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='suspend_user',
        resource_type='user',
        resource_id=user_id,
        reason=reason,
        target_user=user,
        metadata={
            'duration_days': duration_days,
        }
    )

    serializer = UserDetailSerializer(user)
    return Response({
        'data': {
            'ok': True,
            'user': serializer.data
        },
        'detail': 'User suspended successfully'
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def unsuspend_user(request, user_id):
    """
    Unsuspend a user (set is_active=True)
    POST /admin/users/{user_id}/unsuspend
    """
    user = get_object_or_404(User, user_id=user_id)

    if user.is_active:
        return Response(
            {'detail': 'User is not suspended'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Unsuspend the user
    user.is_active = True
    user.save()

    # Log the action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='unsuspend_user',
        resource_type='user',
        resource_id=user_id,
        reason='User unsuspended by admin',
        target_user=user
    )

    serializer = UserDetailSerializer(user)
    return Response({
        'data': {
            'ok': True,
            'user': serializer.data
        },
        'detail': 'User unsuspended successfully'
    })