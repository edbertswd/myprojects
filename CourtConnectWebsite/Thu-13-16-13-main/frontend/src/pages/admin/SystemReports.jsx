import { useEffect, useState } from 'react';
import {
  getDashboardOverview,
  exportActivityReportCSV,
  exportAdminActionsCSV,
  exportUserStatisticsCSV,
  exportBookingStatisticsCSV
} from '../../services/adminApi';

export default function SystemReports() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const overviewData = await getDashboardOverview();
        setOverview(overviewData.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err?.error?.message || 'Failed to load system reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = (exportFunction) => {
    try {
      exportFunction(selectedRange);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">System Reports</h1>
        <div className="text-gray-500">Loading system data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">System Reports</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      </div>
    );
  }

  const totalActivities = overview?.recent_admin_activity?.length || 0;
  const totalUsers = overview?.users?.total || 0;
  const totalBookings = overview?.bookings?.total || 0;
  const totalRevenue = overview?.revenue?.this_month || 0;

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">System Reports</h1>
        <p className="text-sm text-gray-600 mt-2">
          Export and analyze platform usage statistics and activity logs
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="rounded-xl border bg-white p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Time Range
        </label>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(Number(e.target.value))}
          className="block w-full md:w-64 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
        <p className="mt-2 text-xs text-gray-500">
          Select the time range for activity and booking reports. User statistics export all data.
        </p>
      </div>

      {/* Activity Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">Total Users</div>
              <div className="text-3xl font-semibold text-blue-900 mt-2">
                {totalUsers.toLocaleString()}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Active: {overview?.users?.active.toLocaleString()}
              </div>
            </div>
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800">Total Bookings</div>
              <div className="text-3xl font-semibold text-green-900 mt-2">
                {totalBookings.toLocaleString()}
              </div>
              <div className="text-xs text-green-700 mt-1">
                This month: {overview?.bookings?.this_month.toLocaleString()}
              </div>
            </div>
            <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-800">Revenue This Month</div>
              <div className="text-3xl font-semibold text-purple-900 mt-2">
                ${totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-purple-700 mt-1">
                Commission: ${overview?.revenue?.commission_this_month.toLocaleString()}
              </div>
            </div>
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-orange-800">Admin Actions</div>
              <div className="text-3xl font-semibold text-orange-900 mt-2">
                {totalActivities}
              </div>
              <div className="text-xs text-orange-700 mt-1">
                Recent activity
              </div>
            </div>
            <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">CSV Export Options</h2>
          <p className="text-sm text-gray-600 mt-1">
            Download comprehensive reports for offline analysis
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Activity Report */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Activity Report</h3>
                <p className="text-xs text-gray-600 mt-1">
                  All platform activity logs for the selected time period
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  Includes: User actions, timestamps, resource references
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExport(exportActivityReportCSV)}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Activity CSV
            </button>
          </div>

          {/* Admin Actions Report */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-orange-300 hover:bg-orange-50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Admin Actions Report</h3>
                <p className="text-xs text-gray-600 mt-1">
                  All administrative actions performed by admins
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  Includes: Action type, admin details, reasons, financial impact
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExport(exportAdminActionsCSV)}
              className="mt-4 w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Admin Actions CSV
            </button>
          </div>

          {/* User Statistics Report */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:bg-purple-50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">User Statistics Report</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Complete user database with booking statistics
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  Includes: User details, roles, status, booking counts
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExport(exportUserStatisticsCSV)}
              className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Users CSV
            </button>
          </div>

          {/* Booking Statistics Report */}
          <div className="rounded-lg border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Booking Statistics Report</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Detailed booking data for the selected time period
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  Includes: Booking details, facility info, payments, status
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExport(exportBookingStatisticsCSV)}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Bookings CSV
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Recent Activity Snapshot</h2>
          <p className="text-sm text-gray-600 mt-1">
            Preview of latest administrative actions
          </p>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {overview?.recent_admin_activity?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent admin activity to display
            </div>
          ) : (
            overview?.recent_admin_activity?.slice(0, 10).map((action) => (
              <div key={action.action_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{action.admin_email}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-600 capitalize">
                        {action.action_name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {action.resource_type} #{action.resource_id}
                    </div>
                    {action.reason && (
                      <div className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                        "{action.reason}"
                      </div>
                    )}
                    {action.financial_impact && (
                      <div className="text-xs text-green-600 mt-1 font-medium">
                        Financial impact: ${Number(action.financial_impact).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    {new Date(action.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">About System Reports</h3>
            <p className="text-xs text-blue-800 mt-1">
              System reports provide real-time snapshots of platform activity and user data.
              CSV exports can be imported into spreadsheet applications for further analysis.
              All timestamps are in your local timezone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
