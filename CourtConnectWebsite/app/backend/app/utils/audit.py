"""
Audit Logging Utility
Provides centralized logging for user and manager actions across the platform
"""

from django.utils import timezone
from app.admindashboard.models import ActivityLog
import threading

# Thread-local storage to check if we're in an API request context
_thread_locals = threading.local()


def set_current_request(request):
    """Store the current request in thread-local storage"""
    _thread_locals.request = request


def get_current_request():
    """Get the current request from thread-local storage"""
    return getattr(_thread_locals, 'request', None)


def clear_current_request():
    """Clear the current request from thread-local storage"""
    if hasattr(_thread_locals, 'request'):
        del _thread_locals.request


def is_api_request():
    """
    Check if the current action is from an API request (not Django admin or shell)
    Returns True if we should log this action
    """
    request = get_current_request()
    if request is None:
        # No request context = management command, shell, or migration
        return False

    # Check if it's a Django admin request
    path = request.path
    if path.startswith('/admin/') or path.startswith('/django-admin/'):
        return False

    return True


class ActivityLogger:
    """
    Centralized activity logging for user and manager actions

    Usage:
        from app.utils.audit import ActivityLogger

        # Log a user action
        ActivityLogger.log_user_action(
            user=request.user,
            action='create_booking',
            resource_type='booking',
            resource_id=booking.booking_id,
            metadata={'facility_name': facility.name, 'duration_hours': 2}
        )

        # Log a manager action
        ActivityLogger.log_manager_action(
            user=request.user,  # The manager's user account
            action='create_facility',
            resource_type='facility',
            resource_id=facility.facility_id,
            metadata={'facility_name': facility.name}
        )
    """

    @staticmethod
    def log_action(user, action, resource_type=None, resource_id=None, metadata=None):
        """
        Log an action to the activity log

        Args:
            user: User instance performing the action
            action: String describing the action (e.g., 'login', 'create_booking')
            resource_type: Type of resource (e.g., 'booking', 'facility', 'court')
            resource_id: ID of the affected resource
            metadata: Dict with additional context (serializable to JSON)
        """
        # Only log if we're in an API request context (exclude Django admin, shell, etc.)
        if not is_api_request():
            return None

        try:
            log_entry = ActivityLog.objects.create(
                user=user,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                metadata=metadata or {},
            )
            return log_entry
        except Exception as e:
            # Log the error but don't fail the main operation
            print(f"[ActivityLogger] Failed to log action: {e}")
            return None

    @staticmethod
    def log_user_action(user, action, resource_type=None, resource_id=None, metadata=None):
        """
        Log a regular user action

        Common actions:
        - 'login'
        - 'logout'
        - 'create_booking'
        - 'cancel_booking'
        - 'update_profile'
        - 'verify_email'
        """
        return ActivityLogger.log_action(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata
        )

    @staticmethod
    def log_manager_action(user, action, resource_type=None, resource_id=None, metadata=None):
        """
        Log a manager action

        Common actions:
        - 'create_facility'
        - 'update_facility'
        - 'delete_facility'
        - 'create_court'
        - 'update_court'
        - 'delete_court'
        - 'update_availability'
        - 'apply_for_manager'
        """
        # Add manager flag to metadata
        meta = metadata or {}
        meta['is_manager_action'] = True

        return ActivityLogger.log_action(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=meta
        )

    @staticmethod
    def log_crud_action(user, action, resource_type, resource_id, instance, metadata=None):
        """
        Log a CRUD operation with automatic metadata extraction

        Args:
            user: User performing the action
            action: 'create', 'update', 'delete'
            resource_type: Type of resource
            resource_id: Resource ID
            instance: The model instance (for extracting common fields)
            metadata: Additional metadata dict
        """
        meta = metadata or {}

        # Try to extract common fields from the instance
        if hasattr(instance, 'name'):
            meta['name'] = instance.name
        elif hasattr(instance, 'facility_name'):
            meta['facility_name'] = instance.facility_name
        elif hasattr(instance, 'email'):
            meta['email'] = instance.email

        # Add the action type to metadata
        meta['crud_action'] = action

        return ActivityLogger.log_action(
            user=user,
            action=f'{action}_{resource_type}',
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=meta
        )
