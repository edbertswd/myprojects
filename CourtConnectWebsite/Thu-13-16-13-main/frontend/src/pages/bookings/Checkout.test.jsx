import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Checkout from './Checkout';

const { mockCreateOrder, mockCapture, mockGetReservation, mockCancelReservation } = vi.hoisted(() => ({
  mockCreateOrder: vi.fn(),
  mockCapture: vi.fn(),
  mockGetReservation: vi.fn(),
  mockCancelReservation: vi.fn()
}));

vi.mock('../../hooks/payment/usePayment', () => ({
  usePayment: () => ({
    createOrder: mockCreateOrder,
    capture: mockCapture,
    loading: false
  })
}));

vi.mock('../../services/bookingApi', () => ({
  getReservation: mockGetReservation,
  cancelReservation: mockCancelReservation
}));

vi.mock('../../components/payment/PayPalButton', () => ({
  __esModule: true,
  default: ({ onCreateOrder }) => (
    <button data-testid="mock-paypal" onClick={onCreateOrder}>
      pay
    </button>
  )
}));

vi.mock('../../components/payment/PaymentSummary', () => ({
  __esModule: true,
  default: ({ total, tax, fee }) => (
    <div data-testid="summary">
      total:{total} tax:{tax} fee:{fee}
    </div>
  )
}));

describe('Checkout page', () => {
  beforeEach(() => {
    mockCreateOrder.mockResolvedValue('ORDER123');
    mockCapture.mockResolvedValue({ booking_id: 'b1', payment_id: 'p1' });
    mockGetReservation.mockResolvedValue({
      reservation_id: 'res-1',
      time_remaining_seconds: 600
    });
    mockCancelReservation.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows fallback when selection is missing', () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/No selection found/i)).toBeInTheDocument();
    expect(mockGetReservation).not.toHaveBeenCalled();
  });

  it('fetches reservation and renders summary when selection exists', async () => {
    const selection = {
      reservationId: 'res-1',
      facilityId: 10,
      price: 20,
      totalHours: 2,
      court: 'Court 1',
      sport: 'Tennis'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/checkout', state: selection }]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGetReservation).toHaveBeenCalledWith('res-1'));
    expect(screen.getByTestId('summary')).toHaveTextContent('total:46.5');

    fireEvent.click(screen.getByTestId('mock-paypal'));
    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalled());
  });
});
