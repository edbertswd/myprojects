// src/pages/manager/UtilizationReports.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUtilizationReport } from '../../hooks/useReports';
import { useCourtOptions } from '../../hooks/useCourts';

function todayISO() { return new Date().toISOString().slice(0,10); }
function daysAgoISO(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-200">
      <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// small debounce used for URL syncing
function useDebouncedEffect(fn, deps, delay = 250) {
  useEffect(() => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function UtilizationReports() {
  const { facilityId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- read params (with defaults) ---
  const initial = {
    from:  searchParams.get('from')     || daysAgoISO(14),
    to:    searchParams.get('to')       || todayISO(),
    group: searchParams.get('groupBy')  || 'day',
    court: searchParams.get('courtId')  || '',
    sport: searchParams.get('sport')    || '',
  };

  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [groupBy, setGroupBy] = useState(initial.group);
  const [courtId, setCourtId] = useState(initial.court);
  const [sport, setSport] = useState(initial.sport);

  // --- write params (debounced) whenever filters change ---
  useDebouncedEffect(() => {
    const sp = new URLSearchParams();
    sp.set('from', from);
    sp.set('to', to);
    sp.set('groupBy', groupBy);
    if (courtId) sp.set('courtId', courtId);
    if (sport)   sp.set('sport', sport);
    setSearchParams(sp, { replace: true });
  }, [from, to, groupBy, courtId, sport, setSearchParams]);

  // --- fetch data ---
  const { data, isLoading, isError, isFetching, refetch } = useUtilizationReport({
    facilityId,
    from, to, groupBy,
    courtId: courtId || undefined,
    sport: sport || undefined,
  });

  // court options
  const { data: courtOptions = [], isLoading: optsLoading } = useCourtOptions({ facilityId });

  const totals = data?.totals;
  const rows = data?.rows || [];

  const overallOcc = useMemo(() => {
    if (!totals || totals.openHours === 0) return 0;
    return (totals.bookedHours / totals.openHours) * 100;
  }, [totals]);

  // --- CSV export ---
  function toCSV() {
    const headerMeta = [
      `Generated At,${new Date().toISOString()}`,
      `Facility ID,${facilityId}`,
      `From,${from}`,
      `To,${to}`,
      `Group By,${groupBy}`,
      `Court Filter,${courtId || 'All'}`,
      `Sport Filter,${sport || 'All'}`,
      '',
    ].join('\r\n');

    const header = 'Bucket,Court,Open Hours,Booked Hours,Occupancy %,Revenue (AUD)';
    const lines = rows.map(r => {
      const occ = r.openHours ? (r.bookedHours / r.openHours) * 100 : 0;
      return [
        r.bucket,
        r.court,
        r.openHours,
        r.bookedHours,
        occ.toFixed(1),
        Number(r.revenue).toFixed(2),
      ].join(',');
    });

    // totals row
    const occTotal = totals?.openHours ? (totals.bookedHours / totals.openHours) * 100 : 0;
    lines.push(['Totals','-', totals?.openHours ?? 0, totals?.bookedHours ?? 0, occTotal.toFixed(1), Number(totals?.revenue ?? 0).toFixed(2)].join(','));

    const csv = `${headerMeta}${header}\r\n${lines.join('\r\n')}`;
    const filename = `utilization_${facilityId}_${from}_to_${to}_${groupBy}.csv`;

    // add UTF-8 BOM for Excel
    const blob = new Blob([new Uint8Array([0xEF,0xBB,0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Utilization Reports</h1>
      <p className="text-sm text-gray-600 mb-6">Occupancy and revenue over time. Filter and group your data.</p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                 className="rounded-xl border px-3 py-2" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                 className="rounded-xl border px-3 py-2" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Group by</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Court (optional)</label>
          <select
            value={courtId}
            onChange={(e)=>setCourtId(e.target.value)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="">All courts</option>
            {optsLoading ? <option>Loading…</option> : courtOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Sport (optional)</label>
          <input placeholder="Tennis" value={sport} onChange={(e)=>setSport(e.target.value)}
                 className="rounded-xl border px-3 py-2" />
        </div>

        {/* actions */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            type="button"
          >
            {isFetching ? 'Refreshing…' : 'Apply filters'}
          </button>
          <button
            onClick={toCSV}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            type="button"
            aria-label="Export CSV for current report"
          >
            Export CSV
          </button>
        </div>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-gray-600 mb-4"><Loader2 className="animate-spin" size={18}/> Fetching report…</div>}
      {isError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 text-red-800 p-3 flex items-center justify-between">
          <span>Failed to load report.</span>
          <button onClick={()=>refetch()} className="px-3 py-1 rounded-lg border border-red-400 hover:bg-red-100 text-sm">Retry</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-600">Overall Occupancy</div>
          <div className="text-2xl font-semibold mt-1">{overallOcc.toFixed(1)}%</div>
          <div className="mt-2"><ProgressBar value={overallOcc} /></div>
        </div>
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-600">Booked Hours</div>
          <div className="text-2xl font-semibold mt-1">{totals?.bookedHours ?? 0}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-600">Revenue (AUD)</div>
          <div className="text-2xl font-semibold mt-1">${(totals?.revenue ?? 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Bucket</th>
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Court</th>
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Open hrs</th>
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Booked hrs</th>
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Occupancy</th>
              <th className="px-4 py-3 font-medium text-gray-700" scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const occ = r.openHours ? (r.bookedHours / r.openHours) * 100 : 0;
              return (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3">{r.bucket}</td>
                  <td className="px-4 py-3">{r.court}</td>
                  <td className="px-4 py-3">{r.openHours}</td>
                  <td className="px-4 py-3">{r.bookedHours}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-12">{occ.toFixed(0)}%</span>
                      <div className="flex-1"><ProgressBar value={occ} /></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">${r.revenue.toFixed(2)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No data for selected filters. Try widening the date range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
