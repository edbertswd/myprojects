// src/pages/manager/CourtsList.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCourtsList } from '../../hooks/useCourts';
import { useRate } from '../../hooks/useRates';
import { getManagerFacility } from '../../services/managerApi';

const PAGE_SIZE = 10;

export default function CourtsList() {
  const { facilityId } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(loc.search);

  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(Number(params.get('page') || 1));
  const [facilityName, setFacilityName] = useState('');

  // Fetch facility name
  useEffect(() => {
    const fetchFacilityName = async () => {
      try {
        const facility = await getManagerFacility(facilityId);
        setFacilityName(facility.facility_name || `Facility #${facilityId}`);
      } catch (err) {
        console.error('Failed to fetch facility:', err);
        setFacilityName(`Facility #${facilityId}`);
      }
    };
    fetchFacilityName();
  }, [facilityId]);

  // Sync q + page to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (page !== 1) p.set('page', String(page));
    navigate(`/manager/facility/${facilityId}/courts?${p.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const { data, isLoading } = useCourtsList({ facilityId, q, page, pageSize: PAGE_SIZE });

  const results = data?.results || [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // WF-42: limit guard
  const limitReached = total >= 20;

  const changePage = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const onSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const hasQuery = (q || '').trim().length > 0;
  const noResults = !isLoading && total === 0;

  // ── Empty states (A: no courts; B: search no results) ──────────────────────────
  if (noResults) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Courts — {facilityName || 'Loading...'}</h1>
          <button
            disabled={limitReached}
            className={`rounded-xl px-4 py-2 text-white ${
              limitReached ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={limitReached ? 'Max courts reached' : 'Create a new court'}
            onClick={() => !limitReached && navigate(`/manager/facility/${facilityId}/courts/new`)}
            type="button"
          >
            Create court
          </button>
        </div>

        {/* If you want the WF-42 banner to still show on empty state when at limit */}
        {limitReached && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
            Facility limit reached: <span className="font-semibold">Max 20 courts</span>. Delete or
            deactivate existing courts before adding more.
          </div>
        )}

        <div className="rounded-2xl border bg-white shadow-sm p-8 text-center">
          {hasQuery ? (
            <>
              <div className="text-lg font-medium mb-1">No matches for “{q}”</div>
              <p className="text-sm text-gray-600 mb-4">
                Try a different keyword or clear the search.
              </p>
              <button
                className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                onClick={() => {
                  setQ('');
                  setPage(1);
                }}
                type="button"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <div className="text-lg font-medium mb-1">No courts yet</div>
              <p className="text-sm text-gray-600 mb-4">
                Create your first court to start taking bookings.
              </p>
              <button
                className="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate(`/manager/facility/${facilityId}/courts/new`)}
                type="button"
              >
                Create court
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Normal list view ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <p className="mb-4">
          <Link to="/manager" className="text-sm text-gray-600 hover:underline">← Back to Manager Dashboard</Link>
        </p>
        <h1 className="text-2xl font-semibold">Courts — {facilityName || 'Loading...'}</h1>
        <Link
          to={`/manager/facility/${facilityId}/courts/new`}
          className={`rounded-xl px-4 py-2 text-white ${
            limitReached ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-disabled={limitReached}
          onClick={(e) => {
            if (limitReached) e.preventDefault();
          }}
          title={limitReached ? 'Max 20 courts reached' : 'Create a new court'}
        >
          Create court
        </Link>
      </div>

      {/* WF-42 banner (above the table) */}
      {limitReached && (
        <div className="mt-4 mb-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Facility limit reached: <span className="font-semibold">Max 20 courts</span>. Delete or
          deactivate existing courts before adding more.
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or sport…"
            className="w-72 rounded-xl border px-3 py-2"
          />
          <button className="rounded-xl border px-4 py-2">Search</button>
        </form>

        <div className="text-sm text-gray-600">
          {total} result{total === 1 ? '' : 's'}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="mt-6 rounded-2xl border p-6 opacity-70">Loading…</div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Name</Th>
                  <Th>Sport</Th>
                  <Th>Status</Th>
                  <Th>Rate</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {results.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <Td>{c.name}</Td>
                    <Td>{c.sport}</Td>
                    <Td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          c.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </Td>

                    {/* Rate cell (after Status) */}
                    <Td>
                      <RateCell facilityId={facilityId} courtId={c.id} />
                    </Td>

                    {/* Actions last */}
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-3 text-sm">
                        <Link
                          className="text-indigo-600 hover:underline"
                          to={`/manager/facility/${facilityId}/courts/${c.id}/edit`}
                        >
                          Edit
                        </Link>
                        <Link
                          className="text-indigo-600 hover:underline"
                          to={`/manager/facility/${facilityId}/courts/${c.id}/schedule`}
                        >
                          Schedule
                        </Link>
                        <Link
                          className="text-indigo-600 hover:underline"
                          to={`/manager/facility/${facilityId}/courts/${c.id}/rate`}
                        >
                          Rate
                        </Link>
                        <Link
                          className="text-red-600 hover:underline"
                          to={`/manager/facility/${facilityId}/courts/${c.id}/delete`}
                        >
                          Delete
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
            <button
              className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => changePage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-sm text-gray-800 ${className}`}>{children}</td>;
}

function RateCell({ facilityId, courtId }) {
  const { data, isLoading, isError } = useRate({ facilityId, courtId: String(courtId) });
  if (isLoading) return <span className="text-gray-400">…</span>;
  if (isError || !data) return <span className="text-gray-400">—</span>;
  return <span>${Number(data.ratePerHour).toFixed(2)}</span>;
}
