from django.contrib.auth.backends import BaseBackend
from .services import AuthenticationService


class SessionAuthenticationBackend(BaseBackend):
    """
    Custom authentication backend that supports session-based authentication.

    This backend integrates our session system with Django's built-in auth framework,
    allowing all existing permissions and `request.user.is_authenticated` to work
    seamlessly with session-authenticated users.
    """

    def authenticate(self, request, session_id=None, username=None, password=None, **kwargs):
        """
        Authenticate a user via session ID.

        Args:
            request: The HTTP request object
            session_id: Optional session ID to authenticate
            username: If provided, this backend should NOT authenticate (username/password auth)
            password: If provided, this backend should NOT authenticate (username/password auth)
            **kwargs: Additional authentication parameters (ignored)

        Returns:
            User instance if session is valid, None otherwise
        """
        # If username or password is provided, this is a password-based login attempt
        # Return None to let ModelBackend handle it
        if username is not None or password is not None:
            return None

        # Extract session_id from request if not explicitly provided
        # Priority: explicit parameter > X-Session-ID header > session_id cookie
        if not session_id and request:
            session_id = request.headers.get('X-Session-ID') or request.COOKIES.get('session_id')

        # Only authenticate via session if session_id is available
        if not session_id:
            return None

        # Validate session using our authentication service
        user = AuthenticationService.is_session_valid(session_id)

        if user:
            # Mark user as authenticated for Django's auth system
            user.backend = f'{self.__module__}.{self.__class__.__name__}'
            return user

        return None

    def get_user(self, user_id):
        """
        Get a user by their primary key.

        Args:
            user_id: The user's primary key

        Returns:
            User instance if found, None otherwise
        """
        from app.users.models import User

        try:
            user = User.objects.get(pk=user_id)
            user.backend = f'{self.__module__}.{self.__class__.__name__}'
            return user
        except User.DoesNotExist:
            return None

    def has_perm(self, user_obj, perm, obj=None):
        """
        Check if user has a specific permission.

        For now, we delegate to Django's default permission system.
        Override this method if you need custom permission logic.
        """
        return user_obj.is_active and super().has_perm(user_obj, perm, obj)