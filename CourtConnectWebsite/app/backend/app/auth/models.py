from django.db import models
from django.utils import timezone
from datetime import timedelta
from app.users.models import User


class OTPCode(models.Model):
    """
    One-Time Password codes for MFA
    Used for admin re-authentication and other sensitive operations
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6, help_text='6-digit OTP code')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text='When this OTP expires')
    is_used = models.BooleanField(default=False, help_text='Whether this OTP has been used')
    purpose = models.CharField(
        max_length=50,
        default='admin_reauth',
        help_text='What this OTP is for (admin_reauth, login, etc.)'
    )

    class Meta:
        db_table = 'auth_otp_codes'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['code', 'is_used']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        """
        Return string representation of the OTP code.

        Returns:
            str: Formatted string showing user email, code, and expiration time
        """
        return f"OTP for {self.user.email} - {self.code} (expires: {self.expires_at})"

    def is_valid(self):
        """
        Check if OTP code is still valid for use.
        Validates that the code has not been used and has not expired.

        Returns:
            bool: True if OTP is unused and not expired, False otherwise
        """
        return not self.is_used and timezone.now() < self.expires_at

    def save(self, *args, **kwargs):
        """
        Override save method to automatically set expiration time.
        If expires_at is not set, it will be set to 10 minutes from now.

        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        # Set expiration to 10 minutes from now if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)
