// src/services/scheduleApi.js
// Mock schedule per court. Granularity: 1 hour, local time, weekly window.

const USE_MOCK = true;

// key: `${facilityId}:${courtId}` -> Set of ISO "YYYY-MM-DDTHH:00:00" that are OPEN
const _openSlots = new Map();

function delay(ms=200){ return new Promise(r=>setTimeout(r, ms)); }

// build ISO hours between [start, endExclusive) for default business hours (08:00–22:00)
function defaultWeek(startDateISO) {
  const start = new Date(startDateISO);
  const slots = new Set();
  for (let d=0; d<7; d++) {
    const day = new Date(start); day.setDate(start.getDate()+d);
    for (let h=8; h<22; h++) {
      const t = new Date(day); t.setHours(h,0,0,0);
      slots.add(t.toISOString());
    }
  }
  return slots;
}

function key(facilityId, courtId){ return `${facilityId}:${courtId}`; }

export async function getSchedule({ facilityId, courtId, weekStartISO }) {
  if (!USE_MOCK) throw new Error('real API not wired');
  await delay();
  const k = key(facilityId, courtId);
  if (!_openSlots.has(k)) _openSlots.set(k, new Set()); // empty set means closed everywhere until defined
  // For UX, if a week has no data yet, seed with default business hours for that week only.
  // We don't store per-week; we store all open hours as ISO. So we add defaults for this week once.
  const set = _openSlots.get(k);
  const weekDefaults = defaultWeek(weekStartISO);
  let hasAnyInWeek = false;
  for (const iso of weekDefaults) {
    if (iso.startsWith(weekStartISO)) { /* noop; just a marker */ }
    // check same week by comparing date range
  }
  // detect presence by sampling a few hours
  for (const iso of weekDefaults) { if (set.has(iso)) { hasAnyInWeek = true; break; } }
  if (!hasAnyInWeek) { weekDefaults.forEach(iso => set.add(iso)); }

  // Build return structure for UI
  const result = {};
  for (const iso of weekDefaults) {
    result[iso] = set.has(iso);
  }
  return { slots: result }; // map: ISO -> boolean (open/closed)
}

export async function patchSchedule({ facilityId, courtId, changes }) {
  // changes: { [isoHour]: boolean } meaning set open(true)/closed(false)
  if (!USE_MOCK) throw new Error('real API not wired');
  await delay(250);
  const k = key(facilityId, courtId);
  if (!_openSlots.has(k)) _openSlots.set(k, new Set());
  const set = _openSlots.get(k);
  Object.entries(changes).forEach(([iso, open]) => {
    if (open) set.add(iso); else set.delete(iso);
  });
  return { ok: true, applied: Object.keys(changes).length };
}
