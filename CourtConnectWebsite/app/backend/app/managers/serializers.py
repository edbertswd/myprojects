from rest_framework import serializers
from app.users.models import Manager, User


class ManagerUserSerializer(serializers.ModelSerializer):
    """Serializer for nested user information in manager responses"""

    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'phone_number', 'verification_status', 'created_at']
        read_only_fields = ['user_id', 'created_at']


class ManagerSerializer(serializers.ModelSerializer):
    """Serializer for displaying manager profile information"""
    user = ManagerUserSerializer(read_only=True)

    class Meta:
        model = Manager
        fields = [
            'user',
            'payment_account_id',
            'payment_provider',
            'payout_verification_status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ManagerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating manager profile information"""

    class Meta:
        model = Manager
        fields = [
            'payment_account_id',
            'payment_provider',
            'payout_verification_status'
        ]

    def validate_payment_provider(self, value):
        """Validate payment provider is from allowed list"""
        allowed_providers = ['stripe', 'paypal', 'bank_transfer']
        if value and value not in allowed_providers:
            raise serializers.ValidationError(
                f'Payment provider must be one of: {", ".join(allowed_providers)}'
            )
        return value

    def validate_payout_verification_status(self, value):
        """Validate verification status"""
        allowed_statuses = ['unverified', 'pending', 'verified', 'rejected']
        if value and value not in allowed_statuses:
            raise serializers.ValidationError(
                f'Verification status must be one of: {", ".join(allowed_statuses)}'
            )
        return value


class ManagerRegistrationSerializer(serializers.Serializer):
    """Serializer for manager registration (creates both User and Manager)"""
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    phone_number = serializers.CharField(max_length=32, required=False, allow_blank=True)
    payment_provider = serializers.CharField(max_length=50, required=False, allow_blank=True)
    payment_account_id = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists')
        return value

    def create(self, validated_data):
        """Create both User and Manager records"""
        # Extract manager-specific fields
        payment_provider = validated_data.pop('payment_provider', None)
        payment_account_id = validated_data.pop('payment_account_id', None)

        # Create user
        user = User.objects.create_user(**validated_data)

        # Create manager profile
        manager = Manager.objects.create(
            user=user,
            payment_provider=payment_provider,
            payment_account_id=payment_account_id,
            payout_verification_status='unverified'
        )

        return manager
