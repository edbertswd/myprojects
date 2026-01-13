import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAdminReports } from '../../hooks/useAdminReports';

function useUrlState() {
  const [sp, setSp] = useSearchParams();
  const range = sp.get('range') || '7d';
  const setRange = (v) => {
    const next = new URLSearchParams(sp);
    next.set('range', v);
    setSp(next, { replace: true });
  };
  return { range, setRange };
}

export default function AdminReports() {
  const { range, setRange } = useUrlState();
  const { data, isLoading, isError, refetch } = useAdminReports({ range });

  useEffect(() => { /* noop: subscribe to URL */ }, [range]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">System Reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={() => refetch()} className="border rounded px-3 py-1 hover:bg-gray-50">
            Refresh
          </button>
          <Link to="/admin" className="text-sm underline">Back to Admin</Link>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">Loading…</div>}
      {isError && <div className="text-red-600">Failed to load reports.</div>}

      {!isLoading && !isError && data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Health" value={data.cards.healthOk ? 'OK' : 'Down'} hint="Service status" ok={data.cards.healthOk === 1} />
            <KpiCard title="Avg Latency" value={`${data.cards.avgLatencyMs} ms`} hint="HTTP p50–p75" />
            <KpiCard title="Error Rate" value={`${data.cards.errorRate}%`} hint="5xx / total" />
            <KpiCard title="Open Moderation" value={data.cards.openModeration} hint="Pending items" />
          </div>

          {/* Simple tables for series (you can swap to charts later) */}
          <Section title="Active Users">
            <MiniTable dates={data.series.dates} values={data.series.activeUsers} />
          </Section>
          <Section title="New Reports">
            <MiniTable dates={data.series.dates} values={data.series.newReports} />
          </Section>
          <Section title="Errors">
            <MiniTable dates={data.series.dates} values={data.series.errors} />
          </Section>

          <div className="pt-2">
            <ExportCsvButton data={data} range={range} />
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, hint, ok }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1 flex items-center gap-2">
        {value}
        {ok !== undefined && (
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        )}
      </div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="px-4 py-2 border-b font-medium">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MiniTable({ dates, values }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-[520px] w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((d, i) => (
            <tr key={d} className="border-t">
              <td className="py-2 pr-4">{d}</td>
              <td className="py-2">{values[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExportCsvButton({ data, range }) {
  const handleExport = () => {
    const lines = [];
    // metadata
    lines.push(`range,${range}`);
    lines.push('');
    lines.push('metric,date,value');

    const pushSeries = (metric, dates, vals) => {
      dates.forEach((d, i) => lines.push(`${metric},${d},${vals[i]}`));
    };

    pushSeries('active_users', data.series.dates, data.series.activeUsers);
    pushSeries('new_reports',  data.series.dates, data.series.newReports);
    pushSeries('errors',       data.series.dates, data.series.errors);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `admin_system_reports_${range}_${now}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} className="border rounded px-3 py-1 hover:bg-gray-50">
      Export CSV
    </button>
  );
}
