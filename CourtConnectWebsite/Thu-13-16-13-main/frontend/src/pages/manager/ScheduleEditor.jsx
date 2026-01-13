// src/pages/manager/ScheduleEditor.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWeeklySchedule, usePatchSchedule } from '../../hooks/useSchedule';
import { Loader2, PaintBucket, X, RotateCcw, Save } from 'lucide-react';

function startOfWeekISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun...6 Sat
  const diff = (day + 6) % 7; // make Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

function addDaysISO(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

function hoursArray(start=6, end=23){
  return Array.from({length:end-start+1}, (_,i)=>start+i);
}

function formatDateHeader(iso) {
  const d = new Date(iso + 'T12:00:00'); // noon to avoid timezone issues
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return { dayName, day, month, full: `${dayName} ${day} ${month}` };
}

function isWeekend(iso) {
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export default function ScheduleEditor() {
  const { facilityId, courtId } = useParams();
  const [weekStart, setWeekStart] = React.useState(startOfWeekISO());
  const { data, isLoading, isFetching, refetch } = useWeeklySchedule({ facilityId, courtId, weekStartISO: weekStart });
  const patch = usePatchSchedule();

  const [pending, setPending] = React.useState({}); // { isoHour: boolean }
  const [selectMode, setSelectMode] = React.useState('open'); // 'open' | 'close'

  const days = React.useMemo(() => Array.from({length:7}, (_,i)=>addDaysISO(weekStart, i)), [weekStart]);

  const hours = hoursArray(6, 22); // 06:00 - 22:00 grid (visual); business defaults are 08-22 open
  const now = new Date();

  function isPast(iso) {
    const t = new Date(iso);
    return t < now;
  }

  function cellState(iso) {
    const base = data?.slots?.[iso] ?? false;
    return Object.prototype.hasOwnProperty.call(pending, iso) ? pending[iso] : base;
  }

  function hasPendingChange(iso) {
    return Object.prototype.hasOwnProperty.call(pending, iso);
  }

  function toggle(iso) {
    if (isPast(iso)) return;

    const next = !cellState(iso);
    setPending(p => ({ ...p, [iso]: next }));
  }

  function applyMode(iso) {
    if (isPast(iso)) return;
    setPending(p => ({ ...p, [iso]: selectMode === 'open' }));
  }

  async function onSave() {
    if (!Object.keys(pending).length) return;
    try {
      await patch.mutateAsync({ facilityId, courtId, changes: pending, weekStartISO: weekStart });
      setPending({});
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Schedule saved' } }));
      await refetch();
    } catch {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to save schedule' } }));
    }
  }

  function onResetWeek() {
    const changes = {};
    days.forEach(d => {
      for (let h=0; h<24; h++) {
        const t = new Date(d); t.setHours(h,0,0,0);
        const iso = t.toISOString();
        const open = h >= 8 && h < 22;

        if (!isPast(iso)) changes[iso] = open;
      }
    });
    setPending(changes);
  }

  function onDiscardChanges() {
    setPending({});
  }

  const pendingCount = Object.keys(pending).length;
  const isDirty = pendingCount > 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/manager/facility/${facilityId}/courts`} className="text-sm text-gray-600 hover:underline inline-flex items-center gap-1 mb-3">
          ← Back to Courts
        </Link>
        <h1 className="text-2xl font-semibold mb-1">
          Court Schedule Editor
        </h1>
        <p className="text-sm text-gray-600">
          Click cells to toggle availability. Click and drag to paint multiple cells. Past times are locked.
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm"
          onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
          type="button"
        >
          ← Previous
        </button>
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm font-medium"
          onClick={() => setWeekStart(startOfWeekISO())}
          type="button"
        >
          This Week
        </button>
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm"
          onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
          type="button"
        >
          Next →
        </button>
        <div className="ml-2 text-sm text-gray-600">
          Week of <span className="font-medium">{formatDateHeader(weekStart).full}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Paint Mode */}
          <div className="flex items-center gap-2">
            <PaintBucket size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Paint mode:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSelectMode('open')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectMode === 'open'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setSelectMode('close')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectMode === 'close'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Quick Actions */}
          <button
            onClick={onResetWeek}
            className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm inline-flex items-center gap-2"
            type="button"
          >
            <RotateCcw size={16} />
            Reset to Business Hours
          </button>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            {isDirty && (
              <>
                <span className="text-sm text-yellow-600 font-medium">
                  {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
                </span>
                <button
                  onClick={onDiscardChanges}
                  className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm inline-flex items-center gap-2"
                  type="button"
                >
                  <X size={16} />
                  Discard
                </button>
              </>
            )}
            <button
              onClick={onSave}
              disabled={!isDirty || patch.isLoading}
              className={`px-4 py-2 rounded-xl text-white text-sm font-medium inline-flex items-center gap-2 ${
                !isDirty || patch.isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
              }`}
              type="button"
            >
              {patch.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-auto">
        {isLoading ? (
          <div className="p-12 text-center text-gray-600 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={20}/>
            Loading schedule…
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 sticky left-0 z-20">
                  Time
                </th>
                {days.map((d,i) => {
                  const header = formatDateHeader(d);
                  const weekend = isWeekend(d);
                  return (
                    <th
                      key={i}
                      className={`px-3 py-3 text-center font-semibold ${
                        weekend ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700'
                      }`}
                    >
                      <div className="text-xs uppercase tracking-wide">{header.dayName}</div>
                      <div className="text-base">{header.day}</div>
                      <div className="text-xs text-gray-500">{header.month}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => {
                const isGroupStart = h % 3 === 0; // Visual separator every 3 hours
                return (
                  <tr
                    key={h}
                    className={isGroupStart && h !== 6 ? 'border-t-2 border-gray-300' : 'border-t'}
                  >
                    <td className="px-4 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10">
                      {String(h).padStart(2,'0')}:00
                    </td>
                    {days.map((d,i) => {
                      const t = new Date(d);
                      t.setHours(h,0,0,0);
                      const iso = t.toISOString();
                      const past = isPast(iso);
                      const open = cellState(iso);
                      const hasPending = hasPendingChange(iso);
                      const weekend = isWeekend(d);

                      return (
                        <td
                          key={i}
                          className={`px-2 py-2 ${weekend ? 'bg-indigo-50/40' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(iso)}
                            onMouseEnter={(e) => e.buttons === 1 && applyMode(iso)}
                            disabled={past}
                            className={
                              `w-full h-10 rounded-lg border-2 transition-all ` +
                              (past
                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                : hasPending
                                  ? open
                                    ? 'bg-emerald-200 border-yellow-400 hover:bg-emerald-300 shadow-sm'
                                    : 'bg-white border-yellow-400 hover:bg-gray-50 shadow-sm'
                                  : open
                                    ? 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200'
                                    : 'bg-white border-gray-300 hover:bg-gray-100')
                            }
                            title={
                              past
                                ? 'Past time (locked)'
                                : hasPending
                                  ? `Pending: ${open ? 'Open' : 'Closed'}`
                                  : open ? 'Open' : 'Closed'
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border-2 border-gray-300" />
          <span>Closed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-200 border-2 border-yellow-400" />
          <span>Pending Change</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-200 opacity-50" />
          <span>Past (Locked)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-200" />
          <span>Weekend</span>
        </div>
      </div>

      {isFetching && (
        <div className="mt-3 text-sm text-gray-500 flex items-center gap-2 justify-center">
          <Loader2 size={14} className="animate-spin" />
          Refreshing…
        </div>
      )}
    </div>
  );
}
