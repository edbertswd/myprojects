// src/pages/manager/ManagerProfile.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';

const USE_API = false; // Backend ready to true

// The Mock return shape is consistent with the interface
const MOCK = {
  facility_id: 'FAC-1024',
  phone: '+61 400 000 000',
  payout_connected: false,
};

function Chip({ connected }) {
  const cls = connected
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {connected ? 'Connected' : 'Not Connected'}
    </span>
  );
}

export default function ManagerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState('');

  // Basic checksum: 8–15 digits, + space - allowed
  const validPhone = /^\+?[0-9\s-]{8,15}$/.test(phone.trim());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (USE_API) {
          const { data } = await api.get('/manager/profile');
          if (mounted) {
            setData(data);
            setPhone(data.phone || '');
          }
        } else {
          if (mounted) {
            setData(MOCK);
            setPhone(MOCK.phone);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    if (!validPhone || saving) return;
    setSaving(true);
    try {
      if (USE_API) {
        await api.patch('/manager/profile', { phone: phone.trim() });
      } else {
        // mock: pretend success
        await new Promise(r => setTimeout(r, 400));
      }
      setData(prev => ({ ...prev, phone: phone.trim() }));
      alert('Saved');
    } catch {
      alert('Failed to save, please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager Profile</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Payout</span>
          <Chip connected={!!data?.payout_connected} />
        </div>
      </header>

      <form onSubmit={onSave} className="space-y-6">
        {/* facility_id（read only） */}
        <div>
          <label className="block text-sm font-medium mb-2">Facility ID</label>
          <input
            value={data?.facility_id ?? ''}
            readOnly
            className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-700"
          />
          <p className="mt-1 text-xs text-gray-500">This field is read-only.</p>
        </div>

        {/* phone（can modify） */}
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+61 4xx xxx xxx"
            className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${validPhone ? 'focus:ring-blue-200' : 'border-red-500 focus:ring-red-200'}`}
          />
          {!validPhone && (
            <p className="mt-1 text-xs text-red-600">Please enter 8–15 digits (may include +, spaces, -).</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border px-4 py-2"
            onClick={() => setPhone(data?.phone || '')}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className={`rounded-xl px-4 py-2 text-white ${validPhone ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 opacity-60 cursor-not-allowed'}`}
            disabled={!validPhone || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {/* Quick area (optional): guides you to connect to the payout
       currently reads only the chip, and reserves a placeholder */}
      {!data?.payout_connected && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-700">
            Your payouts are not connected yet. Please go to Payouts to connect Stripe/PayPal.
          </div>
          <div className="mt-3">
            <button type="button" className="rounded-xl border px-3 py-2" disabled>
              Connect Payouts (coming soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
