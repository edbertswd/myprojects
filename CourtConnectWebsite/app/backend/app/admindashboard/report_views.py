"""
Report & Content Moderation Views for Admin Dashboard
Handles user-submitted reports and content moderation
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from app.auth.permissions import IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from .models import Report, AdminActionLog
from .serializers import ReportSerializer, ReportActionSerializer


class ReportPagination(PageNumberPagination):
    """Custom pagination for reports"""
    page_size = 20
    page_size_query_param = 'pageSize'
    max_page_size = 100


class ReportListView(generics.ListAPIView):
    """
    List all reports with filtering
    GET /api/admin/reports/?status=open&severity=high&category=fraud
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Report.objects.select_related(
            'reporter_user', 'assigned_to', 'resolved_by'
        ).order_by('-created_at')

        # Status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Severity filter
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        # Category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Resource type filter
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)

        # Assigned to me filter
        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            queryset = queryset.filter(assigned_to=self.request.user)

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


class ReportDetailView(generics.RetrieveAPIView):
    """
    Get detailed report information
    GET /api/admin/reports/{report_id}/
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAdminUser]
    queryset = Report.objects.select_related('reporter_user', 'assigned_to', 'resolved_by')
    lookup_field = 'report_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'data': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def assign_report(request, report_id):
    """
    Assign a report to an admin user
    POST /api/admin/reports/{report_id}/assign/
    Body: { "admin_user_id": 123 }
    """
    report = get_object_or_404(Report, report_id=report_id)

    admin_user_id = request.data.get('admin_user_id')
    if not admin_user_id:
        return Response(
            {'detail': 'admin_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from app.users.models import User
    admin_user = get_object_or_404(User, Q(user_id=admin_user_id) & (Q(is_admin=True) | Q(is_superuser=True)))

    report.assigned_to = admin_user
    report.status = 'in_review'
    report.save()

    return Response({
        'detail': 'Report assigned successfully',
        'data': {
            'report_id': report.report_id,
            'assigned_to': admin_user.email,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_report(request, report_id):
    """
    Resolve a report
    POST /api/admin/reports/{report_id}/resolve/
    Body: { "resolution_note": "Took action...", "action_taken": "user_suspended" }
    """
    serializer = ReportActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    report = get_object_or_404(Report, report_id=report_id)

    if report.status == 'resolved':
        return Response(
            {'detail': 'Report is already resolved'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update report
    report.status = 'resolved'
    report.resolved_by = request.user
    report.resolved_at = timezone.now()
    report.resolution_note = serializer.validated_data['resolution_note']
    report.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='resolve_report',
        resource_type='report',
        resource_id=report_id,
        reason=serializer.validated_data['resolution_note'],
        metadata={
            'report_resource_type': report.resource_type,
            'report_resource_id': report.resource_id,
            'action_taken': serializer.validated_data.get('action_taken', 'none'),
            'severity': report.severity,
            'category': report.category,
        }
    )

    return Response({
        'detail': 'Report resolved successfully',
        'data': {
            'report_id': report.report_id,
            'status': report.status,
            'resolved_at': report.resolved_at.isoformat(),
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def dismiss_report(request, report_id):
    """
    Dismiss a report
    POST /api/admin/reports/{report_id}/dismiss/
    Body: { "resolution_note": "Dismissed because..." }
    """
    serializer = ReportActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    report = get_object_or_404(Report, report_id=report_id)

    if report.status in ['resolved', 'dismissed']:
        return Response(
            {'detail': f'Report is already {report.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update report
    report.status = 'dismissed'
    report.resolved_by = request.user
    report.resolved_at = timezone.now()
    report.resolution_note = serializer.validated_data['resolution_note']
    report.save()

    # Log admin action
    AdminActionLog.objects.create(
        admin_user=request.user,
        action_name='dismiss_report',
        resource_type='report',
        resource_id=report_id,
        reason=serializer.validated_data['resolution_note'],
        metadata={
            'report_resource_type': report.resource_type,
            'report_resource_id': report.resource_id,
            'severity': report.severity,
            'category': report.category,
        }
    )

    return Response({
        'detail': 'Report dismissed successfully',
        'data': {
            'report_id': report.report_id,
            'status': report.status,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def report_trends(request):
    """
    Get report trends and analytics
    GET /api/admin/reports/trends/
    """
    # Total counts by status
    status_counts = Report.objects.values('status').annotate(count=Count('report_id'))
    status_data = {item['status']: item['count'] for item in status_counts}

    # Counts by severity
    severity_counts = Report.objects.values('severity').annotate(count=Count('report_id'))
    severity_data = {item['severity']: item['count'] for item in severity_counts}

    # Counts by category
    category_counts = Report.objects.values('category').annotate(count=Count('report_id'))
    category_data = {item['category']: item['count'] for item in category_counts}

    # Most reported resource types
    resource_counts = Report.objects.values('resource_type').annotate(count=Count('report_id')).order_by('-count')[:5]

    # Top reporters (users with most reports filed)
    top_reporters = Report.objects.values(
        'reporter_user__user_id',
        'reporter_user__name',
        'reporter_user__email'
    ).annotate(count=Count('report_id')).order_by('-count')[:10]

    # Recent critical reports
    critical_reports = Report.objects.filter(
        severity='critical',
        status='open'
    ).select_related('reporter_user').order_by('-created_at')[:5]

    critical_data = [{
        'report_id': r.report_id,
        'resource_type': r.resource_type,
        'resource_id': r.resource_id,
        'category': r.category,
        'created_at': r.created_at.isoformat(),
        'reporter': r.reporter_user.email,
    } for r in critical_reports]

    return Response({
        'data': {
            'by_status': status_data,
            'by_severity': severity_data,
            'by_category': category_data,
            'most_reported_resources': list(resource_counts),
            'top_reporters': list(top_reporters),
            'critical_open_reports': critical_data,
        }
    }, status=status.HTTP_200_OK)
