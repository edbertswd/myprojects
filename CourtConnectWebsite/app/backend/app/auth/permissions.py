from rest_framework import permissions
from rest_framework.exceptions import NotAuthenticated
from .services import AuthenticationService


class IsAuthenticated(permissions.BasePermission):
    """
    Custom authentication permission that checks session validity.
    """
    message = "You must be logged in to access this resource."

    def has_permission(self, request, view):
        # Check if user is authenticated via Django's built-in auth
        if hasattr(request, 'user') and request.user.is_authenticated:
            return True

        # Check session-based authentication
        session_id = request.headers.get('X-Session-ID') or request.COOKIES.get('session_id')
        if session_id:
            user = AuthenticationService.is_session_valid(session_id)
            if user:
                request.user = user
                return True

        # Raise NotAuthenticated to return 401 instead of 403
        raise NotAuthenticated("You must be logged in to access this resource.")


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Permission to allow authenticated users to perform any action,
    and unauthenticated users to only perform read-only actions.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check authentication for write operations
        session_id = request.headers.get('X-Session-ID') or request.COOKIES.get('session_id')
        if session_id:
            user = AuthenticationService.is_session_valid(session_id)
            if user:
                request.user = user
                return True

        return hasattr(request, 'user') and request.user.is_authenticated


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only to the owner
        return obj.user == request.user


class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users (includes superusers).
    """
    message = "You must be an admin user to access this resource."

    def has_permission(self, request, view):
        return (
            hasattr(request, 'user') and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_superuser)
        )


class IsVerifiedUser(permissions.BasePermission):
    """
    Permission to only allow verified users.
    """
    message = "You must have a verified email address to access this resource."

    def has_permission(self, request, view):
        return (
            hasattr(request, 'user') and
            request.user.is_authenticated and
            request.user.verification_status == 'verified'
        )