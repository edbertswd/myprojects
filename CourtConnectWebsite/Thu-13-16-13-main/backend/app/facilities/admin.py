from django.contrib import admin
from django import forms
from .models import SportType, Facility, FacilitySportType, Court, Availability


class FacilityAdminForm(forms.ModelForm):
    """Custom form for Facility admin with enhanced widgets"""

    class Meta:
        model = Facility
        fields = '__all__'
        widgets = {
            'address': forms.TextInput(attrs={
                'size': '80',
                'placeholder': 'Start typing Australian address...',
                'autocomplete': 'off'
            }),
            'timezone': forms.Select(choices=Facility.TIMEZONE_CHOICES),
            'latitude': forms.NumberInput(attrs={
                'readonly': 'readonly',
                'placeholder': 'Auto-filled from address'
            }),
            'longitude': forms.NumberInput(attrs={
                'readonly': 'readonly',
                'placeholder': 'Auto-filled from address'
            }),
        }
        help_texts = {
            'address': 'Enter address (will autocomplete)',
            'timezone': 'Select the timezone for this facility',
            'latitude': 'Auto-filled when address is selected',
            'longitude': 'Auto-filled when address is selected',
        }


@admin.register(SportType)
class SportTypeAdmin(admin.ModelAdmin):
    list_display = ['sport_name', 'created_at']
    search_fields = ['sport_name']


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    form = FacilityAdminForm
    list_display = ['facility_name', 'manager', 'timezone', 'approval_status', 'is_active', 'created_at']
    list_filter = ['approval_status', 'is_active', 'timezone', 'created_at']
    search_fields = ['facility_name', 'address', 'manager__user__email']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('facility_name', 'manager', 'is_active', 'court_count', 'operating_hours')
        }),
        ('Location', {
            'fields': ('address', 'timezone', 'latitude', 'longitude'),
            'description': 'Enter the address and select timezone. Coordinates will auto-fill from address selection.'
        }),
        ('Approval & Commission', {
            'fields': ('approval_status', 'commission_rate', 'approved_by', 'approved_at', 'submitted_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FacilitySportType)
class FacilitySportTypeAdmin(admin.ModelAdmin):
    list_display = ['facility', 'sport_type', 'created_at']
    list_filter = ['sport_type', 'created_at']
    search_fields = ['facility__facility_name', 'sport_type__sport_name']
    readonly_fields = ['created_at']


@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    list_display = ['name', 'facility', 'sport_type', 'hourly_rate', 'is_active']
    list_filter = ['sport_type', 'is_active', 'facility']
    search_fields = ['name', 'facility__facility_name']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['court', 'start_time', 'end_time', 'is_available']
    list_filter = ['is_available', 'start_time', 'court__facility']
    search_fields = ['court__name', 'court__facility__facility_name']