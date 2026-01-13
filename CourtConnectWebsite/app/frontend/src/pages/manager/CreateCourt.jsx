// src/pages/manager/CreateCourt.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCreateCourt } from '../../hooks/useCourts';
import { useSportTypes, buildSportTypeMap } from '../../hooks/useSportTypes';

export default function CreateCourt() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const createMut = useCreateCourt({ facilityId });
  const { data: sportTypes, isLoading: sportTypesLoading } = useSportTypes();

  // form state
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [hourlyRate, setHourlyRate] = useState(25);
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Set default sport when sport types are loaded
  useEffect(() => {
    if (sportTypes && sportTypes.length > 0 && !sport) {
      setSport(sportTypes[0].sport_name);
    }
  }, [sportTypes, sport]);

  // validators
  const validate = () => {
    const errs = {};
    const trimmed = name.trim();

    if (!trimmed) {
      errs.name = 'Name is required.';
    } else if (trimmed.length < 1 || trimmed.length > 50) {
      errs.name = 'Name must be between 1 and 50 characters.';
    }

    const validSportNames = sportTypes?.map(st => st.sport_name) || [];
    if (!sport || !validSportNames.includes(sport)) {
      errs.sport = 'Please choose a sport.';
    }

    setFieldErrors(errs);
    setFormError(null);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Build sport type map to get sport_type_id from sport name
    const sportTypeMap = buildSportTypeMap(sportTypes);
    const sportTypeId = sportTypeMap[sport];

    if (!sportTypeId) {
      setFormError('Invalid sport type selected. Please refresh and try again.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        sport_type: sportTypeId,
        hourly_rate: hourlyRate,
        opening_time: openingTime,
        closing_time: closingTime,
        availability_start_date: startDate
      };

      await createMut.mutateAsync(payload);
      navigate(`/manager/facility/${facilityId}/courts`, {
        replace: true,
        state: { justCreated: 1 },
      });
    } catch (e) {
      // surface backend errors
      if (e?.code === 'LIMIT_REACHED') {
        setFieldErrors({ name: 'Max 20 courts reached for this facility. Delete one first.' });
      } else if (e?.code === 'DUPLICATE_NAME') {
        setFieldErrors({ name: 'A court with this name already exists.' });
      } else {
        setFormError('Create failed. Please try again.');
      }
    }
  };

  if (sportTypesLoading) {
    return <div className="mx-auto max-w-xl p-6 rounded-2xl border">Loading sport types...</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Create court</h1>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Court name (e.g., Court 1)"
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              fieldErrors.name ? 'border-red-400' : ''
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            1–50 characters; must be unique within this facility.
          </p>
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Sport</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
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
          <label className="block text-sm font-medium">Hourly Rate (AUD)</label>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            min="10"
            max="200"
            step="5"
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${
              fieldErrors.hourlyRate ? 'border-red-400' : ''
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Price per hour ($10-$200 AUD)
          </p>
          {fieldErrors.hourlyRate && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.hourlyRate}</p>
          )}
        </div>

        <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold mb-3">Operating Hours</h3>
          <p className="text-xs text-gray-600 mb-3">
            Set your court's daily operating hours. Availability will be automatically generated.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium mb-1">Opening Time</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Closing Time</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Availability will be generated from this date for 3 months
            </p>
          </div>
        </div>

        {/* form-level error (non-field) */}
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
          <Link
            to={`/manager/facility/${facilityId}/courts`}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createMut.isPending}
            className={`rounded-xl px-4 py-2 text-white ${
              createMut.isPending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {createMut.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
