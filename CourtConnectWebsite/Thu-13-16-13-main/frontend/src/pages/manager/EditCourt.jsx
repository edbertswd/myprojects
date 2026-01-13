// src/pages/manager/EditCourt.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCourt, useUpdateCourt } from '../../hooks/useCourts';
import { useSportTypes, buildSportTypeMap } from '../../hooks/useSportTypes';

const STATUS_OPTIONS = ['active', 'inactive'];

export default function EditCourt() {
  const { facilityId, courtId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useCourt({ facilityId, courtId });
  const updateMut = useUpdateCourt({ facilityId, courtId });
  const { data: sportTypes, isLoading: sportTypesLoading } = useSportTypes();

  const [form, setForm] = useState({
    name: '',
    sport: '',
    status: 'active',
    hourly_rate: 25,
    opening_time: '06:00',
    closing_time: '22:00',
    availability_start_date: new Date().toISOString().slice(0, 10)
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);


  // hydrate from query once loaded
  useEffect(() => {
    if (!isLoading && data) {
      setForm({
        name: data.name,
        sport: data.sport_name || data.sport || '',
        status: data.is_active ? 'active' : 'inactive',
        hourly_rate: data.hourly_rate || 25,
        opening_time: data.opening_time || '06:00',
        closing_time: data.closing_time || '22:00',
        availability_start_date: data.availability_start_date || new Date().toISOString().slice(0, 10)
      });
    }
  }, [isLoading, data]);

  const onChange = (key) => (ev) =>
    setForm((f) => ({ ...f, [key]: ev.target.value }));

  const validate = () => {
    const errs = {};
    const trimmed = (form.name || '').trim();

    if (!trimmed) errs.name = 'Name is required.';
    else if (trimmed.length < 1 || trimmed.length > 50)
      errs.name = 'Name must be 1–50 characters.';

    const validSportNames = sportTypes?.map(st => st.sport_name) || [];
    if (!form.sport || !validSportNames.includes(form.sport))
      errs.sport = 'Invalid sport.';

    if (!form.status || !STATUS_OPTIONS.includes(form.status))
      errs.status = 'Invalid status.';

    setFieldErrors(errs);
    setFormError(null);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Build sport type map to get sport_type_id from sport name
    const sportTypeMap = buildSportTypeMap(sportTypes);
    const sportTypeId = sportTypeMap[form.sport];

    if (!sportTypeId) {
      setFormError('Invalid sport type selected. Please refresh and try again.');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        sport_type: sportTypeId,
        is_active: form.status === 'active',
        hourly_rate: form.hourly_rate,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        availability_start_date: form.availability_start_date
      };

      await updateMut.mutateAsync(payload);

      // optional toast
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { type: 'success', message: 'Court updated' },
        })
      );

      navigate(`/manager/facility/${facilityId}/courts`, {
        replace: true,
        state: { justEdited: 1 },
      });
    } catch (err) {
      if (err?.code === 'DUPLICATE_NAME') {
        setFieldErrors({ name: 'A court with that name already exists.' });
      } else {
        setFormError('Failed to save changes.');
      }
    }
  };

  if (isLoading || sportTypesLoading) {
    return <div className="mx-auto max-w-xl p-6 rounded-2xl border">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <p className="mb-4">
        <Link
          to={`/manager/facility/${facilityId}/courts`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Courts
        </Link>
      </p>

      <h1 className="text-2xl font-semibold">Edit court</h1>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={form.name}
            onChange={onChange('name')}
            placeholder="Court name"
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              fieldErrors.name ? 'border-red-400' : ''
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Sport</label>
          <select
            value={form.sport}
            onChange={onChange('sport')}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              fieldErrors.sport ? 'border-red-400' : ''
            }`}
          >
            <option value="">Select a sport</option>
            {sportTypes && sportTypes.map((sportType) => (
              <option key={sportType.sport_type_id} value={sportType.sport_name}>
                {sportType.sport_name}
              </option>
            ))}
          </select>
          {fieldErrors.sport && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.sport}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={form.status}
            onChange={onChange('status')}
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              fieldErrors.status ? 'border-red-400' : ''
            }`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {form.status === 'inactive'
              ? 'Court is currently inactive. Change to "active" to reactivate and accept bookings.'
              : 'Court is accepting bookings. Change to "inactive" to temporarily disable bookings.'}
          </p>
          {fieldErrors.status && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.status}</p>
          )}
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Hourly Rate (AUD)</label>
          <input
            type="number"
            value={form.hourly_rate}
            onChange={onChange('hourly_rate')}
            min="10"
            max="200"
            step="5"
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${fieldErrors.hourly_rate ? 'border-red-400' : ''}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Price per hour ($10-$200 AUD)
          </p>
          {fieldErrors.hourly_rate && <p className="mt-1 text-sm text-red-700">{fieldErrors.hourly_rate}</p>}
        </div>

        <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold mb-3">Operating Hours</h3>
          <p className="text-xs text-gray-600 mb-3">
            Update your court's operating hours. Future availability will be regenerated.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1">Opening Time</label>
              <input
                type="time"
                value={form.opening_time}
                onChange={onChange('opening_time')}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Closing Time</label>
              <input
                type="time"
                value={form.closing_time}
                onChange={onChange('closing_time')}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={form.availability_start_date}
              onChange={onChange('availability_start_date')}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Changing hours will regenerate availability for 3 months
            </p>
          </div>
        </div>


        <div className="pt-2 flex items-center justify-between">
          <Link
            to={`/manager/facility/${facilityId}/courts`}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMut.isPending}
            className={`rounded-xl px-4 py-2 text-white ${
              updateMut.isPending
                ? 'bg-blue-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {updateMut.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
