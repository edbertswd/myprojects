// src/pages/bookings/ChooseTimeslot.jsx
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { createReservation } from '../../services/bookingApi';
import { detectUserTimezone } from '../../utils/datetime';

/**
 * Choose Court / Timeslot (Facility-scoped)
 * - Left: date picker + "Your Selection" summary
 * - Right: perfectly aligned grid (Courts × Times) via CSS Grid
 * - Colors:
 *   ROSE     = unavailable
 *   EMERALD  = available
 *   GRAY     = limited/unknown
 *   BLUE     = selected
 */

// unified sizes → perfect alignment
const COL_W = 56; // px for each time column (wider for better readability)
const LABEL_W = 100; // px for the left court name column

const COLOR = {
  unavailable: 'bg-rose-100 border-rose-300',
  available: 'bg-emerald-100 border-emerald-400',
  limited: 'bg-gray-100 border-gray-300',
  selected: 'bg-blue-600 border-blue-700 text-white',
  past: 'bg-gray-200 border-gray-400',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Format time from ISO string to HH:MM format in user's timezone
 */
function formatTimeSlot(isoString, timezone = null) {
  const tz = timezone || detectUserTimezone();
  const date = new Date(isoString);

  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date);
}

export default function ChooseTimeslot() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const facilityId = params.get('facility');
  const sportFilter = params.get('sport');
  const [date, setDate] = useState(params.get('date') || todayISO());

  // Detect user timezone
  const userTimezone = useMemo(() => detectUserTimezone(), []);

  // State
  const [facility, setFacility] = useState(null);
  const [courts, setCourts] = useState([]);
  const [availabilityData, setAvailabilityData] = useState({}); // { courtId: [availability slots] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]); // Array of { courtIndex, hourIndex, availabilityId, courtId, slot }

  // Load facility data
  useEffect(() => {
    const loadFacility = async () => {
      try {
        const { data } = await api.get(`/facilities/${facilityId}/`);
        setFacility(data);
      } catch (err) {
        console.error('Failed to load facility:', err);
        setError('Failed to load facility details');
      }
    };
    loadFacility();
  }, [facilityId]);

  // Load courts for the facility
  useEffect(() => {
    const loadCourts = async () => {
      try {
        const { data } = await api.get(`/facilities/${facilityId}/courts/`);
        // Filter by sport if sport parameter is provided
        const filteredCourts = sportFilter
          ? (data || []).filter(court => court.sport_name === sportFilter)
          : (data || []);
        setCourts(filteredCourts);
      } catch (err) {
        console.error('Failed to load courts:', err);
        setError('Failed to load courts');
      }
    };
    loadCourts();
  }, [facilityId, sportFilter]);

  // Load availability for all courts on the selected date
  useEffect(() => {
    if (courts.length === 0) return;

    const loadAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load availability for each court
        const availabilityPromises = courts.map(court =>
          api.get(`/facilities/courts/${court.court_id}/availability/`, {
            params: {
              start_date: `${date}T00:00:00`,
              end_date: `${date}T23:59:59`,
            }
          }).then(res => ({ courtId: court.court_id, data: res.data }))
            .catch(() => ({ courtId: court.court_id, data: [] }))
        );

        const results = await Promise.all(availabilityPromises);

        // Convert to object map
        const availabilityMap = {};
        results.forEach(({ courtId, data }) => {
          availabilityMap[courtId] = data || [];
        });

        setAvailabilityData(availabilityMap);
        setSelected([]);
      } catch (err) {
        console.error('Failed to load availability:', err);
        setError('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [courts, date]);

  // Extract unique hours from all availability data
  const hours = useMemo(() => {
    const hourSet = new Set();

    Object.values(availabilityData).forEach(slots => {
      slots.forEach(slot => {
        const hourKey = formatTimeSlot(slot.start_time);
        hourSet.add(hourKey);
      });
    });

    return Array.from(hourSet).sort();
  }, [availabilityData]);

  // Build availability matrix [courtIndex][hourIndex]
  const availabilityMatrix = useMemo(() => {
    const now = new Date();

    return courts.map(court => {
      const courtSlots = availabilityData[court.court_id] || [];

      return hours.map(hourKey => {
        const slot = courtSlots.find(s => {
          const slotHour = formatTimeSlot(s.start_time);
          return slotHour === hourKey;
        });

        if (!slot) return { state: 'unavailable', slot: null };

        // Check if slot is in the past - mark as 'past' instead of hiding
        const slotStartTime = new Date(slot.start_time);
        if (slotStartTime <= now) {
          return { state: 'past', slot };
        }

        return {
          state: slot.is_available ? 'available' : 'unavailable',
          slot
        };
      });
    });
  }, [courts, hours, availabilityData]);

  // Select/deselect cells (supports multiple consecutive slots on same court)
  const clickCell = (r, c) => {
    const cellData = availabilityMatrix[r]?.[c];
    if (!cellData || cellData.state !== 'available') return;

    const newSelection = {
      courtIndex: r,
      hourIndex: c,
      availabilityId: cellData.slot.availability_id,
      courtId: courts[r].court_id,
      slot: cellData.slot
    };

    setSelected(prev => {
      // Check if this cell is already selected
      const existingIndex = prev.findIndex(
        s => s.courtIndex === r && s.hourIndex === c
      );

      if (existingIndex !== -1) {
        // Deselect: remove from array
        return prev.filter((_, i) => i !== existingIndex);
      }

      // If selecting on a different court, start fresh
      if (prev.length > 0 && prev[0].courtIndex !== r) {
        return [newSelection];
      }

      // Add to selection
      return [...prev, newSelection];
    });
  };

  const selectedInfo = useMemo(() => {
    if (!selected || selected.length === 0) return null;

    // Sort by hour index to get chronological order
    const sortedSelections = [...selected].sort((a, b) => a.hourIndex - b.hourIndex);

    const court = courts[sortedSelections[0].courtIndex];
    const firstSlot = sortedSelections[0].slot;
    const lastSlot = sortedSelections[sortedSelections.length - 1].slot;

    // Check if slots are consecutive
    const isConsecutive = sortedSelections.every((sel, idx) => {
      if (idx === 0) return true;
      return sel.hourIndex === sortedSelections[idx - 1].hourIndex + 1;
    });

    const totalHours = sortedSelections.length;
    const totalPrice = court.hourly_rate * totalHours;

    return {
      courtId: court.court_id,
      courtName: court.name,
      facilityId: court.facility,
      sport: court.sport_name,
      startTime: firstSlot.start_time,
      endTime: lastSlot.end_time,
      availabilityIds: sortedSelections.map(s => s.availabilityId),
      availabilityId: firstSlot.availability_id, // Keep for backward compatibility
      price: court.hourly_rate,
      totalPrice,
      totalHours,
      isConsecutive,
      date,
      slots: sortedSelections.map(s => s.slot),
    };
  }, [selected, courts, date]);

  const [reserving, setReserving] = useState(false);
  const [reservationError, setReservationError] = useState('');

  const confirm = async () => {
    if (!selectedInfo) return;

    // Warn if slots are not consecutive
    if (!selectedInfo.isConsecutive) {
      if (!window.confirm('Selected time slots are not consecutive. Continue anyway?')) {
        return;
      }
    }

    setReserving(true);
    setReservationError('');

    try {
      // Create temporary reservation
      const reservation = await createReservation(selectedInfo.availabilityIds);
      console.log('Reservation created:', reservation);

      // Navigate to checkout with reservation ID
      navigate('/order/confirm', {
        state: {
          reservationId: reservation.reservation_id,
          courtId: selectedInfo.courtId,
          courtName: selectedInfo.courtName,
          facilityId: selectedInfo.facilityId,
          availabilityId: selectedInfo.availabilityId,
          availabilityIds: selectedInfo.availabilityIds,
          startTime: selectedInfo.startTime,
          endTime: selectedInfo.endTime,
          price: selectedInfo.price,
          totalPrice: selectedInfo.totalPrice,
          totalHours: selectedInfo.totalHours,
          sport: selectedInfo.sport,
          expiresAt: reservation.expires_at,
        },
      });
    } catch (err) {
      console.error('Failed to create reservation:', err);
      const errorMsg = err.response?.data?.error?.message ||
                      err.response?.data?.error ||
                      'Failed to reserve time slots. Please try again.';
      setReservationError(errorMsg);
    } finally {
      setReserving(false);
    }
  };

  // Check if facility ID is provided
  if (!facilityId) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          No facility selected. Please select a facility first.
        </div>
        <button
          onClick={() => navigate('/facilities')}
          className="mt-4 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Browse Facilities
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">
          {facility ? `Book at ${facility.facility_name}` : 'Choose Timeslot'}
        </h1>
        {facility && (
          <p className="text-sm text-gray-600">{facility.address}</p>
        )}
        {sportFilter && (
          <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium">
            {sportFilter}
          </div>
        )}
      </div>

      {/* Timezone info banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <span>🕐</span>
          <span>Times shown in your timezone: <strong>{userTimezone.replace('Australia/', '')}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left rail */}
        <aside className="md:col-span-3 space-y-4">
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Select Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayISO()}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Selection</h3>
            {!selectedInfo ? (
              <div className="text-sm text-gray-500 mt-2">
                Click time slots to select. You can select multiple consecutive hours on the same court.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-emerald-100 text-emerald-700 px-3 py-1.5 font-semibold text-sm w-fit">
                  {selectedInfo.sport}
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-gray-900">{selectedInfo.courtName}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedInfo.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatTimeSlot(selectedInfo.startTime)} – {formatTimeSlot(selectedInfo.endTime)}
                  </div>
                  <div className="text-sm text-gray-600 pt-1">
                    {selectedInfo.totalHours} {selectedInfo.totalHours === 1 ? 'hour' : 'hours'} × ${selectedInfo.price}/hr
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${selectedInfo.totalPrice}
                  </div>
                  {!selectedInfo.isConsecutive && (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      ⚠️ Slots are not consecutive
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => setSelected([])}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right: grid area */}
        <section className="md:col-span-9">
          <div className="rounded-2xl border bg-white shadow-sm overflow-auto">
            {loading ? (
              <div className="text-center py-16 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading availability...
              </div>
            ) : courts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                No courts available at this facility for {sportFilter || 'this sport'}
              </div>
            ) : hours.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                No availability for {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
                <div className="mt-2 text-sm">
                  Try selecting a different date
                </div>
              </div>
            ) : (
              <div className="p-4">
                {/* CSS Grid wrapper: 1 label column + N time columns */}
                <div
                  className="grid gap-2 mb-6"
                  style={{
                    gridTemplateColumns: `${LABEL_W}px repeat(${hours.length}, ${COL_W}px)`,
                  }}
                >
                  {/* Header row */}
                  <div className="sticky left-0 bg-white z-10" /> {/* empty over the label column */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="text-xs font-semibold text-gray-700 px-2 py-2 text-center rounded-lg bg-gray-50"
                    >
                      {h}
                    </div>
                  ))}

                  {/* Court rows */}
                  {courts.map((court, r) => (
                    <Fragment key={court.court_id}>
                      <div className="text-sm font-medium text-gray-900 px-3 py-2 text-left rounded-lg bg-gray-50 sticky left-0 z-10">
                        {court.name}
                      </div>
                      {hours.map((h, c) => {
                        const isSel = selected.some(
                          s => s.courtIndex === r && s.hourIndex === c
                        );
                        const cellData = availabilityMatrix[r]?.[c] || { state: 'unavailable' };
                        const state = cellData.state;
                        const colorClass = isSel
                          ? COLOR.selected
                          : state === 'available'
                          ? COLOR.available
                          : state === 'limited'
                          ? COLOR.limited
                          : state === 'past'
                          ? COLOR.past
                          : COLOR.unavailable;

                        return (
                          <button
                            key={h}
                            onClick={() => clickCell(r, c)}
                            disabled={state !== 'available'}
                            className={`
                              h-12 rounded-lg border-2 transition-all
                              ${colorClass}
                              ${state === 'available' && !isSel ? 'hover:bg-emerald-200 hover:shadow-sm' : ''}
                              ${state !== 'available' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                              ${isSel ? 'shadow-md' : ''}
                            `}
                            aria-label={`${court.name} at ${h} (${state})`}
                            title={`${court.name} • ${h} • ${state === 'past' ? 'Past' : `$${court.hourly_rate}/hour`}`}
                          />
                        );
                      })}
                    </Fragment>
                  ))}

                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">
                  <Legend color="bg-emerald-100 border-2 border-emerald-400" label="Available" />
                  <Legend color="bg-rose-100 border-2 border-rose-300" label="Unavailable" />
                  <Legend color="bg-gray-200 border-2 border-gray-400" label="Past" />
                  <Legend color="bg-blue-600 border-2 border-blue-700" label="Selected" text="text-white" />
                </div>

                {/* Reservation error */}
                {reservationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-semibold">Reservation Error</p>
                    <p className="mt-1">{reservationError}</p>
                  </div>
                )}

                {/* Confirm button */}
                <button
                  className={`w-full rounded-xl px-4 py-3 text-white font-medium transition-colors shadow-sm ${
                    selectedInfo && !reserving ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!selectedInfo || reserving}
                  onClick={confirm}
                >
                  {reserving ? 'Reserving slots...' : selectedInfo ? 'Continue to Checkout' : 'Select a time slot to continue'}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Legend({ color, label, text = '' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-4 w-4 rounded ${color} ${text}`} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

/**
 * TimeSlotGrid - Reusable time slot grid component
 * Can be used for time range selection or court booking
 */
export function TimeSlotGrid({
  hours = [],
  rows = ['Time'],
  getCellState,
  onCellClick,
  showPrices = false,
  pricePerHour = 0,
  columnWidth = 48,
  labelWidth = 64,
  colors = {
    unavailable: 'bg-red-300',
    available: 'bg-green-200',
    limited: 'bg-gray-200',
    selected: 'bg-black text-white',
  }
}) {
  return (
    <div className="rounded-2xl border p-4">
      {/* CSS Grid wrapper */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `${labelWidth}px repeat(${hours.length}, ${columnWidth}px)`,
        }}
      >
        {/* Header row */}
        <div /> {/* empty over the label column */}
        {hours.map((h) => (
          <div
            key={h}
            className="text-xs text-gray-700 px-1 py-1 text-center rounded bg-gray-100"
          >
            {h}
          </div>
        ))}

        {/* Data rows */}
        {rows.map((label, r) => (
          <Fragment key={label}>
            <div className="text-xs text-gray-700 px-2 py-1 text-center rounded bg-gray-100">
              {label}
            </div>
            {hours.map((h, c) => {
              const state = getCellState(r, c);
              const bg = colors[state] || colors.available;

              return (
                <button
                  key={h}
                  onClick={() => onCellClick(r, c)}
                  className={`h-8 w-12 rounded border border-white box-border ${bg} transition-colors hover:opacity-80`}
                  aria-label={`${label} at ${h} (${state})`}
                  title={`${label} • ${h}`}
                />
              );
            })}
          </Fragment>
        ))}

        {/* Prices row (footer)*/}
        {showPrices && (
          <>
            <div />
            {hours.map((h) => (
              <div
                key={h}
                className="text-xs text-gray-700 px-1 py-1 text-center rounded bg-gray-100"
              >
                ${pricePerHour}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
