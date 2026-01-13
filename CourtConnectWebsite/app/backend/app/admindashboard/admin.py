from django.contrib import admin
from .models import (
    Report, ActivityLog, AdminActionLog,
    ManagerRequest, ManagerRequestSportType,
    FacilityRequest, FacilityRequestSportType
)

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_id', 'reporter_user', 'resource_type', 'resource_id', 'status', 'created_at']
    list_filter = ['status', 'resource_type', 'created_at']
    search_fields = ['reporter_user__email', 'reason']

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['activity_id', 'user', 'action', 'resource_type', 'created_at']
    list_filter = ['action', 'resource_type', 'created_at']
    search_fields = ['user__email', 'action']

@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ['action_id', 'admin_user', 'action_name', 'resource_type', 'created_at']
    list_filter = ['action_name', 'resource_type', 'created_at']
    search_fields = ['admin_user__email', 'action_name']

@admin.register(ManagerRequest)
class ManagerRequestAdmin(admin.ModelAdmin):
    list_display = ['request_id', 'user', 'facility_name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'facility_name', 'facility_address']

@admin.register(FacilityRequest)
class FacilityRequestAdmin(admin.ModelAdmin):
    list_display = ['request_id', 'submitted_by', 'facility_name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['submitted_by__email', 'facility_name', 'facility_address']

admin.site.register(ManagerRequestSportType)
admin.site.register(FacilityRequestSportType)