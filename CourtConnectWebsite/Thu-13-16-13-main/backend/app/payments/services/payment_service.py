"""
Abstract Payment Service
Base class for all payment provider implementations
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal


class PaymentService(ABC):
    """
    Abstract base class for payment services.
    All payment providers (PayPal, Stripe, etc.) should inherit from this class.
    """

    @abstractmethod
    def create_order(
        self,
        amount: Decimal,
        currency: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a payment order with the provider.

        Args:
            amount: Payment amount
            currency: Currency code (e.g., 'AUD', 'USD')
            description: Payment description
            metadata: Additional metadata (booking_id, user_id, etc.)

        Returns:
            Dict containing order_id and approval_url
        """
        pass

    @abstractmethod
    def capture_payment(
        self,
        order_id: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Capture/complete a payment after user approval.

        Args:
            order_id: Provider's order ID
            idempotency_key: Unique key to prevent duplicate captures

        Returns:
            Dict containing payment details (payment_id, status, amount, etc.)
        """
        pass

    @abstractmethod
    def refund_payment(
        self,
        payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refund a captured payment.

        Args:
            payment_id: Provider's payment ID
            amount: Refund amount (None for full refund)
            reason: Refund reason

        Returns:
            Dict containing refund details
        """
        pass

    @abstractmethod
    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment details from provider.

        Args:
            payment_id: Provider's payment ID

        Returns:
            Dict containing payment details
        """
        pass

    @abstractmethod
    def verify_webhook(self, headers: Dict[str, str], body: str) -> bool:
        """
        Verify webhook signature from payment provider.

        Args:
            headers: HTTP headers from webhook request
            body: Raw request body

        Returns:
            True if webhook is valid
        """
        pass
