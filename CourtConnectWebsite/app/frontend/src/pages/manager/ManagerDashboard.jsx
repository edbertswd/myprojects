// src/pages/manager/ManagerDashboard.jsx
import { Link, useLocation } from 'react-router-dom';
import { useManagerOverview } from '../../hooks/useManager';

function useFacilityId() {
  const { search } = useLocation();
  const q = new URLSearchParams(search);
  return q.get('facilityId') || null;
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default function ManagerDashboard() {
  const facilityId = useFacilityId();
  const { data: ov, isLoading, error } = useManagerOverview();

  const bookingsToday = ov?.today_count || 0;
  const bookingsNext7 = ov?.next7d_count || 0;
  const facilities = ov?.facilities || [];

  // Revenue data
  const totalRevenue = ov?.total_revenue || '0.00';
  const commissionRate = ov?.commission_rate || '10.00';
  const netRevenue = ov?.net_revenue || '0.00';
  const commissionCollected = ov?.commission_collected || '0.00';

  // Format last updated time
  const lastUpdated = ov?.last_updated
    ? new Date(ov.last_updated).toLocaleString('en-AU', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          Error loading dashboard: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your facility at a glance.
        </p>
        {facilityId && (
          <p className="text-xs text-gray-500 mt-2">
            Facility <span className="font-medium">#{facilityId}</span> · Last updated {lastUpdated}
          </p>
        )}
      </header>

      {/* KPIs - Row 1: Bookings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Bookings Today" value={bookingsToday} />
        <Kpi label="Bookings Next 7 Days" value={bookingsNext7} />
        <Kpi label="Total Facilities" value={facilities.length} />
      </section>

      {/* KPIs - Row 2: Revenue */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5 bg-white shadow-sm">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">${totalRevenue}</div>
          <div className="text-xs text-gray-500 mt-2">All-time gross revenue</div>
        </div>
        <div className="rounded-2xl border p-5 bg-white shadow-sm">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            Commission Rate
            <span className="group relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                Platform commission deducted from bookings
              </div>
            </span>
          </div>
          <div className="mt-1 text-3xl font-semibold text-orange-600">{commissionRate}%</div>
          <div className="text-xs text-gray-500 mt-2">${commissionCollected} collected</div>
        </div>
        <div className="rounded-2xl border p-5 bg-white shadow-sm">
          <div className="text-sm text-gray-600">Net Revenue</div>
          <div className="mt-1 text-3xl font-semibold text-blue-600">${netRevenue}</div>
          <div className="text-xs text-gray-500 mt-2">After commission</div>
        </div>
      </section>

      {/* Main tiles */}
      {facilityId && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={`/manager/facility/${facilityId}/courts`}
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Manage Courts</div>
            <div className="text-sm text-gray-600 mt-1">
              Create, edit, schedule, rates
            </div>
          </Link>

          <Link
            to={`/manager/facility/${facilityId}/reports`}
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Utilization Reports</div>
            <div className="text-sm text-gray-600 mt-1">
              Occupancy & revenue
            </div>
          </Link>

          <Link
            to="/manager/profile"
            className="rounded-2xl border p-5 bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <div className="font-medium">Manager Profile</div>
            <div className="text-sm text-gray-600 mt-1">
              View and edit your profile
            </div>
          </Link>
        </section>
      )}

      {/* Facilities List */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Your Facilities</h2>
          <Link
            to="/manager/facilities/apply"
            className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
          >
            Apply for Facility
          </Link>
        </div>
        <ul className="divide-y">
          {facilities.map(f => (
            <li key={f.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-gray-500">ID: {f.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/manager/facility/${f.id}/courts`}
                  className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50"
                >
                  Courts
                </Link>
                <Link
                  to={`/manager/facilities/${f.id}/edit`}
                  className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
          {facilities.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-500">
              No facilities yet. Apply for one to get started!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
