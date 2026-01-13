"""
Dashboard Analytics & Oversight Views for Admin Dashboard
Handles platform analytics, user activity, and booking oversight
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from app.auth.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Avg, F, Q, FloatField, ExpressionWrapper, DurationField, Value
from django.db.models.functions import Extract, Cast
from django.http import HttpResponse
from datetime import timedelta
from decimal import Decimal
import csv

from app.users.models import User
from app.facilities.models import Facility
from app.bookings.models import Booking
from .models import Report, AdminActionLog, ManagerRequest, RefundRequest, ActivityLog


# ====== Phase 6: Admin Dashboard Overview ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_overview(request):
    """
    Get admin dashboard overview with key metrics
    GET /api/admin/dashboard/overview/
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # User Statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    suspended_users = User.objects.filter(is_active=False).count()
    unverified_users = User.objects.filter(verification_status='unverified').count()
    new_users_this_week = User.objects.filter(created_at__gte=week_start).count()

    # Manager Statistics
    from app.users.models import Manager
    total_managers = Manager.objects.count()
    active_managers = Manager.objects.filter(is_suspended=False, user__is_active=True).count()
    suspended_managers = Manager.objects.filter(is_suspended=True).count()

    # Facility Statistics
    total_facilities = Facility.objects.count()
    active_facilities = Facility.objects.filter(is_active=True, is_suspended=False, approval_status='approved').count()
    pending_facilities = Facility.objects.filter(approval_status='pending').count()
    suspended_facilities = Facility.objects.filter(is_suspended=True).count()

    # Booking Statistics
    total_bookings = Booking.objects.count()
    bookings_today = Booking.objects.filter(created_at__gte=today_start).count()
    bookings_this_week = Booking.objects.filter(created_at__gte=week_start).count()
    bookings_this_month = Booking.objects.filter(created_at__gte=month_start).count()

    # Revenue Statistics (this month)
    month_bookings = Booking.objects.filter(created_at__gte=month_start)
    revenue_data = month_bookings.aggregate(
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

    revenue_this_month = Decimal(str(revenue_data['revenue'] or 0))
    commission_this_month = Decimal(str(revenue_data['commission'] or 0))

    # Today's revenue
    today_bookings = Booking.objects.filter(created_at__gte=today_start)
    today_revenue_data = today_bookings.aggregate(
        revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )
    revenue_today = Decimal(str(today_revenue_data['revenue'] or 0))

    # Pending Actions
    pending_manager_requests = ManagerRequest.objects.filter(status='pending').count()
    pending_refunds = RefundRequest.objects.filter(status='pending').count()
    open_reports = Report.objects.filter(status='open').count()
    critical_reports = Report.objects.filter(status='open', severity='critical').count()

    # Recent Admin Activity
    recent_actions = AdminActionLog.objects.select_related('admin_user').order_by('-created_at')[:10]
    recent_activity = [{
        'action_id': action.action_id,
        'admin_email': action.admin_user.email,
        'action_name': action.action_name,
        'resource_type': action.resource_type,
        'resource_id': action.resource_id,
        'reason': action.reason[:100] + '...' if len(action.reason) > 100 else action.reason,
        'created_at': action.created_at.isoformat(),
    } for action in recent_actions]

    return Response({
        'data': {
            'users': {
                'total': total_users,
                'active': active_users,
                'suspended': suspended_users,
                'unverified': unverified_users,
                'new_this_week': new_users_this_week,
            },
            'managers': {
                'total': total_managers,
                'active': active_managers,
                'suspended': suspended_managers,
            },
            'facilities': {
                'total': total_facilities,
                'active': active_facilities,
                'pending_approval': pending_facilities,
                'suspended': suspended_facilities,
            },
            'bookings': {
                'total': total_bookings,
                'today': bookings_today,
                'this_week': bookings_this_week,
                'this_month': bookings_this_month,
            },
            'revenue': {
                'today': round(revenue_today, 2),
                'this_month': round(revenue_this_month, 2),
                'commission_this_month': round(commission_this_month, 2),
            },
            'pending_actions': {
                'manager_requests': pending_manager_requests,
                'facility_approvals': pending_facilities,
                'refund_requests': pending_refunds,
                'open_reports': open_reports,
                'critical_reports': critical_reports,
                'total_pending': pending_manager_requests + pending_facilities + pending_refunds + open_reports,
            },
            'recent_admin_activity': recent_activity,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def platform_health(request):
    """
    Get platform health metrics and growth trends
    GET /api/admin/analytics/platform-health/
    """
    now = timezone.now()

    # Calculate weekly growth for last 8 weeks
    weeks_data = []
    for i in range(8):
        week_start = now - timedelta(days=(i+1)*7)
        week_end = now - timedelta(days=i*7)

        week_users = User.objects.filter(created_at__gte=week_start, created_at__lt=week_end).count()
        week_bookings = Booking.objects.filter(created_at__gte=week_start, created_at__lt=week_end).count()
        week_revenue = Booking.objects.filter(created_at__gte=week_start, created_at__lt=week_end).aggregate(
            revenue=Sum(
                ExpressionWrapper(
                    F('hourly_rate_snapshot') *
                    Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                    output_field=FloatField()
                )
            )
        )['revenue'] or 0

        weeks_data.append({
            'week_start': week_start.date().isoformat(),
            'week_end': week_end.date().isoformat(),
            'new_users': week_users,
            'bookings': week_bookings,
            'revenue': round(Decimal(str(week_revenue)), 2),
        })

    weeks_data.reverse()  # Chronological order

    # User growth rate
    last_week_users = weeks_data[-1]['new_users']
    prev_week_users = weeks_data[-2]['new_users'] if len(weeks_data) > 1 else 1
    user_growth_rate = ((last_week_users - prev_week_users) / prev_week_users * 100) if prev_week_users > 0 else 0

    # Booking growth rate
    last_week_bookings = weeks_data[-1]['bookings']
    prev_week_bookings = weeks_data[-2]['bookings'] if len(weeks_data) > 1 else 1
    booking_growth_rate = ((last_week_bookings - prev_week_bookings) / prev_week_bookings * 100) if prev_week_bookings > 0 else 0

    # Revenue growth rate
    last_week_revenue = weeks_data[-1]['revenue']
    prev_week_revenue = weeks_data[-2]['revenue'] if len(weeks_data) > 1 else Decimal('1')
    revenue_growth_rate = ((last_week_revenue - prev_week_revenue) / prev_week_revenue * 100) if prev_week_revenue > 0 else 0

    return Response({
        'data': {
            'weekly_trends': weeks_data,
            'growth_rates': {
                'users': round(user_growth_rate, 2),
                'bookings': round(booking_growth_rate, 2),
                'revenue': round(float(revenue_growth_rate), 2),
            }
        }
    }, status=status.HTTP_200_OK)


# ====== Phase 7: Enhanced User Moderation ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_bookings(request, user_id):
    """
    Get user's booking history
    GET /api/admin/users/{user_id}/bookings/
    """
    user = get_object_or_404(User, user_id=user_id)

    bookings = Booking.objects.filter(user=user).select_related(
        'court__facility', 'status'
    ).order_by('-created_at')[:50]

    booking_data = [{
        'booking_id': b.booking_id,
        'facility_name': b.court.facility.facility_name,
        'court_name': b.court.name,
        'start_time': b.start_time.isoformat(),
        'end_time': b.end_time.isoformat(),
        'status': b.status.status_name if b.status else None,
        'created_at': b.created_at.isoformat(),
    } for b in bookings]

    return Response({
        'data': {
            'user_id': user.user_id,
            'user_email': user.email,
            'total_bookings': Booking.objects.filter(user=user).count(),
            'bookings': booking_data,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_activity(request, user_id):
    """
    Get user's activity log
    GET /api/admin/users/{user_id}/activity/
    """
    user = get_object_or_404(User, user_id=user_id)

    activities = ActivityLog.objects.filter(user=user).order_by('-created_at')[:100]

    activity_data = [{
        'activity_id': a.activity_id,
        'action': a.action,
        'resource_type': a.resource_type,
        'resource_id': a.resource_id,
        'metadata': a.metadata,
        'created_at': a.created_at.isoformat(),
    } for a in activities]

    return Response({
        'data': {
            'user_id': user.user_id,
            'user_email': user.email,
            'total_activities': ActivityLog.objects.filter(user=user).count(),
            'activities': activity_data,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def flagged_users(request):
    """
    Get list of flagged/suspicious users
    GET /api/admin/users/flagged/
    """
    # Define flagging criteria
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    flagged_users = []

    # Users with high cancellation rate
    users_with_bookings = User.objects.annotate(
        total_bookings=Count('booking'),
        cancelled_bookings=Count('booking', filter=Q(booking__status__status_name='cancelled'))
    ).filter(total_bookings__gte=5)

    for user in users_with_bookings:
        if user.total_bookings > 0:
            cancellation_rate = (user.cancelled_bookings / user.total_bookings) * 100
            if cancellation_rate > 50:  # More than 50% cancellation
                flagged_users.append({
                    'user_id': user.user_id,
                    'email': user.email,
                    'name': user.name,
                    'reason': 'High cancellation rate',
                    'details': f'{cancellation_rate:.1f}% cancellation rate',
                    'total_bookings': user.total_bookings,
                    'cancelled_bookings': user.cancelled_bookings,
                })

    # Users with multiple reports against them
    reported_users = User.objects.annotate(
        report_count=Count('admin_actions_received')
    ).filter(report_count__gte=3)

    for user in reported_users:
        flagged_users.append({
            'user_id': user.user_id,
            'email': user.email,
            'name': user.name,
            'reason': 'Multiple reports',
            'details': f'{user.report_count} reports filed',
            'report_count': user.report_count,
        })

    # Users who filed excessive reports (potential spam)
    excessive_reporters = User.objects.annotate(
        reports_filed=Count('reported_by')
    ).filter(reports_filed__gte=10)

    for user in excessive_reporters:
        flagged_users.append({
            'user_id': user.user_id,
            'email': user.email,
            'name': user.name,
            'reason': 'Excessive report filing',
            'details': f'{user.reports_filed} reports filed',
            'reports_filed': user.reports_filed,
        })

    return Response({
        'data': flagged_users,
        'meta': {
            'total_flagged': len(flagged_users),
        }
    }, status=status.HTTP_200_OK)


# ====== Phase 8: Booking Oversight ======

class BookingPagination(PageNumberPagination):
    """Custom pagination for bookings"""
    page_size = 50
    page_size_query_param = 'pageSize'
    max_page_size = 200


@api_view(['GET'])
@permission_classes([IsAdminUser])
def booking_overview(request):
    """
    Get all bookings with filtering
    GET /api/admin/bookings/?status=confirmed&facility_id=123&start_date=2025-01-01
    """
    queryset = Booking.objects.select_related(
        'user', 'court__facility', 'status'
    ).order_by('-created_at')

    # Filters
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status__status_name=status_filter)

    facility_id = request.query_params.get('facility_id')
    if facility_id:
        queryset = queryset.filter(court__facility__facility_id=facility_id)

    user_id = request.query_params.get('user_id')
    if user_id:
        queryset = queryset.filter(user__user_id=user_id)

    start_date = request.query_params.get('start_date')
    if start_date:
        queryset = queryset.filter(start_time__gte=start_date)

    end_date = request.query_params.get('end_date')
    if end_date:
        queryset = queryset.filter(end_time__lte=end_date)

    # Pagination
    paginator = BookingPagination()
    page = paginator.paginate_queryset(queryset, request)

    booking_data = [{
        'booking_id': b.booking_id,
        'user_email': b.user.email,
        'user_name': b.user.name,
        'facility_name': b.court.facility.facility_name,
        'court_name': b.court.name,
        'start_time': b.start_time.isoformat(),
        'end_time': b.end_time.isoformat(),
        'status': b.status.status_name if b.status else None,
        'hourly_rate': str(b.hourly_rate_snapshot),
        'created_at': b.created_at.isoformat(),
    } for b in page]

    return paginator.get_paginated_response(booking_data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def booking_statistics(request):
    """
    Get booking statistics
    GET /api/admin/bookings/stats/
    """
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_bookings = Booking.objects.count()

    # By status
    status_counts = Booking.objects.values('status__status_name').annotate(
        count=Count('booking_id')
    )
    status_data = {item['status__status_name']: item['count'] for item in status_counts if item['status__status_name']}

    # This month
    month_bookings = Booking.objects.filter(created_at__gte=month_start)
    month_count = month_bookings.count()

    # Revenue
    revenue_data = month_bookings.aggregate(
        revenue=Sum(
            ExpressionWrapper(
                F('hourly_rate_snapshot') *
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )
    month_revenue = Decimal(str(revenue_data['revenue'] or 0))

    # Average duration
    avg_duration = month_bookings.aggregate(
        avg=Avg(
            ExpressionWrapper(
                Cast(Extract(F('end_time') - F('start_time'), 'epoch'), FloatField()) / 3600.0,
                output_field=FloatField()
            )
        )
    )['avg'] or 0

    return Response({
        'data': {
            'total_bookings': total_bookings,
            'by_status': status_data,
            'this_month': {
                'count': month_count,
                'revenue': round(month_revenue, 2),
                'average_duration_hours': round(avg_duration, 2),
            }
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_action_logs(request):
    """
    Get admin action logs with filtering
    GET /api/admin/logs/all-actions/?admin_id=123&action=suspend_user&page=1
    """
    queryset = AdminActionLog.objects.select_related('admin_user', 'target_user').order_by('-created_at')

    # Filters
    admin_id = request.query_params.get('admin_id')
    if admin_id:
        queryset = queryset.filter(admin_user__user_id=admin_id)

    action_name = request.query_params.get('action')
    if action_name:
        queryset = queryset.filter(action_name=action_name)

    resource_type = request.query_params.get('resource_type')
    if resource_type:
        queryset = queryset.filter(resource_type=resource_type)

    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 50
    page = paginator.paginate_queryset(queryset, request)

    log_data = [{
        'action_id': log.action_id,
        'admin_email': log.admin_user.email,
        'action_name': log.action_name,
        'resource_type': log.resource_type,
        'resource_id': log.resource_id,
        'reason': log.reason,
        'financial_impact': str(log.financial_impact) if log.financial_impact else None,
        'target_user_email': log.target_user.email if log.target_user else None,
        'metadata': log.metadata,
        'created_at': log.created_at.isoformat(),
    } for log in page]

    return paginator.get_paginated_response(log_data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def unified_audit_log(request):
    """
    Get unified audit log (combines ActivityLog and AdminActionLog)
    GET /api/admin/audit-log/?q=search&action=login&adminId=123&targetUserId=456&page=1&pageSize=10

    This endpoint provides a unified view of all platform activities including:
    - User actions (login, bookings, profile changes, etc.)
    - Manager actions (facility/court CRUD operations)
    - Admin actions (user moderation, approvals, etc.)
    """
    from itertools import chain
    from operator import attrgetter

    # Get query parameters
    q = request.query_params.get('q', '').strip()
    action_filter = request.query_params.get('action', '').strip()
    admin_id = request.query_params.get('adminId', '').strip()
    target_user_id = request.query_params.get('targetUserId', '').strip()
    page_num = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('pageSize', 10))

    # Query ActivityLog
    activity_query = ActivityLog.objects.select_related('user').all()
    if action_filter:
        activity_query = activity_query.filter(action__icontains=action_filter)
    if admin_id:
        # For ActivityLog, admin_id is the user performing the action
        activity_query = activity_query.filter(user__user_id=admin_id)
    if q:
        # Search in action name and metadata
        activity_query = activity_query.filter(
            Q(action__icontains=q) |
            Q(resource_type__icontains=q)
        )

    # Query AdminActionLog
    admin_query = AdminActionLog.objects.select_related('admin_user', 'target_user').all()
    if action_filter:
        admin_query = admin_query.filter(action_name__icontains=action_filter)
    if admin_id:
        admin_query = admin_query.filter(admin_user__user_id=admin_id)
    if target_user_id:
        admin_query = admin_query.filter(target_user__user_id=target_user_id)
    if q:
        admin_query = admin_query.filter(
            Q(action_name__icontains=q) |
            Q(reason__icontains=q) |
            Q(resource_type__icontains=q)
        )

    # Convert to unified format
    unified_logs = []

    # Add ActivityLog entries
    for log in activity_query:
        unified_logs.append({
            'ts': log.created_at.isoformat(),
            'action': log.action,
            'admin_user_id': log.user.user_id if log.user else None,
            'admin_email': log.user.email if log.user else None,
            'target_user_id': log.metadata.get('target_user_id') if log.metadata else None,
            'resource_type': log.resource_type,
            'resource_id': log.resource_id,
            'reason': None,  # ActivityLog doesn't have reason field
            'metadata': log.metadata or {},
            'log_type': 'activity',
            'created_at_timestamp': log.created_at.timestamp(),  # For sorting
        })

    # Add AdminActionLog entries
    for log in admin_query:
        unified_logs.append({
            'ts': log.created_at.isoformat(),
            'action': log.action_name,
            'admin_user_id': log.admin_user.user_id if log.admin_user else None,
            'admin_email': log.admin_user.email if log.admin_user else None,
            'target_user_id': log.target_user.user_id if log.target_user else None,
            'resource_type': log.resource_type,
            'resource_id': log.resource_id,
            'reason': log.reason,
            'metadata': log.metadata or {},
            'log_type': 'admin_action',
            'created_at_timestamp': log.created_at.timestamp(),  # For sorting
        })

    # Sort by timestamp (newest first)
    unified_logs.sort(key=lambda x: x['created_at_timestamp'], reverse=True)

    # Remove the timestamp field used for sorting
    for log in unified_logs:
        del log['created_at_timestamp']

    # Pagination
    total = len(unified_logs)
    start = (page_num - 1) * page_size
    end = start + page_size
    paginated_logs = unified_logs[start:end]

    return Response({
        'data': paginated_logs,
        'meta': {
            'page': page_num,
            'pageSize': page_size,
            'total': total,
        }
    }, status=status.HTTP_200_OK)


# ====== System Reports & CSV Export ======

@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_reports(request):
    """
    Get system health metrics and time series data
    GET /api/admin/reports/?range=7d|30d

    Returns platform health KPIs and activity trends for the specified time range
    """
    range_param = request.query_params.get('range', '7d')

    # Parse range to days
    if range_param == '7d':
        days = 7
    elif range_param == '30d':
        days = 30
    else:
        days = 7

    now = timezone.now()
    start_date = now - timedelta(days=days)

    # Generate date series
    from datetime import date
    dates = []
    current_date = start_date.date()
    end_date = now.date()
    while current_date <= end_date:
        dates.append(current_date.isoformat())
        current_date += timedelta(days=1)

    # Calculate KPI cards
    open_reports = Report.objects.filter(status__in=['open', 'in_review']).count()

    # Simple health check (always OK for now - can be enhanced with actual health checks)
    health_ok = 1

    # Average latency (mock value - would need actual metrics tracking)
    avg_latency_ms = 120

    # Error rate (mock value - would need actual error tracking)
    error_rate = 0.5

    # Build time series data
    active_users_series = []
    new_reports_series = []
    errors_series = []

    for day_date in dates:
        day_start = timezone.datetime.strptime(day_date, '%Y-%m-%d').replace(tzinfo=timezone.get_current_timezone())
        day_end = day_start + timedelta(days=1)

        # Count active users (users with activity on that day)
        active_count = ActivityLog.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end,
            user__isnull=False
        ).values('user').distinct().count()
        active_users_series.append(active_count)

        # Count new reports
        reports_count = Report.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        ).count()
        new_reports_series.append(reports_count)

        # Errors (mock data for now - would need actual error tracking)
        errors_series.append(0)

    return Response({
        'data': {
            'cards': {
                'healthOk': health_ok,
                'avgLatencyMs': avg_latency_ms,
                'errorRate': error_rate,
                'openModeration': open_reports
            },
            'series': {
                'dates': dates,
                'activeUsers': active_users_series,
                'newReports': new_reports_series,
                'errors': errors_series
            }
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_activity_report_csv(request):
    """
    Export activity logs as CSV file
    GET /api/admin/reports/export/activity/?days=30

    Downloads a CSV file containing all user activities for the specified time period
    """
    # Get time period (default 30 days)
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)

    # Query activity logs
    activities = ActivityLog.objects.filter(
        created_at__gte=start_date
    ).select_related('user').order_by('-created_at')

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="activity_report_{timezone.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'User ID', 'User Email', 'User Name', 'Action', 'Resource Type', 'Resource ID', 'Metadata'])

    for activity in activities:
        writer.writerow([
            activity.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            activity.user.user_id if activity.user else 'N/A',
            activity.user.email if activity.user else 'N/A',
            activity.user.name if activity.user else 'N/A',
            activity.action,
            activity.resource_type or 'N/A',
            activity.resource_id or 'N/A',
            str(activity.metadata) if activity.metadata else '',
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_admin_actions_csv(request):
    """
    Export admin actions as CSV file
    GET /api/admin/reports/export/admin-actions/?days=30

    Downloads a CSV file containing all admin actions for the specified time period
    """
    # Get time period (default 30 days)
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)

    # Query admin action logs
    actions = AdminActionLog.objects.filter(
        created_at__gte=start_date
    ).select_related('admin_user', 'target_user').order_by('-created_at')

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="admin_actions_report_{timezone.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'Admin Email', 'Action Name', 'Resource Type', 'Resource ID', 'Target User', 'Reason', 'Financial Impact', 'Metadata'])

    for action in actions:
        writer.writerow([
            action.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            action.admin_user.email if action.admin_user else 'N/A',
            action.action_name,
            action.resource_type,
            action.resource_id,
            action.target_user.email if action.target_user else 'N/A',
            action.reason[:200] if action.reason else '',  # Truncate long reasons
            str(action.financial_impact) if action.financial_impact else 'N/A',
            str(action.metadata) if action.metadata else '',
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_user_statistics_csv(request):
    """
    Export user statistics as CSV file
    GET /api/admin/reports/export/users/

    Downloads a CSV file containing all users with their statistics
    """
    # Get all users with annotations
    users = User.objects.annotate(
        total_bookings=Count('booking'),
        cancelled_bookings=Count('booking', filter=Q(booking__status__status_name='cancelled'))
    ).order_by('-created_at')

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="user_statistics_{timezone.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['User ID', 'Name', 'Email', 'Phone', 'Verification Status', 'Is Active', 'Is Admin', 'MFA Enabled', 'Total Bookings', 'Cancelled Bookings', 'Created At'])

    for user in users:
        writer.writerow([
            user.user_id,
            user.name,
            user.email,
            user.phone_number or 'N/A',
            user.verification_status,
            'Yes' if user.is_active else 'No',
            'Yes' if user.is_admin else 'No',
            'Yes' if user.mfa_enabled else 'No',
            user.total_bookings,
            user.cancelled_bookings,
            user.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_booking_statistics_csv(request):
    """
    Export booking statistics as CSV file
    GET /api/admin/reports/export/bookings/?days=30

    Downloads a CSV file containing all bookings for the specified time period
    """
    # Get time period (default 30 days)
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)

    # Query bookings
    bookings = Booking.objects.filter(
        created_at__gte=start_date
    ).select_related('user', 'court__facility', 'status').order_by('-created_at')

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="booking_statistics_{timezone.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Booking ID', 'User Email', 'Facility Name', 'Court Name', 'Start Time', 'End Time', 'Hourly Rate', 'Commission Rate', 'Status', 'Created At'])

    for booking in bookings:
        writer.writerow([
            booking.booking_id,
            booking.user.email,
            booking.court.facility.facility_name,
            booking.court.name,
            booking.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            booking.end_time.strftime('%Y-%m-%d %H:%M:%S'),
            str(booking.hourly_rate_snapshot),
            str(booking.commission_rate_snapshot),
            booking.status.status_name if booking.status else 'N/A',
            booking.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])

    return response
