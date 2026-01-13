"""
Django signals for automatic CRUD audit logging
These signals automatically log changes to important models
"""

from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from app.facilities.models import Facility, Court, Availability
from app.bookings.models import Booking
from app.users.models import User
from app.payments.models import Payment
from .audit import ActivityLogger, get_current_request


# Store data before deletion for logging
_deletion_cache = {}


@receiver(pre_delete, sender=Facility)
def cache_facility_before_delete(sender, instance, **kwargs):
    """Cache facility data before deletion"""
    _deletion_cache[f'facility_{instance.facility_id}'] = {
        'facility_name': instance.facility_name,
        'address': instance.address,
        'manager_id': instance.manager.manager_id if instance.manager else None
    }


@receiver(post_delete, sender=Facility)
def log_facility_delete(sender, instance, **kwargs):
    """Log facility deletion"""
    request = get_current_request()
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return

    cached_data = _deletion_cache.pop(f'facility_{instance.facility_id}', {})

    # Check if user is a manager
    is_manager = hasattr(request.user, 'manager') and request.user.manager is not None
    log_method = ActivityLogger.log_manager_action if is_manager else ActivityLogger.log_user_action

    log_method(
        user=request.user,
        action='delete_facility_signal',
        resource_type='facility',
        resource_id=instance.facility_id,
        metadata={
            'facility_name': cached_data.get('facility_name', 'Unknown'),
            'address': cached_data.get('address', 'Unknown'),
            'deleted_via': 'signal'
        }
    )


@receiver(pre_delete, sender=Court)
def cache_court_before_delete(sender, instance, **kwargs):
    """Cache court data before deletion"""
    _deletion_cache[f'court_{instance.court_id}'] = {
        'court_name': instance.name,
        'facility_id': instance.facility.facility_id if instance.facility else None,
        'facility_name': instance.facility.facility_name if instance.facility else None
    }


@receiver(post_delete, sender=Court)
def log_court_delete(sender, instance, **kwargs):
    """Log court deletion via signals (catches deletions not through explicit views)"""
    request = get_current_request()
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return

    cached_data = _deletion_cache.pop(f'court_{instance.court_id}', {})

    ActivityLogger.log_manager_action(
        user=request.user,
        action='delete_court_signal',
        resource_type='court',
        resource_id=instance.court_id,
        metadata={
            'court_name': cached_data.get('court_name', 'Unknown'),
            'facility_name': cached_data.get('facility_name', 'Unknown'),
            'deleted_via': 'signal'
        }
    )


@receiver(pre_delete, sender=Availability)
def cache_availability_before_delete(sender, instance, **kwargs):
    """Cache availability data before deletion"""
    _deletion_cache[f'availability_{instance.availability_id}'] = {
        'court_id': instance.court.court_id if instance.court else None,
        'court_name': instance.court.name if instance.court else None,
        'start_time': instance.start_time.isoformat() if instance.start_time else None,
        'end_time': instance.end_time.isoformat() if instance.end_time else None
    }


@receiver(post_delete, sender=Availability)
def log_availability_delete(sender, instance, **kwargs):
    """Log availability deletion via signals"""
    request = get_current_request()
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return

    cached_data = _deletion_cache.pop(f'availability_{instance.availability_id}', {})

    ActivityLogger.log_manager_action(
        user=request.user,
        action='delete_availability_signal',
        resource_type='availability',
        resource_id=instance.availability_id,
        metadata={
            'court_name': cached_data.get('court_name', 'Unknown'),
            'start_time': cached_data.get('start_time', 'Unknown'),
            'end_time': cached_data.get('end_time', 'Unknown'),
            'deleted_via': 'signal'
        }
    )


@receiver(post_save, sender=Payment)
def log_payment_create_update(sender, instance, created, **kwargs):
    """Log payment creation and updates"""
    request = get_current_request()
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return

    action = 'create_payment' if created else 'update_payment'

    ActivityLogger.log_user_action(
        user=instance.booking.user if instance.booking else request.user,
        action=action,
        resource_type='payment',
        resource_id=instance.payment_id,
        metadata={
            'booking_id': instance.booking.booking_id if instance.booking else None,
            'amount': str(instance.amount),
            'payment_method': instance.payment_method.provider if instance.payment_method else instance.provider,
            'payment_status': instance.status.status_name if instance.status else None,
            'transaction_id': instance.provider_payment_id,
            'created_via': 'signal'
        }
    )


@receiver(post_save, sender=User)
def log_user_create_update(sender, instance, created, **kwargs):
    """Log user creation and significant updates"""
    request = get_current_request()

    # For user creation, we may not have a request context (registration)
    if created:
        # Only log if we have a request context (API-based creation)
        if request and hasattr(request, 'user'):
            ActivityLogger.log_user_action(
                user=instance,
                action='create_user',
                resource_type='user',
                resource_id=instance.user_id,
                metadata={
                    'email': instance.email,
                    'name': instance.name,
                    'created_via': 'signal'
                }
            )
