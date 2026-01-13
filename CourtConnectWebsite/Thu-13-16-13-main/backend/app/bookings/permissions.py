from rest_framework import permissions
from app.users.models import Manager


class IsAuthenticatedAndVerified(permissions.BasePermission):
    """
    Permission to only allow authenticated and email-verified users.
    """
    message = "You must be logged in and have a verified email address to access this resource."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.verification_status == 'verified'
        )


class IsBookingOwner(permissions.BasePermission):
    """
    Permission to only allow booking owners to access their bookings.
    """
    message = "You can only access your own bookings."

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsManagerOfFacility(permissions.BasePermission):
    """
    Permission to only allow managers to access bookings for their facilities.
    """
    message = "You can only access bookings for facilities you manage."

    def has_permission(self, request, view):
        # User must be authenticated and a manager
        if not (request.user and request.user.is_authenticated):
            return False

        try:
            Manager.objects.get(user=request.user)
            return True
        except Manager.DoesNotExist:
            return False

    def has_object_permission(self, request, view, obj):
        # Check if user is manager of the facility
        try:
            manager = Manager.objects.get(user=request.user)
            return obj.court.facility.manager.user == request.user
        except Manager.DoesNotExist:
            return False


class IsBookingOwnerOrManager(permissions.BasePermission):
    """
    Permission to allow booking owners or facility managers to access bookings.
    """
    message = "You can only access bookings you own or for facilities you manage."

    def has_object_permission(self, request, view, obj):
        # Allow booking owner
        if obj.user == request.user:
            return True

        # Allow facility manager
        try:
            manager = Manager.objects.get(user=request.user)
            return obj.court.facility.manager.user == request.user
        except Manager.DoesNotExist:
            return False


class CanCreateBooking(permissions.BasePermission):
    """
    Permission to check if user can create a booking (max 5 active bookings).
    """
    message = "You have reached the maximum number of active bookings (5)."

    def has_permission(self, request, view):
        if request.method == 'POST':
            from .models import Booking
            active_bookings = Booking.objects.filter(
                user=request.user,
                status__status_name__in=['pending_payment', 'confirmed']
            ).count()

            return active_bookings < 5

        return True