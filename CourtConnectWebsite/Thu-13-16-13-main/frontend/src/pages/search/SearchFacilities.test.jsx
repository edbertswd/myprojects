import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../hooks/useSportTypes', () => ({
  useSportTypes: vi.fn()
}));

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(),
  calculateDistance: vi.fn(() => 12)
}));

vi.mock('react-range', () => ({
  Range: ({ values, onChange }) => (
    <div
      role="slider"
      aria-valuemin={values[0]}
      aria-valuemax={values[1]}
      onClick={() => onChange(values)}
    />
  )
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() }
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchFacilities from './SearchFacilities';
import { useSportTypes } from '../../hooks/useSportTypes';
import { useGeolocation } from '../../hooks/useGeolocation';
import api from '../../services/api';

const useSportTypesMock = useSportTypes;
const useGeolocationMock = useGeolocation;
const apiGetMock = api.get;

describe('SearchFacilities', () => {
  const baseResponse = {
    data: {
      results: [
        {
          facility_id: 1,
          facility_name: 'Ace Courts',
          address: 'Sydney',
          min_price: 50,
          average_rating: 4.5,
          review_count: 10,
          sports: ['Tennis']
        },
        {
          facility_id: 2,
          facility_name: 'Hoops Center',
          address: 'Melbourne',
          min_price: 40,
          average_rating: 4.2,
          review_count: 5,
          sports: ['Basketball']
        }
      ],
      count: 2,
      next: null
    }
  };

  let requestLocationMock;

  beforeEach(() => {
    vi.clearAllMocks();
    requestLocationMock = vi.fn();
    useSportTypesMock.mockReturnValue({
      data: [
        { sport_type_id: 1, sport_name: 'Tennis' },
        { sport_type_id: 2, sport_name: 'Basketball' }
      ]
    });
    useGeolocationMock.mockReturnValue({
      coordinates: null,
      error: null,
      loading: false,
      requestLocation: requestLocationMock,
      permissionStatus: 'prompt',
      isSupported: true
    });
    apiGetMock.mockResolvedValue(baseResponse);
  });

  it('renders facilities and filters by sport selection', async () => {
    render(<SearchFacilities />);

    await screen.findByText('Ace Courts');
    expect(screen.getByText('Hoops Center')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share Location' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Basketball' }));

    await waitFor(() =>
      expect(screen.queryByText('Ace Courts')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Hoops Center')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 facilities')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Share Location' }));
    expect(requestLocationMock).toHaveBeenCalled();
  });

  it('shows empty state when keyword filter trims results', async () => {
    render(<SearchFacilities />);

    await screen.findByText('Ace Courts');

    const searchInput = screen.getByPlaceholderText('Search by venue name or area…');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await screen.findByText('No facilities match your filters.');
    expect(screen.queryByText('Ace Courts')).not.toBeInTheDocument();
    expect(screen.queryByText('Hoops Center')).not.toBeInTheDocument();
  });
});
