from django.contrib import admin
from .models import PaymentStatus, PaymentMethod, Payment

@admin.register(PaymentStatus)
class PaymentStatusAdmin(admin.ModelAdmin):
    list_display = ['status_name', 'created_at']
    search_fields = ['status_name']

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'is_default', 'created_at']
    list_filter = ['provider', 'is_default']
    search_fields = ['user__email']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'booking', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'provider', 'currency', 'created_at']
    search_fields = ['booking__user__email', 'provider_payment_id']