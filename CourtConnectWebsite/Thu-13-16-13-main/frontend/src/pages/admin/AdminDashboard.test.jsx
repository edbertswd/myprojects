import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

vi.mock('../../services/adminApi', () => ({
  getDashboardOverview: vi.fn(),
  getPlatformHealth: vi.fn()
}));

const { getDashboardOverview, getPlatformHealth } = await import('../../services/adminApi');

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    console.error.mockRestore();
  });

  function renderDashboard() {
    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders quick action counts from overview data', async () => {
    getDashboardOverview.mockResolvedValue({
      data: {
        pending_actions: {
          total_pending: 3,
          facility_approvals: 1,
          manager_requests: 2,
          refund_requests: 0,
          open_reports: 4
        },
        users: { total: 1234, new_this_week: 25, active: 1100, suspended: 50, unverified: 84 },
        managers: { total: 40, active: 35, suspended: 5 },
        facilities: { total: 60, active: 50, pending_approval: 5, suspended: 5 },
        bookings: { total: 3000, today: 120, this_week: 650, this_month: 2100 },
        revenue: { today: 4500, this_month: 98000, commission_this_month: 22000 },
        recent_admin_activity: []
      }
    });
    getPlatformHealth.mockResolvedValue({
      data: {
        growth_rates: { users: 6, bookings: -3, revenue: 4 }
      }
    });

    renderDashboard();

    await waitFor(() => expect(getDashboardOverview).toHaveBeenCalled());
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Manage Facilities/ })).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Manager Requests/ })).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: /Open Reports/ })).toHaveTextContent('4');
    expect(screen.getByRole('link', { name: /User Moderation/ })).toHaveTextContent('1,234');
  });

  it('shows error state while keeping quick action shortcuts', async () => {
    getDashboardOverview.mockRejectedValue(new Error('failed'));
    getPlatformHealth.mockResolvedValue({
      data: {
        growth_rates: { users: 0, bookings: 0, revenue: 0 }
      }
    });

    renderDashboard();

    await waitFor(() => expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Approve Facilities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Approve Managers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /User Moderation/i })).toBeInTheDocument();
  });
});
