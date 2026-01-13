from django.db import models


class PaymentStatus(models.Model):
    status_id = models.BigAutoField(primary_key=True)
    status_name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_status'

    def __str__(self):
        """
        Return string representation of the payment status.

        Returns:
            str: Name of the payment status (e.g., 'pending', 'completed', 'failed')
        """
        return self.status_name


class PaymentMethod(models.Model):
    payment_method_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    provider = models.CharField(max_length=50)
    payment_token = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_methods'
        indexes = [
            models.Index(fields=['user'], name='idx_payment_methods_user')
        ]

    def __str__(self):
        """
        Return string representation of the payment method.

        Returns:
            str: Formatted string with user email and payment provider
        """
        return f"{self.user.email} - {self.provider}"


class Payment(models.Model):
    payment_id = models.BigAutoField(primary_key=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.RESTRICT)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.RESTRICT, null=True, blank=True)
    provider = models.CharField(max_length=50)
    provider_payment_id = models.CharField(max_length=255)
    idempotency_key = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='AUD')
    status = models.ForeignKey(PaymentStatus, on_delete=models.RESTRICT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        constraints = [
            models.UniqueConstraint(fields=['provider', 'provider_payment_id'], name='unique_provider_payment')
        ]
        indexes = [
            models.Index(fields=['booking'], name='idx_payments_booking')
        ]

    def __str__(self):
        """
        Return string representation of the payment.

        Returns:
            str: Formatted string with payment ID, amount, and currency
        """
        return f"Payment {self.payment_id} - {self.amount:.2f} {self.currency}"