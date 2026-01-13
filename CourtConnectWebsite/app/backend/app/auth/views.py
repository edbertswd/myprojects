from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from .services import AuthenticationService
from .permissions import IsAuthenticated
from app.users.models import Manager
from app.utils.audit import ActivityLogger


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(generics.GenericAPIView):
    """
    User login endpoint
    POST /auth/login/
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable CSRF check for login

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Check if user has MFA enabled
        if user.mfa_enabled:
            # Generate and send OTP instead of logging in
            from .services import OTPService

            otp_code = OTPService.generate_otp(user, purpose='login_mfa')
            # Attempt to send email (non-blocking - OTP still valid via console)
            OTPService.send_otp_email(user, otp_code)

            # Store user ID in session temporarily for OTP verification
            request.session['pending_mfa_user_id'] = user.user_id
            request.session['pending_mfa_email'] = user.email

            return Response({
                'requiresMfa': True,
                'message': 'OTP code sent to your email',
                'email': user.email
            }, status=status.HTTP_200_OK)

        # No MFA - proceed with normal login
        # Create session
        session = AuthenticationService.create_session(user, request)

        # Login user in Django session (specify backend to avoid error)
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        # Return user data and session
        user_serializer = UserSerializer(user)

        response_data = {
            'user': user_serializer.data,
            'session_id': session.session_id,
            'message': 'Login successful'
        }

        response = Response(response_data, status=status.HTTP_200_OK)

        # Set session cookie
        response.set_cookie(
            'session_id',
            session.session_id,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax'
        )

        return response


class LogoutView(generics.GenericAPIView):
    """
    User logout endpoint
    POST /auth/logout/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Get session ID from header or cookie
        session_id = request.headers.get('X-Session-ID') or request.COOKIES.get('session_id')

        if session_id:
            AuthenticationService.revoke_session(session_id)

        # Logout from Django session
        django_logout(request)

        response = Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )

        # Clear session cookie
        response.delete_cookie('session_id')

        return response


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint
    POST /auth/register/
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable CSRF check for registration

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Mark user as inactive until email is verified
        user.is_active = False
        user.verification_status = 'pending'
        user.save()

        # Generate and send OTP for email verification
        from .services import OTPService

        otp_code = OTPService.generate_otp(user, purpose='email_verification')
        # Attempt to send email (non-blocking - OTP still valid via console)
        OTPService.send_otp_email(user, otp_code)

        # Store user ID in session temporarily for email verification
        request.session['pending_verification_user_id'] = user.user_id
        request.session['pending_verification_email'] = user.email

        return Response({
            'requiresVerification': True,
            'message': 'Verification code sent to your email',
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user profile
    GET/PUT /auth/profile/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        """Allow partial updates (PATCH)"""
        return super().update(request, *args, partial=True, **kwargs)


from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """
    GET /auth/csrf/
    Returns a CSRF token cookie
    """
    permission_classes = [AllowAny]
    authentication_classes = []  

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


class VerifyLoginMFAView(generics.GenericAPIView):
    """
    Verify OTP code for login MFA
    POST /auth/verify-mfa/
    Body: { "code": "123456" }
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable CSRF check for MFA verification

    def post(self, request, *args, **kwargs):
        code = request.data.get('code', '').strip()

        if not code:
            return Response(
                {'error': 'OTP code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(code) != 6 or not code.isdigit():
            return Response(
                {'error': 'OTP code must be 6 digits'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get pending user from session
        pending_user_id = request.session.get('pending_mfa_user_id')
        if not pending_user_id:
            return Response(
                {'error': 'No pending MFA verification. Please login again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user
        from app.users.models import User
        try:
            user = User.objects.get(user_id=pending_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid session. Please login again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify OTP
        from .services import OTPService
        is_valid = OTPService.verify_otp(user, code, purpose='login_mfa')

        if not is_valid:
            return Response(
                {'error': 'Invalid or expired OTP code'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # OTP verified - complete login
        # Clear pending MFA data
        request.session.pop('pending_mfa_user_id', None)
        request.session.pop('pending_mfa_email', None)

        # Create session
        session = AuthenticationService.create_session(user, request)

        # Login user in Django session
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        # Return user data and session
        user_serializer = UserSerializer(user)

        response_data = {
            'user': user_serializer.data,
            'session_id': session.session_id,
            'message': 'Login successful'
        }

        response = Response(response_data, status=status.HTTP_200_OK)

        # Set session cookie
        response.set_cookie(
            'session_id',
            session.session_id,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax'
        )

        return response


class VerifyEmailView(generics.GenericAPIView):
    """
    Verify email address during registration
    POST /auth/verify-email/
    Body: { "code": "123456" }
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable CSRF check for email verification

    def post(self, request, *args, **kwargs):
        code = request.data.get('code', '').strip()

        if not code:
            return Response(
                {'error': 'Verification code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(code) != 6 or not code.isdigit():
            return Response(
                {'error': 'Verification code must be 6 digits'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get pending user from session
        pending_user_id = request.session.get('pending_verification_user_id')
        if not pending_user_id:
            return Response(
                {'error': 'No pending email verification. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user
        from app.users.models import User
        try:
            user = User.objects.get(user_id=pending_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid session. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify OTP
        from .services import OTPService
        is_valid = OTPService.verify_otp(user, code, purpose='email_verification')

        if not is_valid:
            return Response(
                {'error': 'Invalid or expired verification code'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # OTP verified - activate user and complete registration
        user.is_active = True
        user.verification_status = 'verified'
        user.save()

        # Clear pending verification data
        request.session.pop('pending_verification_user_id', None)
        request.session.pop('pending_verification_email', None)

        # Create session for the newly verified user
        session = AuthenticationService.create_session(user, request)

        # Login user in Django session
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        # Return user data and session
        user_serializer = UserSerializer(user)

        response_data = {
            'user': user_serializer.data,
            'session_id': session.session_id,
            'message': 'Email verified successfully. Registration complete!'
        }

        response = Response(response_data, status=status.HTTP_200_OK)

        # Set session cookie
        response.set_cookie(
            'session_id',
            session.session_id,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax'
        )

        return response
