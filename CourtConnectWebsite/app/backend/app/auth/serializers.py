from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from app.users.models import User
from axes.handlers.proxy import AxesProxyHandler
from axes.models import AccessAttempt


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Get request from context (required by django-axes)
            request = self.context.get('request')

            # Check if user is locked out by django-axes
            if request:
                # Check lockout status before attempting authentication
                handler = AxesProxyHandler()
                if handler.is_locked(request, credentials={'username': email}):
                    # Calculate time remaining until unlock
                    time_remaining = self._get_lockout_time_remaining(request, email)
                    raise serializers.ValidationError(
                        f'Too many tries! Try again in {time_remaining}.'
                    )

            # Pass request to authenticate for django-axes to work
            user = authenticate(request=request, username=email, password=password)

            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled.')
                data['user'] = user
                return data
            else:
                raise serializers.ValidationError('Wrong email or password.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

    def _get_lockout_time_remaining(self, request, username):
        """Calculate the time remaining until the account is unlocked"""
        from django.conf import settings
        from datetime import timedelta

        # Get the cooloff time from settings (in hours)
        cooloff_time = getattr(settings, 'AXES_COOLOFF_TIME', 1)

        # Get the most recent failed attempt
        ip_address = request.META.get('REMOTE_ADDR')
        attempt = AccessAttempt.objects.filter(
            username=username,
            ip_address=ip_address
        ).order_by('-attempt_time').first()

        if attempt:
            unlock_time = attempt.attempt_time + timedelta(hours=cooloff_time)
            remaining = unlock_time - timezone.now()

            # Format the time remaining in a user-friendly way
            total_seconds = int(remaining.total_seconds())
            if total_seconds <= 0:
                return "a few moments"

            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60

            if hours > 0:
                if minutes > 0:
                    return f"{hours} hour{'s' if hours != 1 else ''} and {minutes} minute{'s' if minutes != 1 else ''}"
                else:
                    return f"{hours} hour{'s' if hours != 1 else ''}"
            else:
                return f"{minutes} minute{'s' if minutes != 1 else ''}"

        return "1 hour"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('name', 'email', 'password', 'password_confirm', 'phone_number')

    def validate_phone_number(self, value):
        """Validate phone number format"""
        import re
        if value:  # Only validate if value is provided
            # Simplified pattern: optional +, then digits with optional separators (spaces, hyphens, dots, parens)
            # Must have 7-20 characters total and contain only valid phone characters
            pattern = r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.\(\)]*([0-9]{1,4}[-\s\.\(\)]*){1,6}$'
            # Also check it has at least 7 digits total
            digit_count = len(re.findall(r'\d', value))
            if not re.match(pattern, value) or digit_count < 7:
                raise serializers.ValidationError('Invalid phone number format')
        return value

    def validate_name(self, value):
        """Validate full name contains only letters and spaces"""
        import re
        if value:
            # Pattern allows only letters and spaces
            pattern = r'^[a-zA-Z\s]+$'
            if not re.match(pattern, value):
                raise serializers.ValidationError('Name can only contain letters and spaces')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError('Passwords do not match.')
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('user_id', 'name', 'email', 'phone_number', 'verification_status', 'created_at', 'is_admin', 'role', 'mfa_enabled')
        read_only_fields = ('user_id', 'email', 'created_at', 'verification_status', 'is_admin', 'role')

    def validate_phone_number(self, value):
        """Validate phone number format"""
        import re
        if value:  # Only validate if value is provided
            # Simplified pattern: optional +, then digits with optional separators (spaces, hyphens, dots, parens)
            # Must have 7-20 characters total and contain only valid phone characters
            pattern = r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.\(\)]*([0-9]{1,4}[-\s\.\(\)]*){1,6}$'
            # Also check it has at least 7 digits total
            digit_count = len(re.findall(r'\d', value))
            if not re.match(pattern, value) or digit_count < 7:
                raise serializers.ValidationError('Invalid phone number format')
        return value

    def get_role(self, obj):
        """Determine user role based on admin status and manager relationship"""
        if obj.is_admin or obj.is_superuser:
            return 'admin'

        # Check if user is a manager
        from app.users.models import Manager
        try:
            Manager.objects.get(user=obj)
            return 'manager'
        except Manager.DoesNotExist:
            return 'user'