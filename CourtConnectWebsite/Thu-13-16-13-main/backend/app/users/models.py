from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        """
        Create and save a regular user with the given email, name, and password.

        Args:
            email: User's email address (used as username)
            name: User's full name
            password: User's password (will be hashed)
            **extra_fields: Additional fields to set on the user model

        Returns:
            User: The created user instance

        Raises:
            ValueError: If email is not provided
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """
        Create and save a superuser with the given email, name, and password.
        Automatically sets is_admin, is_staff, and is_superuser to True.

        Args:
            email: Superuser's email address
            name: Superuser's full name
            password: Superuser's password (will be hashed)
            **extra_fields: Additional fields to set on the user model

        Returns:
            User: The created superuser instance
        """
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)  # Using EmailField instead of CITEXT for now
    # password field is inherited from AbstractBaseUser and maps to password_hash column
    phone_number = models.CharField(max_length=32, null=True, blank=True)
    verification_status = models.CharField(max_length=20, default='unverified')
    is_admin = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False, help_text='Whether MFA (OTP via email) is enabled for this user')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional fields required for Django admin
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        """
        Return string representation of the user.

        Returns:
            str: User's email address
        """
        return self.email

    @property
    def is_staff_user(self):
        """
        Check if user has staff privileges (admin or staff status).

        Returns:
            bool: True if user is admin or staff, False otherwise
        """
        return self.is_admin or self.is_staff


class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.RESTRICT, primary_key=True)
    payment_account_id = models.CharField(max_length=255, null=True, blank=True)
    payment_provider = models.CharField(max_length=50, null=True, blank=True)
    payout_verification_status = models.CharField(max_length=20, default='unverified')
    is_suspended = models.BooleanField(default=False, help_text='Whether manager is currently suspended')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'manager'
        indexes = [
            models.Index(fields=['is_suspended'], name='idx_manager_suspended'),
        ]


class Session(models.Model):
    session_id = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sessions'


class VerificationToken(models.Model):
    token_id = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token_type = models.CharField(max_length=32, default='email_verify')
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'verification_tokens'