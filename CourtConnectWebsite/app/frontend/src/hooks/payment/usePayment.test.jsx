import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePayment } from './usePayment';

const createPaymentOrderMock = vi.fn();
const capturePaymentMock = vi.fn();

vi.mock('../../services/paymentApi', () => ({
  createPaymentOrder: (...args) => createPaymentOrderMock(...args),
  capturePayment: (...args) => capturePaymentMock(...args)
}));

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an order successfully and stores order id', async () => {
    createPaymentOrderMock.mockResolvedValue('ORDER-123');

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      const id = await result.current.createOrder({ amount: 100 });
      expect(id).toBe('ORDER-123');
    });

    expect(createPaymentOrderMock).toHaveBeenCalledWith({ amount: 100 });
    expect(result.current.orderData).toBe('ORDER-123');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('surfaces errors from createOrder and keeps original error instance', async () => {
    const err = new Error('backend');
    err.response = { data: { error: 'Failed to reserve slot' } };
    createPaymentOrderMock.mockRejectedValue(err);

    const { result } = renderHook(() => usePayment());

    let thrown;
    await act(async () => {
      try {
        await result.current.createOrder({ amount: 50 });
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBe(err);

    expect(result.current.error).toBe('Failed to reserve slot');
    expect(result.current.orderData).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('captures payment successfully', async () => {
    capturePaymentMock.mockResolvedValue({ status: 'captured' });

    const { result } = renderHook(() => usePayment());

    let captureResponse;
    await act(async () => {
      captureResponse = await result.current.capture({ order_id: 'ORDER' });
    });

    expect(capturePaymentMock).toHaveBeenCalledWith({ order_id: 'ORDER' });
    expect(captureResponse).toEqual({ status: 'captured' });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles capture errors and throws with transformed message', async () => {
    const error = new Error('capture failed');
    error.response = { data: { error: 'Payment already captured' } };
    capturePaymentMock.mockRejectedValue(error);

    const { result } = renderHook(() => usePayment());

    let thrown;
    await act(async () => {
      try {
        await result.current.capture({ order_id: 'ORDER' });
      } catch (err) {
        thrown = err;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toBe('Payment already captured');

    expect(result.current.error).toBe('Payment already captured');
    expect(result.current.loading).toBe(false);
  });

  it('resets state', async () => {
    createPaymentOrderMock.mockResolvedValue('ORDER-321');

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.createOrder({ amount: 20 });
      result.current.reset();
    });

    expect(result.current.orderData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
