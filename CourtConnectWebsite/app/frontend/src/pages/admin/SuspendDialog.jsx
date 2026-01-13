import { useState } from 'react';

export default function SuspendDialog({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(7);
  const reasonErr = reason.trim().length > 0 && reason.trim().length < 10 ? 'Min 10 characters' : '';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Suspend User</h2>
        <p className="text-sm text-gray-500 mt-1">
          Reason (10–200 chars) and duration (1–30 days).
        </p>

        <label className="block mt-4 text-sm font-medium">Reason</label>
        <textarea
          className="mt-1 w-full border rounded-lg px-3 py-2"
          rows={4}
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., repeated policy violations…"
        />
        {reasonErr && <div className="text-xs text-red-600 mt-1">{reasonErr}</div>}

        <label className="block mt-4 text-sm font-medium">Duration (days)</label>
        <input
          type="number"
          className="mt-1 w-32 border rounded-lg px-3 py-2"
          min={1} max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />

        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
            disabled={loading || reason.trim().length < 10 || days < 1 || days > 30}
            onClick={() => onConfirm({ reason: reason.trim(), durationDays: days })}
          >
            {loading ? 'Suspending…' : 'Confirm Suspend'}
          </button>
        </div>
      </div>
    </div>
  );
}
