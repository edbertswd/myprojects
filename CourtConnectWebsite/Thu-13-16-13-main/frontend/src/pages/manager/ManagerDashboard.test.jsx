import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManagerDashboard from './ManagerDashboard';

const useManagerOverviewMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useManager', () => ({
  useManagerOverview: useManagerOverviewMock
}));

function renderDashboard(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/manager${search}`]}>
      <Routes>
        <Route path="/manager" element={<ManagerDashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-01-01T09:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator', () => {
    useManagerOverviewMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    renderDashboard();

    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard metrics and facilities', async () => {
    useManagerOverviewMock.mockReturnValue({
      data: {
        today_count: 3,
        next7d_count: 12,
        facilities: [
          { id: 10, name: 'Arena One' },
          { id: 11, name: 'Court Hub' }
        ],
        total_revenue: '750.50',
        commission_rate: '12.5',
        net_revenue: '650.40',
        commission_collected: '100.10',
        last_updated: '2025-01-01T08:00:00Z'
      },
      isLoading: false,
      error: null
    });

    renderDashboard('?facilityId=10');

    const todayCard = screen.getByText('Bookings Today').parentElement;
    expect(todayCard).toHaveTextContent('3');

    const nextCard = screen.getByText('Bookings Next 7 Days').parentElement;
    expect(nextCard).toHaveTextContent('12');

    expect(screen.getByText(/\$750\.50/)).toBeInTheDocument();
    await waitFor(() =>
      expect(document.body.textContent).toContain('Facility #10')
    );
    expect(screen.getByText('Arena One')).toBeInTheDocument();
    expect(screen.getByText('Court Hub')).toBeInTheDocument();
  });

  it('renders error notice', () => {
    useManagerOverviewMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Boom')
    });

    renderDashboard();

    expect(screen.getByText(/Error loading dashboard/i)).toHaveTextContent('Boom');
  });
});
