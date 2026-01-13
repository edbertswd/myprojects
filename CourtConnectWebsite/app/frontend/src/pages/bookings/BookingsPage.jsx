// src/pages/bookings/BookingsPage.jsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BookingDetailsModal from '../../components/bookings/BookingDetailsModal';

/**
 * My Bookings
 * - Tabs: Upcoming / Past
 * - Merge tempBooking from Checkout (location.state) so users see it immediately.
 * - Cancel rule: only if start time is ≥ 2 hours from now.
 * - Uses mock data for now; switch to API by uncommenting the fetch block.
 */

/* ------------------------ Local helpers (self-contained) ------------------------ */

// Format date/time in Australia/Sydney timezone
function formatDateInTz(iso, tz = 'Australia/Sydney') {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-AU', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Is a booking cancellable? (≥ 2 hours before start)
function isCancellable(startIso) {
  const now = new Date();
  const start = new Date(startIso);
  const diffMs = start.getTime() - now.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return hours >= 2;
}

// Split into upcoming/past lists
function partitionBookings(all) {
  const now = new Date();
  const upcoming = [];
  const past = [];
  for (const b of all) {
    const end = new Date(b.end_datetime);
    // If end time is in the past OR status is cancelled/completed -> Past
    if (end.getTime() < now.getTime() || ['cancelled', 'completed'].includes((b.status_name || '').toLowerCase())) {
      past.push(b);
    } else {
      upcoming.push(b);
    }
  }
  // Newest first for past; nearest first for upcoming
  upcoming.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  past.sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
  return { upcoming, past };
}

// Read a query param from current URL
function useQueryParam(key, defaultValue) {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  return params.get(key) ?? defaultValue;
}

// Keep tab state in URL (?tab=upcoming|past)
function useTabState() {
  const navigate = useNavigate();
  const loc = useLocation();
  const tab = useQueryParam('tab', 'upcoming'); // 'upcoming' | 'past'
  const setTab = (next) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    navigate(`${url.pathname}?${url.searchParams.toString()}`, { replace: true, state: loc.state });
  };
  return [tab, setTab];
}

/* --------------------------------- Page --------------------------------- */

export default function BookingsPage() {
  const loc = useLocation();           // may contain { state: { tempBooking } }
  const [tab, setTab] = useTabState();
  const query = useQueryParam('query', ''); // ?query= from Dashboard quick search
  const focusId = useQueryParam('focus', null); // ?focus=7 to scroll to booking

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]); // unified list; we partition via useMemo
  const [error, setError] = useState(null);
  const bookingRefs = useRef({}); // Store refs to booking cards for scrolling
  const [selectedBooking, setSelectedBooking] = useState(null); // For details modal

  // Seed with mocks (and wire API later)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {}; // add pagination/filters if needed
        const { data } = await api.get('/bookings/v1/my-bookings/', { params });
        const transformed = (data.results || data || []).map(transformBookingData);
        const filtered = filterByQuery(transformed, query);
        if (mounted) setBookings(filtered);
      } catch (e) {
        console.error('Failed to fetch bookings:', e);
        if (mounted) {
          setError('Failed to load bookings');
          setBookings([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
     
  }, [query]);

  // Merge tempBooking from Checkout 
  useEffect(() => {
    const temp = loc.state?.tempBooking;
    if (!temp) return;
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === temp.id);
      if (exists) return prev;
      return [temp, ...prev];
    });
    // keep state but don't re-append on tab change
  }, [loc.state?.tempBooking]);

  const { upcoming, past } = useMemo(() => partitionBookings(bookings), [bookings]);
  const list = tab === 'past' ? past : upcoming;

  const onCancel = async (id) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    if (!isCancellable(booking.start_datetime)) {
      alert('This booking cannot be cancelled. Bookings can only be cancelled up to 2 hours before the start time.');
      return;
    }

    const ok = window.confirm(
      'Cancel this booking?\n\n' +
      '⚠️ REFUND POLICY: We do not process refunds for cancelled bookings. ' +
      'Your payment will not be returned.\n\n' +
      'Are you sure you want to cancel?'
    );
    if (!ok) return;

    // optimistic update: mark as cancelled (don't remove)
    const prev = bookings;
    setBookings((cur) =>
      cur.map((b) => (b.id === id ? { ...b, status_name: 'cancelled' } : b))
    );

    try {
      await api.delete(`/bookings/v1/${id}/cancel/`);
    } catch (e) {
      console.error('Cancellation failed', e);
      setBookings(prev); // rollback
      alert('Cancel failed, please try again.');
    }
  };

  // Scroll to focused booking when focus parameter changes
  useEffect(() => {
    if (focusId && bookingRefs.current[focusId]) {
      const element = bookingRefs.current[focusId];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Flash highlight animation
      element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  }, [focusId, bookings]);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-semibold">My Bookings</h1>

      {/* Error banner (non-blocking; we still show mocks) */}
      {error && (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          Unable to load latest bookings. Showing cached data.
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          className={`rounded-xl border px-4 py-2 ${tab === 'upcoming' ? 'bg-gray-100' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`rounded-xl border px-4 py-2 ${tab === 'past' ? 'bg-gray-100' : ''}`}
          onClick={() => setTab('past')}
        >
          Past
        </button>
      </div>

      {/* List */}
      <div className="mt-6 grid gap-3">
        {loading && <div className="rounded-xl border p-4 opacity-70">Loading…</div>}

        {!loading && list.length === 0 && (
          <div className="rounded-xl border p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">No {tab} bookings</div>
            <div className="text-gray-400 text-sm">
              {tab === 'upcoming'
                ? "You don't have any upcoming bookings yet."
                : "You don't have any past bookings to show."}
            </div>
          </div>
        )}

        {!loading &&
          list.map((b) => {
            const startStr = formatDateInTz(b.start_datetime);
            const endStr = formatDateInTz(b.end_datetime);
            const cancellable =
              isCancellable(b.start_datetime) &&
              (b.status_name || '').toLowerCase() !== 'cancelled' &&
              (b.status_name || '').toLowerCase() !== 'completed';

            const status = (b.status_name || 'confirmed').toLowerCase();
            const showStatus = status !== 'confirmed';
            const badgeClass = getStatusBadgeClass(status);

            return (
              <div
                key={b.id}
                ref={(el) => {
                  if (el) bookingRefs.current[b.id] = el;
                }}
                className="rounded-xl border p-4 flex items-center justify-between transition-all duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{b.facility_name}</div>
                    {b.court_name && (
                      <div className="text-sm text-gray-600">- {b.court_name}</div>
                    )}
                    {showStatus && (
                      <span className={`px-2 py-1 rounded-full text-xs ${badgeClass}`}>
                        {status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm opacity-70">
                    {startStr} – {endStr}
                  </div>
                  {b.sport_type && (
                    <div className="text-sm text-gray-500">{b.sport_type}</div>
                  )}
                </div>

                {tab === 'upcoming' ? (
                  <div className="flex items-center gap-2">
                    {status !== 'cancelled' && (
                      <button
                        className={`rounded-lg border px-3 py-1 text-sm ${
                          !cancellable ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={
                          cancellable
                            ? 'Cancel this booking'
                            : 'Non-cancellable (requires ≥2 hours)'
                        }
                        disabled={!cancellable}
                        onClick={() => cancellable && onCancel(b.id)}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setSelectedBooking(b);
                      }}
                    >
                      View
                    </button>
                  </div>
                ) : (
                  <button
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setSelectedBooking(b);
                    }}
                  >
                    View
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

/* ----------------------------- Local utils ----------------------------- */

function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending_payment':
      return 'bg-yellow-100 text-yellow-800';
    case 'payment_failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Transform backend data shape to frontend shape
function transformBookingData(backendBooking) {
  return {
    id: backendBooking.booking_id,
    facility_name: backendBooking.facility_name,
    court_name: backendBooking.court_name,
    sport_type: backendBooking.sport_type,
    start_datetime: backendBooking.start_time,
    end_datetime: backendBooking.end_time,
    status_name: backendBooking.status_name,
    hourly_rate_snapshot: backendBooking.hourly_rate_snapshot,
    created_at: backendBooking.created_at,
  };
}

// Frontend filter by ?query=
function filterByQuery(list, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (x) =>
      x.facility_name?.toLowerCase().includes(q) ||
      x.court_name?.toLowerCase().includes(q) ||
      x.sport_type?.toLowerCase().includes(q)
  );
}
