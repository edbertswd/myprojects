from django.contrib.auth import login, logout
from django.utils import timezone
from datetime import timedelta
import uuid
from app.users.models import User, Session


SESSION_EXPIRY_HOURS = 1

class AuthenticationService:
    @staticmethod
    def create_session(user, request=None):
        """Create a new session for the user"""
        # Revoke any existing active sessions (optional - for single session per user)
        Session.objects.filter(user=user, expires_at__gt=timezone.now(), revoked_at__isnull=True).update(
            revoked_at=timezone.now()
        )

        # Create new session
        session_id = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=SESSION_EXPIRY_HOURS)

        session_data = {
            'session_id': session_id,
            'user': user,
            'expires_at': expires_at,
        }

        if request:
            session_data.update({
                'ip_address': AuthenticationService.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:2000]  # Limit length
            })

        session = Session.objects.create(**session_data)
        return session

    @staticmethod
    def revoke_session(session_id):
        """Revoke a specific session"""
        try:
            session = Session.objects.get(session_id=session_id, revoked_at__isnull=True)
            session.revoked_at = timezone.now()
            session.save()
            return True
        except Session.DoesNotExist:
            return False

    @staticmethod
    def revoke_all_user_sessions(user):
        """Revoke all sessions for a user"""
        Session.objects.filter(
            user=user,
            expires_at__gt=timezone.now(),
            revoked_at__isnull=True
        ).update(revoked_at=timezone.now())

    @staticmethod
    def is_session_valid(session_id):
        """Check if a session is valid"""
        try:
            session = Session.objects.get(
                session_id=session_id,
                expires_at__gt=timezone.now(),
                revoked_at__isnull=True #checks if session was revoked
            )
            return session.user
        except Session.DoesNotExist:
            return None

    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @staticmethod
    def clean_expired_sessions():
        """Clean up expired sessions (can be called via management command or celery task)"""
        expired_count = Session.objects.filter(expires_at__lt=timezone.now()).count()
        Session.objects.filter(expires_at__lt=timezone.now()).delete()
        return expired_count


class TokenService:
    @staticmethod
    def generate_verification_token(user, token_type='email_verify'):
        """Generate a verification token for email verification, password reset, etc."""
        from app.users.models import VerificationToken

        token_id = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=24)  # 24 hour expiry

        # Invalidate any existing tokens of the same type
        VerificationToken.objects.filter(
            user=user,
            token_type=token_type,
            used=False
        ).update(used=True, used_at=timezone.now())

        token = VerificationToken.objects.create(
            token_id=token_id,
            user=user,
            token_type=token_type,
            expires_at=expires_at
        )

        return token

    @staticmethod
    def verify_token(token_id, token_type='email_verify'):
        """Verify and consume a verification token"""
        from app.users.models import VerificationToken

        try:
            token = VerificationToken.objects.get(
                token_id=token_id,
                token_type=token_type,
                expires_at__gt=timezone.now(),
                used=False
            )

            # Mark token as used
            token.used = True
            token.used_at = timezone.now()
            token.save()

            return token.user
        except VerificationToken.DoesNotExist:
            return None


class OTPService:
    """Service for handling One-Time Password operations"""

    @staticmethod
    def generate_otp(user, purpose='admin_reauth'):
        """
        Generate a new OTP code for the user

        Args:
            user: User instance
            purpose: Purpose of the OTP (default: 'admin_reauth')

        Returns:
            OTPCode instance
        """
        from .models import OTPCode
        import random

        # Generate 6-digit code
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # Invalidate any previous unused OTPs for the same purpose
        OTPCode.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False
        ).update(is_used=True)

        # Create new OTP
        otp = OTPCode.objects.create(
            user=user,
            code=code,
            purpose=purpose
        )

        # Print OTP code to console for development/testing
        print("\n" + "="*60)
        print("OTP CODE GENERATED")
        print("="*60)
        print(f"User: {user.email}")
        print(f"Purpose: {purpose}")
        print(f"Code: {code}")
        print(f"Expires at: {otp.expires_at}")
        print("="*60 + "\n")

        return otp

    @staticmethod
    def verify_otp(user, code, purpose='admin_reauth'):
        """
        Verify an OTP code

        Args:
            user: User instance
            code: 6-digit OTP code
            purpose: Purpose to match

        Returns:
            True if valid, False otherwise
        """
        from .models import OTPCode

        try:
            otp = OTPCode.objects.get(
                user=user,
                code=code,
                purpose=purpose,
                is_used=False
            )

            # Check if still valid (not expired)
            if not otp.is_valid():
                return False

            # Mark as used
            otp.is_used = True
            otp.save()

            return True

        except OTPCode.DoesNotExist:
            return False

    @staticmethod
    def send_otp_email(user, otp_code):
        """
        Send OTP code via email

        Args:
            user: User instance
            otp_code: OTPCode instance
        """
        from django.core.mail import send_mail
        from django.conf import settings

        # Customize message based on purpose
        purpose = otp_code.purpose

        if purpose == 'email_verification':
            subject = 'Verify Your Email - CourtConnect'
            heading = 'Welcome to CourtConnect!'
            intro_text = 'Thank you for signing up! Please verify your email address to activate your account.'
        elif purpose == 'login_mfa':
            subject = 'Your Login Verification Code'
            heading = 'Login Verification'
            intro_text = 'You are attempting to login. Please enter the code below to continue.'
        else:  # admin_reauth
            subject = 'Your Admin Verification Code'
            heading = 'Admin Verification'
            intro_text = 'For sensitive admin actions, please verify your identity with the code below.'

        # Calculate expiry time
        from django.utils import timezone
        time_left = int((otp_code.expires_at - timezone.now()).total_seconds() / 60)

        message = f"""
Hello {user.name or user.email},

{intro_text}

Your verification code is: {otp_code.code}

This code will expire in {time_left} minutes.

If you did not request this code, please ignore this email and contact support.

Best regards,
CourtConnect Team
"""

        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .code-box {{ background-color: #f4f4f4; border: 2px dashed #666; padding: 20px; text-align: center; margin: 20px 0; }}
        .code {{ font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50; }}
        .warning {{ color: #e74c3c; font-size: 12px; margin-top: 20px; }}
        .content {{ padding: 30px; background: white; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0; font-size: 24px;">{heading}</h2>
        </div>
        <div class="content">
            <p>Hello {user.name or user.email},</p>
            <p>{intro_text}</p>
            <div class="code-box">
                <div class="code">{otp_code.code}</div>
            </div>
            <p>This code will expire in <strong>{time_left} minutes</strong>.</p>
            <div class="warning">
                <p>⚠️ If you did not request this code, please ignore this email and contact support immediately.</p>
            </div>
            <p>Best regards,<br>CourtConnect Team</p>
        </div>
    </div>
</body>
</html>
"""

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            # Log the error (you might want to use proper logging here)
            print(f"Failed to send OTP email: {str(e)}")
            return False

    @staticmethod
    def clean_expired_otps():
        """Clean up expired OTP codes (can be called via management command)"""
        from .models import OTPCode
        expired_count = OTPCode.objects.filter(expires_at__lt=timezone.now()).count()
        OTPCode.objects.filter(expires_at__lt=timezone.now()).delete()
        return expired_count