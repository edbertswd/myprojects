import { useSearchParams } from 'react-router-dom';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useMemo, useState, useEffect } from 'react';

const PAGE_SIZE_OPTS = [10, 20, 50];
function toInt(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; }

export default function AuditLog() {
  const [sp, setSp] = useSearchParams();
  const q            = sp.get('q') ?? '';
  const action       = sp.get('action') ?? '';
  const adminId      = sp.get('adminId') ?? '';
  const targetUserId = sp.get('targetUserId') ?? '';
  const page         = toInt(sp.get('page'), 1);
  const pageSize     = toInt(sp.get('pageSize'), 10);

  const { data, isLoading, isError, error } = useAuditLog({ q, action, adminId, targetUserId, page, pageSize });

  const rows  = data?.data ?? [];
  const meta  = data?.meta ?? { page, pageSize, total: 0 };
  const total = meta.total;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (!data) return;
    const max = Math.max(1, Math.ceil((data.meta?.total ?? 0) / pageSize));
    if (page > max) {
      const next = new URLSearchParams(sp);
      next.set('page', String(max));
      setSp(next, { replace: true });
    }
  }, [data, page, pageSize, setSp, sp]);

  const onChange = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === '' || v == null) next.delete(k); else next.set(k, String(v));
    if (['q','action','adminId','targetUserId','pageSize'].includes(k)) next.set('page','1');
    setSp(next);
  };

  const [openRow, setOpenRow] = useState(null);

  const header = useMemo(() => (
    <div className="p-6 pb-0">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <p className="text-gray-500">Filter by action/admin/target, expand metadata to inspect details.</p>
    </div>
  ), []);

  return (
    <div className="p-6">
      {header}

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Search action/reason/metadata…"
          value={q}
          onChange={(e)=>onChange('q', e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Action (e.g. modify_roles)"
          value={action}
          onChange={(e)=>onChange('action', e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Admin ID"
          value={adminId}
          onChange={(e)=>onChange('adminId', e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Target User ID"
          value={targetUserId}
          onChange={(e)=>onChange('targetUserId', e.target.value)}
        />
        <select className="border rounded-lg px-3 py-2" value={pageSize} onChange={(e)=>onChange('pageSize', e.target.value)}>
          {PAGE_SIZE_OPTS.map(ps => <option key={ps} value={ps}>{ps} / page</option>)}
        </select>
      </div>

      {isLoading && <div className="mt-6 text-gray-500">Loading…</div>}
      {isError && <div className="mt-6 text-red-600">Failed to load audit log{error?.code ? ` (${error.code})` : ''}.</div>}

      {!isLoading && !isError && (
        <>
          <div className="mt-4 overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Time</th>
                  <th className="text-left px-4 py-2">Action</th>
                  <th className="text-left px-4 py-2">Admin</th>
                  <th className="text-left px-4 py-2">Target</th>
                  <th className="text-left px-4 py-2">Reason</th>
                  <th className="text-right px-4 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No audit entries match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((r, idx) => {
                  const id = `${r.ts}-${idx}`;
                  const open = openRow === id;
                  return (
                    <>
                      <tr key={id} className="border-t">
                        <td className="px-4 py-2">{new Date(r.ts).toLocaleString()}</td>
                        <td className="px-4 py-2">{r.action}</td>
                        <td className="px-4 py-2">{r.admin_user_id ?? '-'}</td>
                        <td className="px-4 py-2">{r.target_user_id ?? '-'}</td>
                        <td className="px-4 py-2">{r.reason ?? '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            className="px-3 py-1 border rounded"
                            onClick={() => setOpenRow(open ? null : id)}
                          >
                            {open ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr key={id + '-meta'} className="bg-gray-50 border-t">
                          <td colSpan={6} className="px-4 py-3">
                            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(r.metadata || {}, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {total} • Page {page} / {maxPage}
            </div>
            <div className="space-x-2">
              <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => onChange('page', Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
              <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => onChange('page', Math.min(maxPage, page + 1))} disabled={page >= maxPage}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
