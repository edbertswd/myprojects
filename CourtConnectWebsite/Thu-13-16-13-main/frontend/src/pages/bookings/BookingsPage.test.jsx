import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BookingsPage from './BookingsPage';

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  delete: vi.fn()
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: mockApi
}));

vi.mock('../../components/bookings/BookingDetailsModal', () => ({
  __esModule: true,
  default: ({ booking, onClose }) => (
    <div data-testid="booking-modal">
      {booking.facility_name}
      <button onClick={onClose}>close</button>
    </div>
  )
}));

describe('BookingsPage', () => {
  const now = new Date('2025-01-01T00:00:00Z');

  beforeEach(() => {
    vi.setSystemTime(now);
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.delete.mockResolvedValue({});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    window.history.replaceState({}, '', '/bookings');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  function renderPage(initialEntry = '/bookings') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/bookings" element={<BookingsPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders upcoming bookings from API', async () => {
    const start = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    mockApi.get.mockResolvedValue({
      data: {
        results: [
          {
            booking_id: 1,
            facility_name: 'Central Courts',
            court_name: 'Court A',
            sport_type: 'Tennis',
            start_time: start,
            end_time: end,
            status_name: 'confirmed'
          }
        ]
      }
    });

    renderPage();

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    expect(await screen.findByText('Central Courts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /past/i }));
    expect(screen.getByText(/No past bookings/i)).toBeInTheDocument();
  });

  it('blocks cancellation if start time is within two hours', async () => {
    const start = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 90 * 60 * 1000).toISOString();

    mockApi.get.mockResolvedValue({
      data: {
        results: [
          {
            booking_id: 2,
            facility_name: 'City Arena',
            court_name: 'Court 2',
            sport_type: 'Pickleball',
            start_time: start,
            end_time: end,
            status_name: 'confirmed'
          }
        ]
      }
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('City Arena')).toBeInTheDocument());
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(cancelButton).toBeDisabled();
    fireEvent.click(cancelButton);
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it('cancels a booking when allowed and user confirms', async () => {
    const start = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();

    mockApi.get.mockResolvedValue({
      data: {
        results: [
          {
            booking_id: 3,
            facility_name: 'Harbour Courts',
            court_name: 'Court 3',
            sport_type: 'Squash',
            start_time: start,
            end_time: end,
            status_name: 'confirmed'
          }
        ]
      }
    });

    window.confirm.mockReturnValue(true);

    renderPage();

    await waitFor(() => expect(screen.getByText('Harbour Courts')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() =>
      expect(mockApi.delete).toHaveBeenCalledWith('/bookings/v1/3/cancel/')
    );
  });
});
