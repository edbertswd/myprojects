"""
Custom middleware for the application
"""

from app.utils.audit import set_current_request, clear_current_request


class AuditLogMiddleware:
    """
    Middleware that stores the current request in thread-local storage
    This allows the ActivityLogger to determine if an action is from an API request
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store the request before processing
        set_current_request(request)

        try:
            response = self.get_response(request)
        finally:
            # Clear the request after processing
            clear_current_request()

        return response
