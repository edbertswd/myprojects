"""
Comprehensive tests for Payment Views
Tests payment order creation, capture, and refund endpoints
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from unittest.mock import patch, Mock
from decimal import Decimal
from datetime import timedelta

from app.users.models import User
from app.facilities.models import Facility, Court, SportType, Availability
from app.bookings.models import Booking, BookingStatus, TemporaryReservation, ReservationSlot
from app.payments.models import Payment, PaymentStatus


class GetPaymentServiceTests(TestCase):
    """Test get_payment_service factory function"""

    def test_get_paypal_service(self):
        """Test getting PayPal service"""
        from app.payments.views import get_payment_service
        service = get_payment_service('paypal')
        from app.payments.services.paypal_service import PayPalService
        self.assertIsInstance(service, PayPalService)

    def test_get_unsupported_service(self):
        """Test getting unsupported payment service"""
        from app.payments.views import get_payment_service
        with self.assertRaises(ValueError) as context:
            get_payment_service('unsupported')
        self.assertIn('Unsupported payment provider', str(context.exception))


class CreatePaymentOrderViewTests(APITestCase):
    """Test create_payment_order view"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/payments/create/'

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

        # Create temporary reservation
        self.reservation = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        ReservationSlot.objects.create(
            reservation=self.reservation,
            availability=self.availability
        )

    def test_create_payment_order_unauthenticated(self):
        """Test creating payment order without authentication"""
        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_create_payment_order_invalid_data(self):
        """Test creating payment order with invalid data"""
        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            # Missing amount, currency, provider
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_payment_order_reservation_not_found(self):
        """Test creating payment order for non-existent reservation"""
        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': 99999,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('RESERVATION_NOT_FOUND', response.data['error'])

    def test_create_payment_order_wrong_user(self):
        """Test creating payment order for another user's reservation"""
        other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )
        self.client.force_authenticate(user=other_user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('RESERVATION_OWNERSHIP', response.data['error'])

    def test_create_payment_order_expired_reservation(self):
        """Test creating payment order for expired reservation"""
        # Make reservation expired
        self.reservation.expires_at = timezone.now() - timedelta(minutes=1)
        self.reservation.save()

        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('RESERVATION_EXPIRED', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    def test_create_payment_order_success(self, mock_get_service):
        """Test successful payment order creation"""
        # Mock the payment service
        mock_service = Mock()
        mock_service.create_order.return_value = {
            'success': True,
            'order_id': 'ORDER123',
            'approval_url': 'https://paypal.com/approve/ORDER123'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal',
            'return_url': 'http://example.com/return',
            'cancel_url': 'http://example.com/cancel'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['order_id'], 'ORDER123')
        self.assertEqual(response.data['provider'], 'paypal')

    @patch('app.payments.views.get_payment_service')
    def test_create_payment_order_payment_service_failure(self, mock_get_service):
        """Test payment order creation when payment service fails"""
        mock_service = Mock()
        mock_service.create_order.return_value = {
            'success': False,
            'error': 'Payment provider error'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Payment provider error', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    def test_create_payment_order_exception(self, mock_get_service):
        """Test payment order creation with exception"""
        mock_get_service.side_effect = Exception("Unexpected error")

        self.client.force_authenticate(user=self.user)

        data = {
            'reservation_id': self.reservation.reservation_id,
            'amount': 50.00,
            'currency': 'AUD',
            'provider': 'paypal'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class CapturePaymentViewTests(APITestCase):
    """Test capture_payment view"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/payments/capture/'

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

        # Create temporary reservation
        self.reservation = TemporaryReservation.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        ReservationSlot.objects.create(
            reservation=self.reservation,
            availability=self.availability
        )

        # Create payment statuses
        PaymentStatus.objects.get_or_create(status_name='completed')
        BookingStatus.objects.get_or_create(status_name='pending_payment')
        BookingStatus.objects.get_or_create(status_name='confirmed')

    def test_capture_payment_unauthenticated(self):
        """Test capturing payment without authentication"""
        data = {
            'order_id': 'ORDER123',
            'provider': 'paypal',
            'reservation_id': self.reservation.reservation_id
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_capture_payment_invalid_data(self):
        """Test capturing payment with invalid data"""
        self.client.force_authenticate(user=self.user)

        data = {
            'order_id': 'ORDER123'
            # Missing provider and reservation_id
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('app.payments.views.get_payment_service')
    def test_capture_payment_service_failure(self, mock_get_service):
        """Test payment capture when service fails"""
        mock_service = Mock()
        mock_service.capture_payment.return_value = {
            'success': False,
            'error': 'Capture failed'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {
            'order_id': 'ORDER123',
            'provider': 'paypal',
            'reservation_id': self.reservation.reservation_id
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Capture failed', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    @patch('app.payments.views.ReservationService.convert_reservation_to_booking')
    def test_capture_payment_success(self, mock_convert, mock_get_service):
        """Test successful payment capture"""
        # Create booking for conversion
        booking_status = BookingStatus.objects.get(status_name='pending_payment')
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            availability=self.availability,
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            hourly_rate_snapshot=50.00,
            commission_rate_snapshot=0.10,
            status=booking_status
        )

        mock_convert.return_value = booking

        mock_service = Mock()
        mock_service.capture_payment.return_value = {
            'success': True,
            'payment_id': 'CAPTURE123',
            'amount': Decimal('50.00'),
            'currency': 'AUD'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {
            'order_id': 'ORDER123',
            'provider': 'paypal',
            'reservation_id': self.reservation.reservation_id,
            'payer_id': 'PAYER123'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['booking_id'], booking.booking_id)

    @patch('app.payments.views.get_payment_service')
    @patch('app.payments.views.ReservationService.convert_reservation_to_booking')
    def test_capture_payment_reservation_conversion_error(self, mock_convert, mock_get_service):
        """Test payment capture when reservation conversion fails"""
        mock_service = Mock()
        mock_service.capture_payment.return_value = {
            'success': True,
            'payment_id': 'CAPTURE123',
            'amount': Decimal('50.00'),
            'currency': 'AUD'
        }
        mock_get_service.return_value = mock_service

        mock_convert.side_effect = ValueError("Reservation expired")

        self.client.force_authenticate(user=self.user)

        data = {
            'order_id': 'ORDER123',
            'provider': 'paypal',
            'reservation_id': self.reservation.reservation_id
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Reservation expired', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    def test_capture_payment_exception(self, mock_get_service):
        """Test payment capture with exception"""
        mock_get_service.side_effect = Exception("Unexpected error")

        self.client.force_authenticate(user=self.user)

        data = {
            'order_id': 'ORDER123',
            'provider': 'paypal',
            'reservation_id': self.reservation.reservation_id
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefundPaymentViewTests(APITestCase):
    """Test refund_payment view"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
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
            is_available=False
        )

        booking_status = BookingStatus.objects.get_or_create(status_name='confirmed')[0]
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

        payment_status = PaymentStatus.objects.get_or_create(status_name='completed')[0]
        self.payment = Payment.objects.create(
            booking=self.booking,
            provider='paypal',
            provider_payment_id='CAPTURE123',
            idempotency_key='idem_123',
            amount=50.00,
            currency='AUD',
            status=payment_status
        )

        self.url = f'/api/payments/{self.payment.payment_id}/refund/'

    def test_refund_payment_unauthenticated(self):
        """Test refunding payment without authentication"""
        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_refund_payment_not_owner(self):
        """Test refunding payment by non-owner"""
        self.client.force_authenticate(user=self.other_user)

        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refund_payment_invalid_status(self):
        """Test refunding payment with invalid status"""
        # Change payment status to pending
        pending_status = PaymentStatus.objects.get_or_create(status_name='pending')[0]
        self.payment.status = pending_status
        self.payment.save()

        self.client.force_authenticate(user=self.user)

        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot be refunded', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    def test_refund_payment_success(self, mock_get_service):
        """Test successful payment refund"""
        PaymentStatus.objects.get_or_create(status_name='refunded')

        mock_service = Mock()
        mock_service.refund_payment.return_value = {
            'success': True,
            'refund_id': 'REFUND123',
            'amount': Decimal('50.00'),
            'currency': 'AUD'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['refund_id'], 'REFUND123')

    @patch('app.payments.views.get_payment_service')
    def test_refund_payment_partial(self, mock_get_service):
        """Test partial payment refund"""
        PaymentStatus.objects.get_or_create(status_name='refunded')

        mock_service = Mock()
        mock_service.refund_payment.return_value = {
            'success': True,
            'refund_id': 'REFUND123',
            'amount': Decimal('25.00'),
            'currency': 'AUD'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {
            'amount': 25.00,
            'reason': 'Partial refund'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '25.00')

    @patch('app.payments.views.get_payment_service')
    def test_refund_payment_service_failure(self, mock_get_service):
        """Test refund when payment service fails"""
        mock_service = Mock()
        mock_service.refund_payment.return_value = {
            'success': False,
            'error': 'Refund failed'
        }
        mock_get_service.return_value = mock_service

        self.client.force_authenticate(user=self.user)

        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Refund failed', response.data['error'])

    @patch('app.payments.views.get_payment_service')
    def test_refund_payment_exception(self, mock_get_service):
        """Test refund with exception"""
        mock_get_service.side_effect = Exception("Unexpected error")

        self.client.force_authenticate(user=self.user)

        data = {'reason': 'Customer request'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPaymentViewTests(APITestCase):
    """Test get_payment view"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='testpass123'
        )

        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
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
            is_available=False
        )

        booking_status = BookingStatus.objects.get_or_create(status_name='confirmed')[0]
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

        payment_status = PaymentStatus.objects.get_or_create(status_name='completed')[0]
        self.payment = Payment.objects.create(
            booking=self.booking,
            provider='paypal',
            provider_payment_id='CAPTURE123',
            idempotency_key='idem_123',
            amount=50.00,
            currency='AUD',
            status=payment_status
        )

        self.url = f'/api/payments/{self.payment.payment_id}/'

    def test_get_payment_unauthenticated(self):
        """Test getting payment without authentication"""
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_payment_not_owner(self):
        """Test getting payment by non-owner"""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_payment_success(self):
        """Test successful payment retrieval"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['payment_id'], self.payment.payment_id)
        self.assertEqual(response.data['provider'], 'paypal')

    def test_get_payment_not_found(self):
        """Test getting non-existent payment"""
        self.client.force_authenticate(user=self.user)

        url = '/api/payments/99999/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
