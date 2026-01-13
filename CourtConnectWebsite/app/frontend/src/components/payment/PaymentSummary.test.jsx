import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentSummary from './PaymentSummary';

describe('PaymentSummary', () => {
  it('renders line items and optional sections', () => {
    render(
      <PaymentSummary
        items={[
          { label: 'Court Hire', amount: 120 },
          { label: 'Lighting', amount: 30.5 }
        ]}
        subtotal={150.5}
        discount={10}
        tax={5.25}
        fee={2.5}
        total={148.25}
        currency="AUD"
      />
    );

    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Court Hire')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('Lighting')).toBeInTheDocument();
    expect(screen.getByText('$30.50')).toBeInTheDocument();

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    expect(screen.getByText('-$10.00')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('$5.25')).toBeInTheDocument();
    expect(screen.getByText('Booking Fee')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText(/Total \(AUD\)/)).toBeInTheDocument();
    expect(screen.getByText('$148.25')).toBeInTheDocument();
  });

  it('omits optional rows when values are zero or missing', () => {
    render(
      <PaymentSummary
        items={[]}
        subtotal={0}
        discount={0}
        tax={0}
        fee={0}
        total={0}
        currency="USD"
      />
    );

    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Booking Fee/)).not.toBeInTheDocument();
    expect(screen.getByText(/Total \(USD\)/)).toBeInTheDocument();
  });
});
