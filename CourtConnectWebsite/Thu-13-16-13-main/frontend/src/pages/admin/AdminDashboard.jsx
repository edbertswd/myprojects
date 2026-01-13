// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardOverview, getPlatformHealth } from '../../services/adminApi';

/**
 * Comprehensive Admin Dashboard
 * Displays platform metrics, user statistics, pending actions, and quick navigation
 */
function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [platformHealth, setPlatformHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, healthData] = await Promise.all([
          getDashboardOverview(),
          getPlatformHealth(),
        ]);
        setOverview(overviewData.data);
        setPlatformHealth(healthData.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err?.error?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-2">
            Moderate content, manage approvals, and view system reports.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
        {/* Show quick actions even if stats fail */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/facilities/approve"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Approve Facilities</div>
            <div className="text-sm text-gray-600 mt-1">
              Review and approve pending courts
            </div>
          </Link>

          <Link
            to="/admin/managers/approve"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Approve Managers</div>
            <div className="text-sm text-gray-600 mt-1">
              Review pending manager applications
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">User Moderation</div>
            <div className="text-sm text-gray-600 mt-1">
              View users, suspend violators
            </div>
          </Link>

          <Link
            to="/admin/audit-log"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Audit Log</div>
            <div className="text-sm text-gray-600 mt-1">
              Actions, reasons, metadata
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">System Reports</div>
            <div className="text-sm text-gray-600 mt-1">
              Health, user activity, exports
            </div>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">
          Platform statistics, key metrics, and admin tools
        </p>
      </header>

      {/* Pending Actions Alert */}
      {overview?.pending_actions?.total_pending > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-orange-900">
                {overview.pending_actions.total_pending} pending actions require attention
              </span>
              <div className="text-sm text-orange-700 mt-1">
                {overview.pending_actions.facility_approvals > 0 && `${overview.pending_actions.facility_approvals} facility approvals, `}
                {overview.pending_actions.manager_requests > 0 && `${overview.pending_actions.manager_requests} manager requests, `}
                {overview.pending_actions.refund_requests > 0 && `${overview.pending_actions.refund_requests} refund requests, `}
                {overview.pending_actions.open_reports > 0 && `${overview.pending_actions.open_reports} open reports`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Stats */}
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-semibold">{overview?.users?.total.toLocaleString()}</div>
            <div className="text-sm text-green-600">+{overview?.users?.new_this_week} this week</div>
          </div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>Active: {overview?.users?.active.toLocaleString()}</div>
            <div>Suspended: {overview?.users?.suspended.toLocaleString()}</div>
            <div>Unverified: {overview?.users?.unverified.toLocaleString()}</div>
          </div>
        </div>

        {/* Managers Stats */}
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">Managers</div>
          <div className="mt-2 text-3xl font-semibold">{overview?.managers?.total.toLocaleString()}</div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>Active: {overview?.managers?.active.toLocaleString()}</div>
            <div>Suspended: {overview?.managers?.suspended.toLocaleString()}</div>
          </div>
        </div>

        {/* Facilities Stats */}
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">Facilities</div>
          <div className="mt-2 text-3xl font-semibold">{overview?.facilities?.total.toLocaleString()}</div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>Active: {overview?.facilities?.active.toLocaleString()}</div>
            <div className="text-orange-600">Pending: {overview?.facilities?.pending_approval.toLocaleString()}</div>
            <div>Suspended: {overview?.facilities?.suspended.toLocaleString()}</div>
          </div>
        </div>

        {/* Bookings Stats */}
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">Bookings</div>
          <div className="mt-2 text-3xl font-semibold">{overview?.bookings?.total.toLocaleString()}</div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>Today: {overview?.bookings?.today.toLocaleString()}</div>
            <div>This Week: {overview?.bookings?.this_week.toLocaleString()}</div>
            <div>This Month: {overview?.bookings?.this_month.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-6">
          <div className="text-sm font-medium text-green-800">Revenue Today</div>
          <div className="mt-2 text-3xl font-semibold text-green-900">
            ${overview?.revenue?.today.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div className="text-sm font-medium text-blue-800">Revenue This Month</div>
          <div className="mt-2 text-3xl font-semibold text-blue-900">
            ${overview?.revenue?.this_month.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-6">
          <div className="text-sm font-medium text-purple-800">Commission This Month</div>
          <div className="mt-2 text-3xl font-semibold text-purple-900">
            ${overview?.revenue?.commission_this_month.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Platform Health Trends */}
      {platformHealth && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Platform Health Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600">User Growth Rate</div>
              <div className={`text-2xl font-semibold mt-1 ${platformHealth.growth_rates.users >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {platformHealth.growth_rates.users >= 0 ? '+' : ''}{platformHealth.growth_rates.users}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Booking Growth Rate</div>
              <div className={`text-2xl font-semibold mt-1 ${platformHealth.growth_rates.bookings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {platformHealth.growth_rates.bookings >= 0 ? '+' : ''}{platformHealth.growth_rates.bookings}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Revenue Growth Rate</div>
              <div className={`text-2xl font-semibold mt-1 ${platformHealth.growth_rates.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {platformHealth.growth_rates.revenue >= 0 ? '+' : ''}{platformHealth.growth_rates.revenue}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Admin Activity */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Admin Activity</h2>
        </div>
        <div className="divide-y">
          {overview?.recent_admin_activity?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent admin activity
            </div>
          ) : (
            overview?.recent_admin_activity?.map((action) => (
              <div key={action.action_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{action.admin_email}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{action.action_name.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {action.resource_type} #{action.resource_id}
                    </div>
                    {action.reason && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        "{action.reason}"
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(action.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/facilities/approve"
            className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Manage Facilities</div>
                <div className="text-2xl font-semibold text-orange-600 mt-1">
                  {overview?.pending_actions?.facility_approvals || 0}
                </div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </Link>

          <Link
            to="/admin/managers/approve"
            className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Manager Requests</div>
                <div className="text-2xl font-semibold text-orange-600 mt-1">
                  {overview?.pending_actions?.manager_requests || 0}
                </div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">User Moderation</div>
                <div className="text-2xl font-semibold text-blue-600 mt-1">
                  {overview?.users?.total.toLocaleString() || 0}
                </div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Open Reports</div>
                <div className="text-2xl font-semibold text-red-600 mt-1">
                  {overview?.pending_actions?.open_reports || 0}
                </div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </Link>

          <Link
            to="/admin/audit-log"
            className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Audit Log</div>
                <div className="text-xs text-gray-500 mt-1">View all actions</div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
