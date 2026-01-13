"""
Payment Serializers
Reusable serializers for payment operations
"""
from rest_framework import serializers
from decimal import Decimal
from .models import Payment, PaymentMethod, PaymentStatus


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for saved payment methods"""

    class Meta:
        model = PaymentMethod
        fields = [
            'payment_method_id',
            'provider',
            'payment_token',
            'is_default',
            'created_at'
        ]
        read_only_fields = ['payment_method_id', 'created_at']


class PaymentStatusSerializer(serializers.ModelSerializer):
    """Serializer for payment status"""

    class Meta:
        model = PaymentStatus
        fields = ['status_id', 'status_name']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment records"""
    status_name = serializers.CharField(source='status.status_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'payment_id',
            'booking',
            'provider',
            'provider_payment_id',
            'amount',
            'currency',
            'status',
            'status_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['payment_id', 'created_at', 'updated_at']


class CreatePaymentOrderSerializer(serializers.Serializer):
    """Serializer for creating a payment order"""
    reservation_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    currency = serializers.CharField(max_length=3, default='AUD')
    provider = serializers.ChoiceField(choices=['paypal', 'stripe'], default='paypal')
    return_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)

    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class CapturePaymentSerializer(serializers.Serializer):
    """Serializer for capturing a payment"""
    order_id = serializers.CharField(required=True)
    payer_id = serializers.CharField(required=False)  # PayPal payer ID (optional in v2)
    provider = serializers.ChoiceField(choices=['paypal', 'stripe'], default='paypal')
    reservation_id = serializers.IntegerField(required=True)  # Needed to convert reservation to booking


class RefundPaymentSerializer(serializers.Serializer):
    """Serializer for refunding a payment"""
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Partial refund amount. Leave empty for full refund."
    )
    reason = serializers.CharField(
        max_length=500,
        required=False,
        help_text="Reason for refund"
    )

    def validate_amount(self, value):
        """Validate refund amount is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Refund amount must be greater than 0")
        return value


class PaymentCallbackSerializer(serializers.Serializer):
    """Serializer for payment provider callbacks/webhooks"""
    provider = serializers.CharField(required=True)
    event_type = serializers.CharField(required=True)
    resource_id = serializers.CharField(required=True)
    data = serializers.JSONField(required=False)
