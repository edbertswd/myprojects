from django.contrib import admin
from .models import BookingStatus, Booking

@admin.register(BookingStatus)
class BookingStatusAdmin(admin.ModelAdmin):
    list_display = ['status_name', 'created_at']
    search_fields = ['status_name']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'court', 'user', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'start_time', 'created_at']
    search_fields = ['user__email', 'court__name', 'court__facility__facility_name']
    readonly_fields = ['created_at', 'updated_at']