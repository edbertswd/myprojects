import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ChooseTimeslot from './ChooseTimeslot';

const mockApi = vi.hoisted(() => ({
  get: vi.fn()
}));

const mockCreateReservation = vi.hoisted(() => vi.fn());

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: mockApi
}));

vi.mock('../../services/bookingApi', () => ({
  createReservation: mockCreateReservation
}));

vi.mock('../../utils/datetime', async () => {
  const actual = await vi.importActual('../../utils/datetime');
  return {
    ...actual,
    detectUserTimezone: vi.fn(() => 'Australia/Sydney')
  };
});

describe('ChooseTimeslot', () => {
  const now = new Date('2025-01-01T00:00:00Z');

  beforeEach(() => {
    vi.setSystemTime(now);
    mockApi.get.mockReset();
    mockCreateReservation.mockReset();
    mockApi.get.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderWithRoute(entry) {
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/choose" element={<ChooseTimeslot />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('requires a facility selection', async () => {
    renderWithRoute('/choose');

    await waitFor(() =>
      expect(screen.getByText(/No facility selected/i)).toBeInTheDocument()
    );
  });

  it('loads availability, allows selection, and creates reservation', async () => {
    const facilityId = '123';
    const courtId = 10;
    const start = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    mockApi.get.mockImplementation((url) => {
      if (url === `/facilities/${facilityId}/`) {
        return Promise.resolve({
          data: {
            facility_name: 'Arena 123',
            address: '123 Example Rd'
          }
        });
      }
      if (url === `/facilities/${facilityId}/courts/`) {
        return Promise.resolve({
          data: [
            {
              court_id: courtId,
              name: 'Court 1',
              sport_name: 'Tennis',
              hourly_rate: 30,
              facility: facilityId
            }
          ]
        });
      }
      if (url === `/facilities/courts/${courtId}/availability/`) {
        return Promise.resolve({
          data: [
            {
              availability_id: 'slot-1',
              start_time: start,
              end_time: end,
              is_available: true
            }
          ]
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockCreateReservation.mockResolvedValue({
      reservation_id: 'RES-123',
      expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    });

    renderWithRoute(`/choose?facility=${facilityId}`);

    await waitFor(() =>
      expect(screen.getByText(/Book at Arena 123/i)).toBeInTheDocument()
    );

    const availableCell = await screen.findByRole('button', {
      name: /Court 1 at/i
    });

    fireEvent.click(availableCell);

    const confirmButton = screen.getByRole('button', { name: /Continue to Checkout/i });
    expect(confirmButton).toBeEnabled();

    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(mockCreateReservation).toHaveBeenCalledWith(['slot-1'])
    );
  });
});
