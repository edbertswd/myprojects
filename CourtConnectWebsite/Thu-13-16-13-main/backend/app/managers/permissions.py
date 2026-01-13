from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    """
    Permission class that allows only users with Manager profile
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'manager')
        )
