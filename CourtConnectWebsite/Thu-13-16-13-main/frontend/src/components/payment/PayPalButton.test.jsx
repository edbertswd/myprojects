import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PayPalButton from './PayPalButton';

const mockCreateOrder = vi.fn();
const mockOnApprove = vi.fn();
const mockOnError = vi.fn();
const mockOnCancel = vi.fn();

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalButtons: (props) => (
    <div>
      <button
        data-testid="paypal-create"
        onClick={() => props.createOrder?.({ mock: 'data' }, { mock: 'actions' })}
      >
        create-order
      </button>
      <button
        data-testid="paypal-approve"
        onClick={() =>
          props.onApprove?.(
            { orderID: 'ORDER123', payerID: 'PAYER456' },
            { order: { capture: vi.fn() } }
          )
        }
      >
        approve
      </button>
      <button data-testid="paypal-cancel" onClick={() => props.onCancel?.({ reason: 'cancelled' })}>
        cancel
      </button>
      <button data-testid="paypal-error" onClick={() => props.onError?.(new Error('boom'))}>
        error
      </button>
    </div>
  )
}));

describe('PayPalButton', () => {
  it('passes amount/currency to createOrder handler', async () => {
    mockCreateOrder.mockResolvedValue('ORDER-ID');

    const { getByTestId } = render(
      <PayPalButton
        amount={42}
        currency="USD"
        onCreateOrder={mockCreateOrder}
        onApprove={mockOnApprove}
        onError={mockOnError}
        onCancel={mockOnCancel}
      />
    );

    await fireEvent.click(getByTestId('paypal-create'));

    expect(mockCreateOrder).toHaveBeenCalledWith({
      amount: 42,
      currency: 'USD',
      data: { mock: 'data' },
      actions: { mock: 'actions' }
    });
  });

  it('propagates approve/cancel/error callbacks', async () => {
    const { getByTestId } = render(
      <PayPalButton
        amount={10}
        currency="AUD"
        onCreateOrder={mockCreateOrder}
        onApprove={mockOnApprove}
        onError={mockOnError}
        onCancel={mockOnCancel}
      />
    );

    await fireEvent.click(getByTestId('paypal-approve'));
    expect(mockOnApprove).toHaveBeenCalledWith(
      expect.objectContaining({
        orderID: 'ORDER123',
        payerID: 'PAYER456',
        amount: 10,
        currency: 'AUD'
      })
    );

    await fireEvent.click(getByTestId('paypal-cancel'));
    expect(mockOnCancel).toHaveBeenCalledWith({ reason: 'cancelled' });

    await fireEvent.click(getByTestId('paypal-error'));
    expect(mockOnError).toHaveBeenCalled();
  });
});
