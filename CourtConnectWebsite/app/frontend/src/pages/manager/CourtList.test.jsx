import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CourtsList from './CourtList';

const useCourtsListMock = vi.hoisted(() => vi.fn());
const useRateMock = vi.hoisted(() => vi.fn());
const getManagerFacilityMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useCourts', () => ({
  useCourtsList: useCourtsListMock
}));

vi.mock('../../hooks/useRates', () => ({
  useRate: useRateMock
}));

vi.mock('../../services/managerApi', () => ({
  getManagerFacility: getManagerFacilityMock
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

function renderCourts(path = '/manager/facility/1/courts') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/manager/facility/:facilityId/courts" element={<CourtsList />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CourtsList', () => {
  beforeEach(() => {
    useRateMock.mockReturnValue({
      data: { ratePerHour: 35 },
      isLoading: false,
      isError: false
    });
    getManagerFacilityMock.mockResolvedValue({ facility_name: 'Downtown Arena' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders courts with pagination', async () => {
    useCourtsListMock.mockReturnValue({
      data: {
        results: [
          { id: 1, name: 'Court A', sport: 'Tennis', status: 'active' }
        ],
        total: 5
      },
      isLoading: false
    });

    renderCourts();

    await waitFor(() => expect(getManagerFacilityMock).toHaveBeenCalledWith('1'));
    expect(await screen.findByText(/Courts — Downtown Arena/)).toBeInTheDocument();
    expect(screen.getByText('Court A')).toBeInTheDocument();
    expect(screen.getByText('$35.00')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 \/ 1/)).toBeInTheDocument();
  });

  it('disables create button when limit reached', async () => {
    useCourtsListMock.mockReturnValue({
      data: {
        results: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Court ${i + 1}`, sport: 'Tennis', status: 'active' })),
        total: 25
      },
      isLoading: false
    });

    renderCourts();

    const createLink = await screen.findByText(/Create court/i);
    expect(createLink).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows empty state when no courts exist', async () => {
    useCourtsListMock.mockReturnValue({
      data: { results: [], total: 0 },
      isLoading: false
    });

    renderCourts();

    expect(await screen.findByText(/No courts yet/i)).toBeInTheDocument();
  });

  it('shows query empty state with clear action', async () => {
    useCourtsListMock.mockReturnValue({
      data: { results: [], total: 0 },
      isLoading: false
    });

    renderCourts('/manager/facility/1/courts?q=tennis');

    expect(await screen.findByText(/No matches for “tennis”/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Clear search/i }));
    await waitFor(() => expect(screen.getByText(/No courts yet/i)).toBeInTheDocument());
  });

  it('renders rate placeholders while loading and error', async () => {
    useCourtsListMock.mockReturnValue({
      data: {
        results: [
          { id: 1, name: 'Court A', sport: 'Tennis', status: 'active' },
          { id: 2, name: 'Court B', sport: 'Tennis', status: 'inactive' }
        ],
        total: 2
      },
      isLoading: false
    });

    useRateMock.mockImplementation(({ courtId }) => {
      if (courtId === '1') return { data: null, isLoading: true, isError: false };
      if (courtId === '2') return { data: null, isLoading: false, isError: true };
      return {
        data: { ratePerHour: 35 },
        isLoading: false,
        isError: false
      };
    });

    renderCourts();

    expect(await screen.findByText('Court A')).toBeInTheDocument();
    expect(await screen.findByText('…')).toBeInTheDocument();
    expect(await screen.findByText('—')).toBeInTheDocument();
  });
});
