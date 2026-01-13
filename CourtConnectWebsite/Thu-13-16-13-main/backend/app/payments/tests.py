from django.test import TestCase
from app.payments.models import PaymentStatus, PaymentMethod, Payment
from app.bookings.models import Booking, BookingStatus
from app.facilities.models import Facility, Court, SportType, Availability
from app.users.models import User
from django.utils import timezone
from datetime import timedelta


class PaymentStatusModelTests(TestCase):
    """Test PaymentStatus model"""

    def test_create_payment_status(self):
        """Test creating a payment status"""
        status, _ = PaymentStatus.objects.get_or_create(status_name='pending')
        self.assertEqual(status.status_name, 'pending')
        self.assertIsNotNone(status.created_at)

    def test_payment_status_str_representation(self):
        """Test string representation"""
        status, _ = PaymentStatus.objects.get_or_create(status_name='completed')
        self.assertEqual(str(status), 'completed')

    def test_payment_status_unique(self):
        """Test that status name must be unique"""
        PaymentStatus.objects.get_or_create(status_name='test_unique_payment_status')

        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            PaymentStatus.objects.create(status_name='test_unique_payment_status')


class PaymentMethodModelTests(TestCase):
    """Test PaymentMethod model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

    def test_create_payment_method(self):
        """Test creating a payment method"""
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456',
            is_default=True
        )
        self.assertEqual(payment_method.user, self.user)
        self.assertEqual(payment_method.provider, 'stripe')
        self.assertTrue(payment_method.is_default)

    def test_payment_method_str_representation(self):
        """Test string representation"""
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456'
        )
        expected_str = f"{self.user.email} - stripe"
        self.assertEqual(str(payment_method), expected_str)

    def test_payment_method_default_value(self):
        """Test default value for is_default"""
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456'
        )
        self.assertFalse(payment_method.is_default)

    def test_payment_method_cascade_on_user_delete(self):
        """Test that payment methods are deleted when user is deleted"""
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456'
        )

        payment_method_id = payment_method.payment_method_id
        self.user.delete()

        # Payment method should be deleted
        self.assertFalse(
            PaymentMethod.objects.filter(payment_method_id=payment_method_id).exists()
        )

    def test_payment_method_timestamps(self):
        """Test payment method timestamps"""
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456'
        )
        self.assertIsNotNone(payment_method.created_at)
        self.assertIsNotNone(payment_method.updated_at)


class PaymentModelTests(TestCase):
    """Test Payment model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.facility = Facility.objects.create(
            facility_name='Test Center',
            address='123 Test St'
        )
        self.sport_type = SportType.objects.create(sport_name='Tennis')
        self.court = Court.objects.create(
            facility=self.facility,
            name='Court 1',
            sport_type=self.sport_type,
            hourly_rate=50.00
        )

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        self.availability = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        booking_status, _ = BookingStatus.objects.get_or_create(status_name='pending_payment')

        self.booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        self.payment_status, _ = PaymentStatus.objects.get_or_create(status_name='completed')

        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='stripe',
            payment_token='tok_123456'
        )

    def test_create_payment(self):
        """Test creating a payment"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            currency='AUD',
            status=self.payment_status
        )
        self.assertEqual(payment.booking, self.booking)
        self.assertEqual(payment.provider, 'stripe')
        self.assertEqual(float(payment.amount), 50.00)
        self.assertEqual(payment.currency, 'AUD')

    def test_payment_str_representation(self):
        """Test string representation"""
        payment = Payment.objects.create(
            booking=self.booking,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            currency='AUD',
            status=self.payment_status
        )
        expected_str = f"Payment {payment.payment_id} - 50.00 AUD"
        self.assertEqual(str(payment), expected_str)

    def test_payment_default_currency(self):
        """Test default currency is AUD"""
        payment = Payment.objects.create(
            booking=self.booking,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            status=self.payment_status
        )
        self.assertEqual(payment.currency, 'AUD')

    def test_payment_unique_idempotency_key(self):
        """Test that idempotency_key must be unique"""
        Payment.objects.create(
            booking=self.booking,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            status=self.payment_status
        )

        # Create another booking for second payment
        start_time = timezone.now() + timedelta(days=2)
        end_time = start_time + timedelta(hours=1)

        availability2 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        booking2 = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability2,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        from django.db import IntegrityError
        # Same idempotency_key should fail
        with self.assertRaises(IntegrityError):
            Payment.objects.create(
                booking=booking2,
                provider='stripe',
                provider_payment_id='pay_789012',
                idempotency_key='idem_123456',  # Same as first payment
                amount=50.00,
                status=self.payment_status
            )

    def test_payment_unique_provider_payment_id(self):
        """Test unique constraint on provider and provider_payment_id"""
        Payment.objects.create(
            booking=self.booking,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            status=self.payment_status
        )

        # Create another booking for second payment
        start_time = timezone.now() + timedelta(days=2)
        end_time = start_time + timedelta(hours=1)

        availability2 = Availability.objects.create(
            court=self.court,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        booking_status, _ = BookingStatus.objects.get_or_create(status_name='confirmed')

        booking2 = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=availability2,
            start_time=start_time,
            end_time=end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        from django.db import IntegrityError
        # Same provider + provider_payment_id should fail
        with self.assertRaises(IntegrityError):
            Payment.objects.create(
                booking=booking2,
                provider='stripe',
                provider_payment_id='pay_123456',  # Same as first payment
                idempotency_key='idem_789012',
                amount=50.00,
                status=self.payment_status
            )

    def test_payment_timestamps(self):
        """Test payment timestamps"""
        payment = Payment.objects.create(
            booking=self.booking,
            provider='stripe',
            provider_payment_id='pay_123456',
            idempotency_key='idem_123456',
            amount=50.00,
            status=self.payment_status
        )
        self.assertIsNotNone(payment.created_at)
        self.assertIsNotNone(payment.updated_at)
