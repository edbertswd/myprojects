from django.urls import path
from . import views
from . import manager_views
from . import facility_views
from . import financial_views
from . import report_views
from . import analytics_views

app_name = 'admindashboard'

urlpatterns = [
    # ====== Admin Re-authentication ======
    path('reauth', views.admin_reauth, name='admin-reauth'),
    path('reauth/verify', views.admin_reauth_verify, name='admin-reauth-verify'),

    # ====== Dashboard Overview ======
    path('dashboard/overview/', analytics_views.dashboard_overview, name='dashboard-overview'),
    path('analytics/platform-health/', analytics_views.platform_health, name='platform-health'),
    path('logs/all-actions/', analytics_views.admin_action_logs, name='admin-logs'),
    path('audit-log/', analytics_views.unified_audit_log, name='unified-audit-log'),

    # ====== Facility Moderation ======
    path('facilities/all/', views.AllFacilitiesListView.as_view(), name='all-facilities'),
    path('facilities/pending/', views.PendingFacilitiesListView.as_view(), name='pending-facilities'),
    path('facilities/<int:facility_id>/approve/', views.approve_facility, name='approve-facility'),
    path('facilities/<int:facility_id>/reject/', views.reject_facility, name='reject-facility'),
    path('facilities/<int:facility_id>/activate/', views.activate_facility, name='activate-facility'),
    path('facilities/<int:facility_id>/deactivate/', views.deactivate_facility, name='deactivate-facility'),
    path('facilities/<int:facility_id>/suspend/', facility_views.suspend_facility, name='suspend-facility'),
    path('facilities/<int:facility_id>/unsuspend/', facility_views.unsuspend_facility, name='unsuspend-facility'),
    path('facilities/<int:facility_id>/analytics/', facility_views.facility_analytics, name='facility-analytics'),
    path('facilities/<int:facility_id>/commission/', facility_views.adjust_commission_rate, name='adjust-commission'),

    # ====== Manager Moderation ======
    path('managers/', manager_views.ManagerListView.as_view(), name='managers-list'),
    path('managers/<int:user_id>/', manager_views.ManagerDetailView.as_view(), name='manager-detail'),
    path('managers/applications/', manager_views.ManagerApplicationListView.as_view(), name='manager-applications'),
    path('managers/applications/<int:request_id>/approve/', manager_views.approve_manager_application, name='approve-manager-application'),
    path('managers/applications/<int:request_id>/reject/', manager_views.reject_manager_application, name='reject-manager-application'),
    path('managers/<int:user_id>/suspend/', manager_views.suspend_manager, name='suspend-manager'),
    path('managers/<int:user_id>/unsuspend/', manager_views.unsuspend_manager, name='unsuspend-manager'),
    path('managers/<int:user_id>/performance/', manager_views.manager_performance, name='manager-performance'),

    # ====== User Moderation ======
    path('users/', views.UserListView.as_view(), name='users-list'),
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/suspend/', views.suspend_user, name='user-suspend'),
    path('users/<int:user_id>/unsuspend/', views.unsuspend_user, name='user-unsuspend'),
    path('users/<int:user_id>/bookings/', analytics_views.user_bookings, name='user-bookings'),
    path('users/<int:user_id>/activity/', analytics_views.user_activity, name='user-activity'),
    path('users/flagged/', analytics_views.flagged_users, name='flagged-users'),

    # ====== Booking Oversight ======
    path('bookings/', analytics_views.booking_overview, name='booking-overview'),
    path('bookings/stats/', analytics_views.booking_statistics, name='booking-stats'),

    # ====== Payment & Financial Management ======
    path('payments/stats/', financial_views.payment_statistics, name='payment-stats'),
    path('payments/refunds/', financial_views.RefundRequestListView.as_view(), name='refund-list'),
    path('payments/refunds/<int:request_id>/approve/', financial_views.approve_refund, name='approve-refund'),
    path('payments/refunds/<int:request_id>/reject/', financial_views.reject_refund, name='reject-refund'),
    path('payments/commission/', financial_views.commission_breakdown, name='commission-breakdown'),

    # ====== Report & Content Moderation ======
    # More specific report paths must come before general 'reports/' path
    # path('reports/financial/export/', financial_views.export_financial_report, name='export-financial'),  # Removed - not needed
    path('reports/trends/', report_views.report_trends, name='report-trends'),
    path('reports/<int:report_id>/assign/', report_views.assign_report, name='assign-report'),
    path('reports/<int:report_id>/resolve/', report_views.resolve_report, name='resolve-report'),
    path('reports/<int:report_id>/dismiss/', report_views.dismiss_report, name='dismiss-report'),
    path('reports/<int:report_id>/', report_views.ReportDetailView.as_view(), name='report-detail'),
    path('reports/', report_views.ReportListView.as_view(), name='reports-list'),

    # ====== System Reports & CSV Export ======
    path('analytics/system-health/', analytics_views.system_reports, name='system-health'),
    path('reports/export/activity/', analytics_views.export_activity_report_csv, name='export-activity-csv'),
    path('reports/export/admin-actions/', analytics_views.export_admin_actions_csv, name='export-admin-actions-csv'),
    path('reports/export/users/', analytics_views.export_user_statistics_csv, name='export-users-csv'),
    path('reports/export/bookings/', analytics_views.export_booking_statistics_csv, name='export-bookings-csv'),
]