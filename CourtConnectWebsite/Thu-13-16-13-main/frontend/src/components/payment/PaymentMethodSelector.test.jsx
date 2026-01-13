import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PaymentMethodSelector from './PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  it('renders available methods and triggers onChange', () => {
    const handleChange = vi.fn();

    render(
      <PaymentMethodSelector
        selectedMethod="paypal"
        onChange={handleChange}
        availableMethods={['paypal', 'stripe']}
      />
    );

    expect(screen.getByText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /paypal/i })).toBeChecked();

    const stripeRadio = screen.getByRole('radio', { name: /stripe/i });
    fireEvent.click(stripeRadio);

    expect(handleChange).toHaveBeenCalledWith('stripe');
  });
});
