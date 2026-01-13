/**
 * usePayment Hook
 * Reusable hook for payment operations
 */
import { useState, useCallback } from 'react';
import { createPaymentOrder, capturePayment } from '../../services/paymentApi';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  /**
   * Create a payment order
   */
  const createOrder = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('usePayment.createOrder called with:', paymentData);
      const id = await createPaymentOrder(paymentData);
      console.log('createPaymentOrder returned:', id);
      setOrderData(id);
      return id;
    } catch (err) {
      // Surface the backend response so you can read the real DRF error
      console.error('createPaymentOrder error:', err?.response?.status, err?.response?.data);
      const errorMessage = err.response?.data?.error || 'Failed to create payment order';
      setError(errorMessage);
      // Preserve the response on the thrown error so PayPalButton can log it
      err.message = errorMessage;
      throw err; // DO NOT replace with a new Error()
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Capture a payment
   */
  const capture = useCallback(async (captureData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await capturePayment(captureData);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to capture payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setOrderData(null);
  }, []);

  return {
    loading,
    error,
    orderData,
    createOrder,
    capture,
    reset
  };
}
