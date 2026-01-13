from django.contrib.auth import authenticate
from django.utils.deprecation import MiddlewareMixin


class SessionAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware that automatically authenticates users via session ID.

    This middleware works with our SessionAuthenticationBackend to ensure that
    users with valid session IDs are automatically authenticated on each request,
    allowing Django's built-in `request.user.is_authenticated` to work properly.
    """

    def process_request(self, request):
        """
        Process the request to authenticate users via session ID.

        If the user is not already authenticated and has a valid session ID,
        authenticate them using our custom authentication backend.
        """
        # Skip if user is already authenticated (via Django admin login)
        if hasattr(request, 'user') and request.user.is_authenticated:
            return

        # Get session ID from headers or cookies
        session_id = request.headers.get('X-Session-ID') or request.COOKIES.get('session_id')

        if session_id:
            # Attempt to authenticate using our session backend
            user = authenticate(request=request, session_id=session_id)
            if user:
                request.user = user

        return None