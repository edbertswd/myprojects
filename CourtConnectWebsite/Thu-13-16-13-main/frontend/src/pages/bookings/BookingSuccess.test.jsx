import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import BookingSuccess from './BookingSuccess';

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  getPayment: vi.fn()
}));

vi.mock('../../hooks/payment/usePayment', () => ({
  usePayment: () => ({
    capture: mocks.capture
  })
}));

vi.mock('../../services/paymentApi', () => ({
  getPayment: mocks.getPayment
}));

vi.mock('../../components/payment/PaymentSummary', () => ({
  __esModule: true,
  default: ({ total, tax, fee }) => (
    <div data-testid="summary">
      total:{total} tax:{tax} fee:{fee}
    </div>
  )
}));

describe('BookingSuccess', () => {
  beforeEach(() => {
    mocks.capture.mockReset();
    mocks.getPayment.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderWithSearch(search) {
    return render(
      <MemoryRouter initialEntries={[`/bookings/success${search}`]}>
        <Routes>
          <Route path="/bookings/success" element={<BookingSuccess />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows error when required params are missing', async () => {
    renderWithSearch('?token=abc');

    await waitFor(() =>
      expect(screen.getByText(/Missing payment information/i)).toBeInTheDocument()
    );
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it('displays capture error message', async () => {
    mocks.capture.mockRejectedValue(new Error('capture failed'));

    renderWithSearch('?token=abc&PayerID=xyz');

    await waitFor(() =>
      expect(screen.getByText(/capture failed/i)).toBeInTheDocument()
    );
  });

  it('renders booking details on success', async () => {
    mocks.capture.mockResolvedValue({
      booking_id: 'BKG1',
      payment_id: 'PAY1',
      amount: '55.5',
      currency: 'AUD',
      status: 'confirmed'
    });
    mocks.getPayment.mockResolvedValue({ provider: 'paypal' });

    renderWithSearch('?token=abc&PayerID=xyz');

    await waitFor(() =>
      expect(screen.getByText(/Booking Confirmed/i)).toBeInTheDocument()
    );
    expect(screen.getByText('#BKG1')).toBeInTheDocument();
    expect(screen.getByText(/PAY1/)).toBeInTheDocument();
    expect(mocks.getPayment).toHaveBeenCalledWith('PAY1');
  });
});
