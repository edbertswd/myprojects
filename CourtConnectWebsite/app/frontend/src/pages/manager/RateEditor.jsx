// src/pages/manager/RateEditor.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCourt } from '../../hooks/useCourts';
import { useUpdateRate } from '../../hooks/useRates';
import { MIN_RATE, MAX_RATE, STEP } from '../../services/ratesApi';

export default function RateEditor() {
  const { facilityId, courtId } = useParams();
  const navigate = useNavigate();
  const updateMut = useUpdateRate();

  // Fetch court data to get actual hourly rate
  const { data: court, isLoading } = useCourt({ facilityId, courtId });

  const [rate, setRate] = useState(25);
  const [err, setErr] = useState('');

  // Update rate when court data is loaded
  useEffect(() => {
    if (court?.hourly_rate) {
      setRate(court.hourly_rate);
    }
  }, [court]);

  const validate = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'Rate must be a number.';
    if (n < MIN_RATE || n > MAX_RATE) return `Rate must be between $${MIN_RATE} and $${MAX_RATE}.`;
    const centsMultiple = Math.round((n * 100) % Math.round(STEP * 100)); // increments of STEP
    if (centsMultiple !== 0) return `Use increments of $${STEP.toFixed(2)}.`;
    return '';
  };

  const onSave = async (e) => {
    e.preventDefault();
    const v = validate(rate);
    setErr(v);
    if (v) return;

    try {
      await updateMut.mutateAsync({
        facilityId,
        courtId,
        ratePerHour: Number(Number(rate).toFixed(2)),
        currency: 'AUD',
      });

      window.dispatchEvent(
        new CustomEvent('toast', { detail: { type: 'success', message: 'Rate updated' } })
      );

      // back to list (RateCell will refetch due to invalidate)
      navigate(`/manager/facility/${facilityId}/courts`);
    } catch {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to update rate' } })
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border p-4 text-center text-gray-500">
          Loading court data...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <p className="mb-4">
        <Link to={`/manager/facility/${facilityId}/courts`} className="text-sm text-gray-600 hover:underline">
          ← Back to Courts
        </Link>
      </p>

      <h1 className="text-2xl font-semibold">
        Rate — {court?.name || `Court #${courtId}`}
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Facility #{facilityId}
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSave}>
        <div>
          <label className="block text-sm font-medium">Hourly rate (AUD)</label>
          <input
            type="number"
            step={STEP}
            min={MIN_RATE}
            max={MAX_RATE}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${err ? 'border-red-400' : ''}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Allowed: ${MIN_RATE} – ${MAX_RATE}, increments of ${STEP.toFixed(2)}.
          </p>
          {err && <p className="mt-1 text-sm text-red-700">{err}</p>}
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={updateMut.isPending}
            className="rounded-xl px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
          >
            {updateMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
