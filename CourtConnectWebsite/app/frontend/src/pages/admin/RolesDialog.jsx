import { useEffect, useState } from 'react';

const ALL_ROLES = ['user', 'manager', 'admin'];

export default function RolesDialog({ open, onClose, onConfirm, currentRoles = [], loading }) {
  const [selected, setSelected] = useState(new Set(currentRoles.length ? currentRoles : ['user']));
  const [reason, setReason] = useState('');

  useEffect(() => {
    setSelected(new Set(currentRoles.length ? currentRoles : ['user']));
  }, [currentRoles, open]);

  if (!open) return null;

  const toggle = (r) => {
    const next = new Set(selected);
    if (next.has(r)) next.delete(r); else next.add(r);
    if (r === 'user' && !next.has('user')) next.add('user'); // always keep 'user'
    setSelected(next);
  };

  const reasonErr = reason.trim().length > 0 && reason.trim().length < 10 ? 'Min 10 characters' : '';
  const canSubmit = reason.trim().length >= 10 && selected.size > 0;

  const computeDiff = () => {
    const cur = new Set(currentRoles.length ? currentRoles : ['user']);
    const next = new Set(selected);
    const add = [...next].filter(r => !cur.has(r));
    const remove = [...cur].filter(r => !next.has(r));
    if (!next.has('user')) add.push('user'); // safety
    return { add, remove };
  };

  const onSubmit = () => {
    const { add, remove } = computeDiff();
    onConfirm({ add, remove, reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Modify Roles</h2>
        <p className="text-sm text-gray-500 mt-1">Select target roles and provide an audit reason (≥ 10 chars).</p>

        <div className="mt-4 space-y-2">
          {ALL_ROLES.map(r => (
            <label key={r} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.has(r)}
                onChange={() => toggle(r)}
                disabled={r === 'user'} // keep base role checked (policy)
              />
              <span className="capitalize">{r}</span>
            </label>
          ))}
        </div>

        <label className="block mt-4 text-sm font-medium">Reason</label>
        <textarea
          className="mt-1 w-full border rounded-lg px-3 py-2"
          rows={4}
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., elevated to manager for facility ownership…"
        />
        {reasonErr && <div className="text-xs text-red-600 mt-1">{reasonErr}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
            disabled={!canSubmit || loading}
            onClick={onSubmit}
          >
            {loading ? 'Saving…' : 'Save Roles'}
          </button>
        </div>
      </div>
    </div>
  );
}
