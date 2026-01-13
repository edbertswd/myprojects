/**
 * Payment API Service
 * Reusable API functions for payment operations
 */
import api from './api';

/**
 * Create a payment order
 * @param {Object} orderData - Order data
 * @param {number} orderData.reservation_id - Reservation ID
 * @param {number} orderData.amount - Payment amount
 * @param {string} orderData.currency - Currency code (default: 'AUD')
 * @param {string} orderData.provider - Payment provider ('paypal' or 'stripe')
 * @param {string} orderData.return_url - Success redirect URL
 * @param {string} orderData.cancel_url - Cancel redirect URL
 * @returns {Promise<string|Object>} PayPal: returns order_id string; others: full response
 */
export async function createPaymentOrder(orderData) {
  try {
    const payload = {
      reservation_id: orderData.reservation_id ?? orderData.reservationId,
      amount: orderData.amount,
      currency: orderData.currency ?? 'AUD',
      provider: orderData.provider ?? 'paypal',
      return_url: orderData.return_url ?? orderData.returnUrl,
      cancel_url: orderData.cancel_url ?? orderData.cancelUrl,
    };

    const res = await api.post('/payments/create/', payload);

    // Expect { id: "<paypalOrderId>" } or { orderId: "..." } or { order_id: "..." }
    const id = res?.data?.id || res?.data?.orderId || res?.data?.order_id;
    if (!id || typeof id !== 'string') {
      console.error('Unexpected create-order response:', res?.data);
      // Attach response for upstream logs
      const e = new Error('Create order response missing id');
      e.response = { status: 200, data: res?.data };
      throw e;
    }
    return id;
  } catch (err) {
    console.error('API /payments/create/ failed:', err?.response?.status, err?.response?.data);
    throw err; // preserve for caller
  }
}

/**
 * Capture a payment after user approval
 * @param {Object} captureData - Capture data
 * @param {string} captureData.order_id - Provider's order ID
 * @param {string} captureData.payer_id - Payer ID from provider
 * @param {string} captureData.provider - Payment provider
 * @returns {Promise<Object>} Payment details
 */
export async function capturePayment(captureData) {
  const response = await api.post('/payments/capture/', captureData);
  return response.data;
}

/**
 * Get payment details
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function getPayment(paymentId) {
  const response = await api.get(`/payments/${paymentId}/`);
  return response.data;
}

/**
 * Refund a payment
 * @param {number} paymentId - Payment ID
 * @param {Object} refundData - Refund data
 * @param {number} refundData.amount - Partial refund amount (optional)
 * @param {string} refundData.reason - Refund reason (optional)
 * @returns {Promise<Object>} Refund details
 */
export async function refundPayment(paymentId, refundData = {}) {
  const response = await api.post(`/payments/${paymentId}/refund/`, refundData);
  return response.data;
}
