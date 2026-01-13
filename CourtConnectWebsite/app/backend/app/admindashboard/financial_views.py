"""
Financial & Payment Management Views for Admin Dashboard
Handles payment statistics, refund requests, and financial reporting
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from app.auth.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, F, Q, FloatField, ExpressionWrapper
from django.db.models.functions import Extract, Cast
from django.http import HttpResponse
from datetime import timedelta, datetime
from decimal import Decimal
import csv

from app.bookings.models import Booking
from app.payments.models import Payment
from app.facilities.models import Facility
from .models import RefundRequest, AdminActionLog
from .serializers import RefundRequestSerializer, RefundActionSerializer


# ====== Payment Statistics Endpoint ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def payment_statistics(request):
    """
    Get payment and financial statistics
    GET /api/admin/payments/stats/?period=month&start_date=2025-01-01&end_date=2025-01-31
    """
    # Parse date filters
    period = request.query_params.get('period', 'month')  # day, week, month, year, all
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')

    # Default to current month
    now = timezone.now()
    if period == 'month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == 'week':
        start_date = now - timedelta(days=7)
        end_date = now
    elif period == 'day':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == 'year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:  # all
        start_date = None
        end_date = None

    # Override with custom dates if provided
    if start_date_str:
        # Clean up timezone format
        start_date_str = start_date_str.strip()
        # Handle malformed timezone formats
        if start_date_str.endswith('Z'):
            start_date_str = start_date_str[:-1] + '+00:00'
        elif 'T00:00' in start_date_str and '+' not in start_date_str:
            # Replace T00:00 with +00:00 (malformed timezone)
            start_date_str = start_date_str.replace('T00:00', '+00:00')
        elif ' 00:00' in start_date_str:
            # Replace space before timezone
            start_date_str = start_date_str.replace(' 00:00', '+00:00')
        # Replace remaining spaces with T for datetime part
        if ' ' in start_date_str and 'T' not in start_date_str:
            start_date_str = start_date_str.replace(' ', 'T', 1)
        start_date = datetime.fromisoformat(start_date_str)
    if end_date_str:
        # Clean up timezone format
        end_date_str = end_date_str.strip()
        # Handle malformed timezone formats
        if end_date_str.endswith('Z'):
            end_date_str = end_date_str[:-1] + '+00:00'
        elif 'T00:00' in end_date_str and '+' not in end_date_str:
            # Replace T00:00 with +00:00 (malformed timezone)
            end_date_str = end_date_str.replace('T00:00', '+00:00')
        elif ' 00:00' in end_date_str:
            # Replace space before timezone
            end_date_str = end_date_str.replace(' 00:00', '+00:00')
        # Replace remaining spaces with T for datetime part
        if ' ' in end_date_str and 'T' not in end_date_str:
            end_date_str = end_date_str.replace(' ', 'T', 1)
        end_date = datetime.fromisoformat(end_date_str)

    # Query bookings
    bookings = Booking.objects.select_related('status', 'court__facility')
    if start_date:
        bookings = bookings.filter(created_at__gte=start_date)
    if end_date:
        bookings = bookings.filter(created_at__lte=end_date)

    # Calculate revenue
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
    total_commission = Decimal(str(revenue_data['total_commission'] or 0))
    manager_payout = total_revenue - total_commission

    # Payment counts
    total_bookings = bookings.count()
    confirmed_bookings = bookings.filter(status__status_name='confirmed').count()
    cancelled_bookings = bookings.filter(status__status_name='cancelled').count()
    pending_bookings = bookings.filter(status__status_name='pending_payment').count()

    # Failed payments (assuming status or payment failure tracking)
    payments = Payment.objects.all()
    if start_date:
        payments = payments.filter(created_at__gte=start_date)
    if end_date:
        payments = payments.filter(created_at__lte=end_date)

    failed_payments = payments.filter(status__status_name='failed').count()
    successful_payments = payments.filter(status__status_name='completed').count()

    # Pending payouts (commission collected but not yet paid out to managers)
    pending_payout = total_commission  # Simplified - would need actual payout tracking

    # Refund statistics
    refunds = RefundRequest.objects.all()
    if start_date:
        refunds = refunds.filter(created_at__gte=start_date)
    if end_date:
        refunds = refunds.filter(created_at__lte=end_date)

    total_refunds = refunds.count()
    pending_refunds = refunds.filter(status='pending').count()
    approved_refunds = refunds.filter(status='approved').count()
    refund_amount = refunds.filter(status__in=['approved', 'processed']).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')

    # Average transaction value
    avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else Decimal('0.00')

    return Response({
        'data': {
            'period': period,
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat() if end_date else None,
            'revenue': {
                'total_revenue': round(total_revenue, 2),
                'total_commission': round(total_commission, 2),
                'manager_payout': round(manager_payout, 2),
                'average_booking_value': round(avg_booking_value, 2),
            },
            'bookings': {
                'total': total_bookings,
                'confirmed': confirmed_bookings,
                'cancelled': cancelled_bookings,
                'pending': pending_bookings,
            },
            'payments': {
                'successful': successful_payments,
                'failed': failed_payments,
                'success_rate': round((successful_payments / (successful_payments + failed_payments) * 100), 2) if (successful_payments + failed_payments) > 0 else 0,
            },
            'refunds': {
                'total_requests': total_refunds,
                'pending': pending_refunds,
                'approved': approved_refunds,
                'total_refund_amount': round(refund_amount, 2),
            },
            'payouts': {
                'pending_payout': round(pending_payout, 2),
            }
        }
    }, status=status.HTTP_200_OK)


# ====== Refund Request Management ======

class RefundPagination(PageNumberPagination):
    """Custom pagination for refund requests"""
    page_size = 20
    page_size_query_param = 'pageSize'
    max_page_size = 100


class RefundRequestListView(generics.ListAPIView):
    """
    List all refund requests with filtering
    GET /api/admin/payments/refunds/?status=pending&page=1
    """
    serializer_class = RefundRequestSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = RefundRequest.objects.select_related(
            'requested_by', 'reviewed_by', 'booking__court__facility'
        ).order_by('-created_at')

        # Status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'data': serializer.data})

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'meta': {
                'page': self.paginator.page.number,
                'pageSize': self.paginator.page.paginator.per_page,
                'total': self.paginator.page.paginator.count,
            }
        })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_refund(request, request_id):
    """
    Approve a refund request
    POST /api/admin/payments/refunds/{request_id}/approve/
    Body: { "reason": "Approved because..." }
    """
    serializer = RefundActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    refund_request = get_object_or_404(RefundRequest, request_id=request_id)

    if refund_request.status != 'pending':
        return Response(
            {'detail': f'Refund request is already {refund_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update refund request
    refund_request.status = 'approved'
    refund_request.reviewed_by = request.user
    refund_request.review_reason = serializer.validated_data['reason']
    refund_request.reviewed_at = timezone.now()
    refund_request.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='approve_refund',
        resource_type='refund_request',
        resource_id=request_id,
        reason=serializer.validated_data['reason'],
        financial_impact=-refund_request.amount,  # Negative because it's a refund
        target_user=refund_request.requested_by,
        metadata={
            'booking_id': refund_request.booking.booking_id,
            'amount': str(refund_request.amount),
        }
    )

    return Response({
        'detail': 'Refund request approved successfully',
        'data': {
            'request_id': refund_request.request_id,
            'amount': str(refund_request.amount),
            'status': refund_request.status,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_refund(request, request_id):
    """
    Reject a refund request
    POST /api/admin/payments/refunds/{request_id}/reject/
    Body: { "reason": "Rejected because..." }
    """
    serializer = RefundActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    refund_request = get_object_or_404(RefundRequest, request_id=request_id)

    if refund_request.status != 'pending':
        return Response(
            {'detail': f'Refund request is already {refund_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update refund request
    refund_request.status = 'rejected'
    refund_request.reviewed_by = request.user
    refund_request.review_reason = serializer.validated_data['reason']
    refund_request.reviewed_at = timezone.now()
    refund_request.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='reject_refund',
        resource_type='refund_request',
        resource_id=request_id,
        reason=serializer.validated_data['reason'],
        target_user=refund_request.requested_by,
        metadata={
            'booking_id': refund_request.booking.booking_id,
            'amount': str(refund_request.amount),
        }
    )

    return Response({
        'detail': 'Refund request rejected successfully',
        'data': {
            'request_id': refund_request.request_id,
            'status': refund_request.status,
        }
    }, status=status.HTTP_200_OK)


# ====== Commission Breakdown ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def commission_breakdown(request):
    """
    Get commission breakdown by facility
    GET /api/admin/payments/commission/?period=month
    """
    # Parse date filters
    period = request.query_params.get('period', 'month')
    now = timezone.now()

    if period == 'month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = None

    # Get bookings by facility
    bookings = Booking.objects.select_related('court__facility__manager__user')
    if start_date:
        bookings = bookings.filter(created_at__gte=start_date)

    # Get facilities that have bookings
    facility_ids = bookings.values_list('court__facility_id', flat=True).distinct()
    facilities = Facility.objects.filter(
        facility_id__in=facility_ids
    ).select_related('manager__user')

    commission_data = []
    for facility in facilities:
        facility_bookings = bookings.filter(court__facility=facility)

        revenue_data = facility_bookings.aggregate(
            revenue=Sum(
                ExpressionWrapper(
                    F('hourly_rate_snapshot') *
                    Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                    output_field=FloatField()
                )
            ),
            commission=Sum(
                ExpressionWrapper(
                    F('hourly_rate_snapshot') * F('commission_rate_snapshot') *
                    Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                    output_field=FloatField()
                )
            )
        )

        revenue = Decimal(str(revenue_data['revenue'] or 0))
        commission = Decimal(str(revenue_data['commission'] or 0))

        commission_data.append({
            'facility_id': facility.facility_id,
            'facility_name': facility.facility_name,
            'manager_name': facility.manager.user.name if facility.manager else 'N/A',
            'commission_rate': f"{float(facility.commission_rate) * 100}%",
            'total_revenue': round(revenue, 2),
            'commission_collected': round(commission, 2),
            'manager_payout': round(revenue - commission, 2),
            'booking_count': facility_bookings.count(),
        })

    # Sort by commission collected (descending)
    commission_data.sort(key=lambda x: x['commission_collected'], reverse=True)

    return Response({
        'data': commission_data,
        'meta': {
            'period': period,
            'total_facilities': len(commission_data),
            'total_commission': sum(item['commission_collected'] for item in commission_data),
        }
    }, status=status.HTTP_200_OK)



