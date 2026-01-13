from django.contrib import admin
from .models import User, Manager, Session, VerificationToken

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'verification_status', 'is_admin', 'created_at']
    list_filter = ['verification_status', 'is_admin', 'created_at']
    search_fields = ['email', 'name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
    list_display = ['user', 'payment_provider', 'payout_verification_status', 'created_at']
    list_filter = ['payment_provider', 'payout_verification_status']
    search_fields = ['user__email', 'user__name']

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'expires_at', 'revoked_at']
    list_filter = ['expires_at', 'created_at']
    search_fields = ['user__email', 'session_id']

@admin.register(VerificationToken)
class VerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['token_id', 'user', 'token_type', 'expires_at', 'used']
    list_filter = ['token_type', 'used', 'expires_at']
    search_fields = ['user__email', 'token_id']


