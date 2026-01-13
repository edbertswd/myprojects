"""
PayPal Payment Service
Handles PayPal payment operations using PayPal REST API v2
"""
import requests
from django.conf import settings
from typing import Dict, Any, Optional
from decimal import Decimal
import logging
import base64

from .payment_service import PaymentService

logger = logging.getLogger(__name__)


class PayPalService(PaymentService):
    """
    PayPal payment service implementation.
    Uses PayPal REST API v2 for order creation and payment capture.
    """

    def __init__(self):
        """Initialize PayPal API with credentials from settings"""
        self.mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
        self.client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')

        # Set base URL based on mode
        if self.mode == 'live':
            self.base_url = 'https://api-m.paypal.com'
        else:
            self.base_url = 'https://api-m.sandbox.paypal.com'

        self._access_token = None

    def _get_access_token(self) -> str:
        """Get OAuth 2.0 access token from PayPal"""
        try:
            # Create basic auth header
            auth = base64.b64encode(
                f"{self.client_id}:{self.client_secret}".encode()
            ).decode()

            headers = {
                'Authorization': f'Basic {auth}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }

            data = {'grant_type': 'client_credentials'}

            response = requests.post(
                f'{self.base_url}/v1/oauth2/token',
                headers=headers,
                data=data
            )
            response.raise_for_status()

            token_data = response.json()
            self._access_token = token_data['access_token']
            return self._access_token

        except Exception as e:
            logger.exception(f"Failed to get PayPal access token: {str(e)}")
            raise

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for PayPal API requests"""
        if not self._access_token:
            self._get_access_token()

        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self._access_token}'
        }

    def create_order(
        self,
        amount: Decimal,
        currency: str = 'AUD',
        description: str = 'Court Booking',
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a PayPal order using Orders API v2.

        Returns:
            Dict with order_id and approval_url
        """
        try:
            # Build custom_id for tracking (reservation_id)
            custom_id = str(metadata.get('reservation_id', '')) if metadata else ''

            logger.info(f"Creating PayPal order: amount={amount}, currency={currency}, reservation_id={custom_id}")

            # Create order using Orders API v2
            order_data = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount)
                    },
                    "description": description,
                    "custom_id": custom_id
                }],
                "application_context": {
                    "brand_name": "CourtConnect",
                    "locale": "en-AU",
                    "landing_page": "NO_PREFERENCE",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "PAY_NOW",
                    "return_url": metadata.get('return_url', settings.PAYPAL_RETURN_URL) if metadata else settings.PAYPAL_RETURN_URL,
                    "cancel_url": metadata.get('cancel_url', settings.PAYPAL_CANCEL_URL) if metadata else settings.PAYPAL_CANCEL_URL
                }
            }

            response = requests.post(
                f'{self.base_url}/v2/checkout/orders',
                headers=self._get_headers(),
                json=order_data
            )

            if response.status_code == 201:
                order = response.json()
                logger.info(f"PayPal order created: {order['id']}")

                # Extract approval URL
                approval_url = None
                for link in order.get('links', []):
                    if link['rel'] == 'approve':
                        approval_url = link['href']
                        break

                return {
                    'success': True,
                    'order_id': order['id'],
                    'approval_url': approval_url,
                    'status': order['status']
                }
            else:
                error_data = response.json()
                logger.error(f"PayPal order creation failed: {error_data}")
                logger.error(f"Response status: {response.status_code}")

                error_message = error_data.get('message', 'PayPal order creation failed')
                if 'details' in error_data:
                    details = error_data['details']
                    if isinstance(details, list) and len(details) > 0:
                        error_message = details[0].get('description', error_message)

                return {
                    'success': False,
                    'error': error_message
                }

        except requests.exceptions.RequestException as e:
            logger.exception(f"PayPal API request failed: {str(e)}")
            return {
                'success': False,
                'error': f'PayPal API error: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"PayPal create_order exception: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def capture_payment(
        self,
        order_id: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Capture a PayPal order after user approval using Orders API v2.

        Args:
            order_id: PayPal order ID
            idempotency_key: Payer ID from PayPal redirect (not used in v2)

        Returns:
            Dict with payment details
        """
        try:
            logger.info(f"Capturing PayPal order: {order_id}")

            # Capture the order
            response = requests.post(
                f'{self.base_url}/v2/checkout/orders/{order_id}/capture',
                headers=self._get_headers()
            )

            if response.status_code == 201:
                capture_data = response.json()
                logger.info(f"PayPal order captured: {order_id}")
                logger.info(f"Full PayPal capture response: {capture_data}")

                # Extract purchase unit and capture details
                purchase_unit = capture_data['purchase_units'][0]
                capture = purchase_unit['payments']['captures'][0]

                # Extract reservation_id from custom_id
                reservation_id = purchase_unit.get('custom_id')
                logger.info(f"Extracted custom_id from purchase_unit: {reservation_id}")

                if reservation_id:
                    try:
                        reservation_id = int(reservation_id)
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert custom_id to int: {reservation_id}")
                        reservation_id = None
                else:
                    logger.warning(f"No custom_id found in purchase_unit. Keys: {purchase_unit.keys()}")

                # Extract payer email
                payer_email = capture_data.get('payer', {}).get('email_address')

                return {
                    'success': True,
                    'payment_id': capture['id'],
                    'order_id': order_id,
                    'status': capture['status'],
                    'amount': Decimal(capture['amount']['value']),
                    'currency': capture['amount']['currency_code'],
                    'reservation_id': reservation_id,
                    'payer_email': payer_email,
                    'create_time': capture.get('create_time'),
                    'update_time': capture.get('update_time')
                }
            else:
                error_data = response.json()
                logger.error(f"PayPal order capture failed: {error_data}")
                logger.error(f"Response status: {response.status_code}")

                error_message = error_data.get('message', 'Payment capture failed')
                if 'details' in error_data:
                    details = error_data['details']
                    if isinstance(details, list) and len(details) > 0:
                        error_message = details[0].get('description', error_message)

                return {
                    'success': False,
                    'error': error_message
                }

        except requests.exceptions.RequestException as e:
            logger.exception(f"PayPal API request failed: {str(e)}")
            return {
                'success': False,
                'error': f'PayPal API error: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"PayPal capture_payment exception: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def refund_payment(
        self,
        payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refund a PayPal capture using Payments API v2.

        Args:
            payment_id: PayPal capture ID
            amount: Partial refund amount (None for full refund)
            reason: Refund reason

        Returns:
            Dict with refund details
        """
        try:
            logger.info(f"Refunding PayPal capture: {payment_id}")

            # Build refund request
            refund_request = {}
            if amount is not None:
                refund_request['amount'] = {
                    'value': str(amount),
                    'currency_code': 'AUD'  # TODO: Get from original capture
                }
            if reason:
                refund_request['note_to_payer'] = reason

            response = requests.post(
                f'{self.base_url}/v2/payments/captures/{payment_id}/refund',
                headers=self._get_headers(),
                json=refund_request if refund_request else None
            )

            if response.status_code == 201:
                refund_data = response.json()
                logger.info(f"PayPal refund created: {refund_data['id']}")

                return {
                    'success': True,
                    'refund_id': refund_data['id'],
                    'status': refund_data['status'],
                    'amount': Decimal(refund_data['amount']['value']),
                    'currency': refund_data['amount']['currency_code'],
                    'create_time': refund_data.get('create_time')
                }
            else:
                error_data = response.json()
                logger.error(f"PayPal refund failed: {error_data}")
                logger.error(f"Response status: {response.status_code}")

                error_message = error_data.get('message', 'Refund failed')
                if 'details' in error_data:
                    details = error_data['details']
                    if isinstance(details, list) and len(details) > 0:
                        error_message = details[0].get('description', error_message)

                return {
                    'success': False,
                    'error': error_message
                }

        except requests.exceptions.RequestException as e:
            logger.exception(f"PayPal API request failed: {str(e)}")
            return {
                'success': False,
                'error': f'PayPal API error: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"PayPal refund_payment exception: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """
        Get PayPal capture details using Payments API v2.

        Args:
            payment_id: PayPal capture ID

        Returns:
            Dict with payment details
        """
        try:
            response = requests.get(
                f'{self.base_url}/v2/payments/captures/{payment_id}',
                headers=self._get_headers()
            )

            if response.status_code == 200:
                capture_data = response.json()

                return {
                    'success': True,
                    'payment_id': capture_data['id'],
                    'status': capture_data['status'],
                    'amount': Decimal(capture_data['amount']['value']),
                    'currency': capture_data['amount']['currency_code'],
                    'create_time': capture_data.get('create_time'),
                    'update_time': capture_data.get('update_time')
                }
            else:
                error_data = response.json()
                logger.error(f"Failed to get payment details: {error_data}")

                return {
                    'success': False,
                    'error': error_data.get('message', 'Failed to get payment details')
                }

        except requests.exceptions.RequestException as e:
            logger.exception(f"PayPal API request failed: {str(e)}")
            return {
                'success': False,
                'error': f'PayPal API error: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"PayPal get_payment_details exception: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def verify_webhook(self, headers: Dict[str, str], body: str) -> bool:
        """
        Verify PayPal webhook signature.

        Args:
            headers: HTTP headers from webhook
            body: Raw request body

        Returns:
            True if webhook is valid
        """
        # TODO: Implement PayPal webhook verification
        # This requires webhook_id from PayPal dashboard
        logger.warning("PayPal webhook verification not implemented")
        return True
