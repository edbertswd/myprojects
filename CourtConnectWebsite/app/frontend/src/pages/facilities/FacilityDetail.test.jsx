import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() }
}));

vi.mock('../../services/reviewApi', () => ({
  getFacilityReviews: vi.fn()
}));

import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import FacilityDetail from './FacilityDetail';
import api from '../../services/api';
import { getFacilityReviews } from '../../services/reviewApi';

const apiGetMock = api.get;
const getFacilityReviewsMock = getFacilityReviews;

describe('FacilityDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupRender = (initialPath = '/facility/1') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/facility/:id" element={<FacilityDetail />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders facility information and courts', async () => {
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          facility_id: 1,
          facility_name: 'Ace Arena',
          address: '123 Court St',
          timezone: 'Australia/Sydney',
          is_active: true,
          review_count: 2,
          average_rating: 4.6
        }
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            court_name: 'Court A',
            sport_name: 'Tennis',
            sport_type: 1,
            hourly_rate: 45
          },
          {
            id: 11,
            court_name: 'Court B',
            sport_name: 'Pickleball',
            sport_type: 2,
            hourly_rate: 35
          }
        ]
      });
    getFacilityReviewsMock.mockResolvedValue([
      { review_id: 1, rating: 5, comment: 'Great!' }
    ]);

    setupRender();

    await screen.findByRole('heading', { level: 1, name: 'Ace Arena' });
    expect(screen.getByText('Australia/Sydney')).toBeInTheDocument();
    expect(screen.getByText('Tennis')).toBeInTheDocument();
    expect(screen.getByText('Pickleball')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book Tennis' })).toBeInTheDocument();
  });

  it('displays error message when facility fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiGetMock.mockRejectedValueOnce(new Error('not found'));

    setupRender();

    await screen.findByText('Failed to load facility details');
    expect(screen.getByRole('button', { name: 'Back to Facilities' })).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
