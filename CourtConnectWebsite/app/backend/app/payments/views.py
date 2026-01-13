"""
Payment Views
Handles payment creation, capture, and refunds
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
import uuid
import logging

from app.auth.permissions import IsAuthenticated
from .models import Payment, PaymentStatus
from .serializers import (
    CreatePaymentOrderSerializer,
    CapturePaymentSerializer,
    RefundPaymentSerializer,
    PaymentSerializer
)
from .services import PayPalService
from app.bookings.models import Booking, TemporaryReservation
from app.bookings.services import ReservationService

logger = logging.getLogger(__name__)


def get_payment_service(provider: str):
    """
    Factory function to get payment service based on provider.
    Makes it easy to add new payment providers (Stripe, etc.)
    """
    if provider == 'paypal':
        return PayPalService()
    # elif provider == 'stripe':
    #     return StripeService()
    else:
        raise ValueError(f"Unsupported payment provider: {provider}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_order(request):
    """
    Create a payment order with the selected provider.
    POST /api/payments/create/

    Body:
        {
            "reservation_id": 123,
            "amount": 50.00,
            "currency": "AUD",
            "provider": "paypal",
            "return_url": "http://localhost:5173/bookings/success",
            "cancel_url": "http://localhost:5173/bookings/cancel"
        }

    Returns:
        {
            "success": true,
            "order_id": "PAYPAL-ORDER-ID",
            "approval_url": "https://paypal.com/approve?token=...",
            "provider": "paypal"
        }
    """
    logger.info(f"Payment order request from user {request.user.user_id}: {request.data}")

    serializer = CreatePaymentOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    reservation_id = serializer.validated_data['reservation_id']
    amount = serializer.validated_data['amount']
    currency = serializer.validated_data['currency']
    provider = serializer.validated_data['provider']

    logger.info(f"Creating payment for reservation {reservation_id}, amount {amount} {currency}")

    # Verify reservation exists with detailed diagnostics
    from django.utils import timezone

    # First check if reservation exists at all
    reservation_exists = TemporaryReservation.objects.filter(reservation_id=reservation_id).first()
    if not reservation_exists:
        logger.warning(f"Reservation {reservation_id} does not exist in database")
        return Response({
            'error': 'RESERVATION_NOT_FOUND',
            'detail': f'No reservation found with ID {reservation_id}. It may have been deleted or never created.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if it belongs to the current user
    if reservation_exists.user != request.user:
        logger.warning(f"Reservation {reservation_id} belongs to user {reservation_exists.user.user_id}, not {request.user.user_id}")
        return Response({
            'error': 'RESERVATION_OWNERSHIP',
            'detail': 'This reservation belongs to a different user. Please create a new reservation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    reservation = reservation_exists

    # Verify reservation hasn't expired
    if reservation.is_expired:
        logger.warning(f"Reservation {reservation_id} has expired at {reservation.expires_at}")
        return Response({
            'error': 'RESERVATION_EXPIRED',
            'detail': 'Your reservation has expired. Please select your time slots again.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get payment service for provider
        payment_service = get_payment_service(provider)

        # Create order with provider
        metadata = {
            'reservation_id': reservation_id,
            'user_id': request.user.user_id,
            'return_url': serializer.validated_data.get('return_url'),
            'cancel_url': serializer.validated_data.get('cancel_url'),
        }

        result = payment_service.create_order(
            amount=amount,
            currency=currency,
            description=f"Court Reservation #{reservation_id}",
            metadata=metadata
        )

        if result.get('success'):
            logger.info(f"Payment order created: {result['order_id']} for reservation {reservation_id}")
            return Response({
                'success': True,
                'order_id': result['order_id'],
                'approval_url': result['approval_url'],
                'provider': provider
            })
        else:
            logger.error(f"Payment order creation failed: {result.get('error')}")
            return Response({
                'error': result.get('error', 'Payment order creation failed')
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception(f"create_payment_order exception: {str(e)}")
        return Response({
            'error': 'An error occurred while creating payment order'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def capture_payment(request):
    """
    Capture/execute a payment after user approves.
    POST /api/payments/capture/

    Body:
        {
            "order_id": "PAYPAL-ORDER-ID",
            "payer_id": "PAYERID123",
            "provider": "paypal"
        }

    Returns:
        {
            "success": true,
            "payment_id": "PAY-123",
            "booking_id": 123,
            "amount": 50.00,
            "status": "completed"
        }
    """
    serializer = CapturePaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    order_id = serializer.validated_data['order_id']
    payer_id = serializer.validated_data.get('payer_id')
    provider = serializer.validated_data['provider']
    reservation_id = serializer.validated_data['reservation_id']

    logger.info(f"Capturing payment for order {order_id}, reservation {reservation_id}")

    try:
        # Get payment service
        payment_service = get_payment_service(provider)

        # Capture payment
        result = payment_service.capture_payment(
            order_id=order_id,
            idempotency_key=payer_id
        )

        if not result.get('success'):
            logger.error(f"Payment capture failed: {result.get('error')}")
            return Response({
                'error': result.get('error', 'Payment capture failed')
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Payment captured successfully: {result.get('payment_id')}")

        # Convert reservation to booking and store payment record
        with transaction.atomic():
            # Convert reservation to actual booking
            booking = ReservationService.convert_reservation_to_booking(
                reservation_id=reservation_id,
                user=request.user
            )

            # Get completed payment status
            completed_status = PaymentStatus.objects.get(status_name='completed')

            # Generate idempotency key
            idempotency_key = str(uuid.uuid4())

            # Create payment record linked to booking
            payment = Payment.objects.create(
                booking=booking,
                provider=provider,
                provider_payment_id=result['payment_id'],
                idempotency_key=idempotency_key,
                amount=result['amount'],
                currency=result['currency'],
                status=completed_status
            )

            # Update booking status to confirmed
            from app.bookings.models import BookingStatus
            confirmed_status = BookingStatus.objects.get(status_name='confirmed')
            booking.status = confirmed_status
            booking.save()

            logger.info(f"Payment captured and booking confirmed: payment={payment.payment_id}, booking={booking.booking_id}")

            return Response({
                'success': True,
                'payment_id': payment.payment_id,
                'provider_payment_id': result['payment_id'],
                'booking_id': booking.booking_id,
                'amount': str(result['amount']),
                'currency': result['currency'],
                'status': 'completed'
            })

    except ValueError as e:
        # ReservationService raises ValueError for invalid/expired reservations
        logger.error(f"Reservation conversion failed: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"capture_payment exception: {str(e)}")
        return Response({
            'error': 'An error occurred while capturing payment'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_payment(request, payment_id):
    """
    Refund a payment.
    POST /api/payments/{payment_id}/refund/

    Body:
        {
            "amount": 25.00,  // optional, for partial refund
            "reason": "Customer requested refund"
        }

    Returns:
        {
            "success": true,
            "refund_id": "REFUND-123",
            "amount": 25.00,
            "status": "completed"
        }
    """
    serializer = RefundPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Get payment record
    payment = get_object_or_404(Payment, payment_id=payment_id)

    # Verify user owns the booking
    if payment.booking.user != request.user:
        return Response({
            'error': 'You do not have permission to refund this payment'
        }, status=status.HTTP_403_FORBIDDEN)

    # Verify payment can be refunded
    if payment.status.status_name not in ['completed', 'refunded']:
        return Response({
            'error': 'Payment cannot be refunded'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get payment service
        payment_service = get_payment_service(payment.provider)

        # Process refund
        result = payment_service.refund_payment(
            payment_id=payment.provider_payment_id,
            amount=serializer.validated_data.get('amount'),
            reason=serializer.validated_data.get('reason')
        )

        if result.get('success'):
            # Update payment status
            with transaction.atomic():
                refunded_status = PaymentStatus.objects.get(status_name='refunded')
                payment.status = refunded_status
                payment.save()

            logger.info(f"Payment refunded: {payment.payment_id}")

            return Response({
                'success': True,
                'refund_id': result['refund_id'],
                'amount': str(result['amount']),
                'currency': result['currency'],
                'status': 'refunded'
            })
        else:
            return Response({
                'error': result.get('error', 'Refund failed')
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception(f"refund_payment exception: {str(e)}")
        return Response({
            'error': 'An error occurred while processing refund'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment(request, payment_id):
    """
    Get payment details.
    GET /api/payments/{payment_id}/
    """
    payment = get_object_or_404(Payment, payment_id=payment_id)

    # Verify user owns the booking
    if payment.booking.user != request.user:
        return Response({
            'error': 'You do not have permission to view this payment'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment)
    return Response(serializer.data)