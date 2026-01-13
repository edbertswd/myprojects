// src/services/courtsApi.js
import api from './api'; // safe to import even if USE_MOCK === true

const USE_MOCK = false;

// Note: This is only used for mock data. In production, fetch sport types from the API using getSportTypes()
export const SPORT_OPTIONS = [
  'Tennis', 'Badminton', 'Basketball', 'Soccer', 'Table Tennis', 'Padel',
];

function delay(ms = 400) { return new Promise(r => setTimeout(r, ms)); }

const mockDb = {}; // facilityId -> courts[]
// mock store for bookings by court
const _mockActiveByCourt = new Map();

/* ------------------------ seeding / mock helpers ------------------------ */
function seedFacility(facilityId) {
  // create 6 demo courts with some active bookings
  mockDb[facilityId] = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    name: `Court ${i + 1}`,
    sport: SPORT_OPTIONS[i % SPORT_OPTIONS.length],
    status: i % 5 === 0 ? 'inactive' : 'active',
    activeBookings: i % 3 === 0 ? 2 : 0, // some have active bookings
  }));

  // seed bookings for each court to power the guards UI
  mockDb[facilityId].forEach(c => _seedBookingsIfMissing(facilityId, c.id));
}

function ensureFacility(facilityId) {
  if (!mockDb[facilityId]) seedFacility(facilityId);
  return mockDb[facilityId];
}

// Seed some upcoming bookings to show the block UI
// function _seedBookingsIfMissing(facilityId, courtId) {
//   const k = `${facilityId}:${courtId}`;
//   if (_mockActiveByCourt.has(k)) return;
//   const now = new Date();
//   const d1 = new Date(now); d1.setDate(now.getDate() + 1); d1.setHours(18, 0, 0, 0);
//   const d2 = new Date(now); d2.setDate(now.getDate() + 3); d2.setHours(9, 0, 0, 0);
//   _mockActiveByCourt.set(k, [
//     { id: `bk-${k}-1`, userName: 'Alice Chen', startISO: d1.toISOString(), durationHrs: 2 },
//     { id: `bk-${k}-2`, userName: 'Ryan Lee',   startISO: d2.toISOString(), durationHrs: 1 },
//   ]);
// }
function _seedBookingsIfMissing(facilityId, courtId) {
  const k = `${facilityId}:${courtId}`;
  if (_mockActiveByCourt.has(k)) return;
  const now = new Date();
  const d1 = new Date(now); d1.setDate(now.getDate() + 1); d1.setHours(18, 0, 0, 0);
  const d2 = new Date(now); d2.setDate(now.getDate() + 3); d2.setHours(9, 0, 0, 0);
  _mockActiveByCourt.set(k, [
    { id: `bk-${k}-1`, userName: 'Alice Chen', email: 'alice.chen@example.com', startISO: d1.toISOString(), durationHrs: 2 },
    { id: `bk-${k}-2`, userName: 'Ryan Lee',   email: 'ryan.lee@example.com',  startISO: d2.toISOString(), durationHrs: 1 },
  ]);
}


/* ------------------------------ CRUD  ----------------------------- */
export async function listCourts({ facilityId, q = '', page = 1, pageSize = 10 }) {
  if (USE_MOCK) {
    await delay();
    const all = ensureFacility(facilityId);
    const k = q.trim().toLowerCase();
    const filtered = !k
      ? all
      : all.filter(
          (c) =>
            c.name.toLowerCase().includes(k) ||
            c.sport.toLowerCase().includes(k)
        );
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { results: filtered.slice(start, end), total: filtered.length, page, pageSize };
  }
  // real request
  const { data } = await api.get(`/manager/facilities/${facilityId}/courts/`);
  // Transform backend response to match frontend expectations
  const courts = data.courts || [];
  const transformed = courts.map(court => ({
    id: court.court_id,
    name: court.name,
    sport: court.sport_name,
    status: court.is_active ? 'active' : 'inactive',
    activeBookings: 0, // Backend doesn't provide this in list view
  }));

  // Apply client-side filtering and pagination since backend doesn't support it yet
  const k = q.trim().toLowerCase();
  const filtered = !k
    ? transformed
    : transformed.filter(
        (c) =>
          c.name.toLowerCase().includes(k) ||
          c.sport.toLowerCase().includes(k)
      );
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { results: filtered.slice(start, end), total: filtered.length, page, pageSize };
}

export async function getCourt({ facilityId, courtId }) {
  if (USE_MOCK) {
    await delay();
    const row = ensureFacility(facilityId).find((c) => String(c.id) === String(courtId));
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 });
    return row;
  }
  // get court details from list endpoint and find the specific court
  const { data } = await api.get(`/manager/facilities/${facilityId}/courts/`);
  const court = data.courts?.find(c => String(c.court_id) === String(courtId));
  if (!court) throw Object.assign(new Error('Not found'), { status: 404 });

  return {
    id: court.court_id,
    name: court.name,
    sport: court.sport_name,
    sport_type_id: court.sport_type,
    status: court.is_active ? 'active' : 'inactive',
    hourly_rate: court.hourly_rate,
    opening_time: court.opening_time,
    closing_time: court.closing_time,
    availability_start_date: court.availability_start_date,
    activeBookings: 0,
  };
}

export async function createCourt({ facilityId, payload }) {
  if (USE_MOCK) {
    await delay();
    const rows = ensureFacility(facilityId);
    if (rows.length >= 20) {
      const err = new Error('Max 20 courts');
      err.code = 'LIMIT_REACHED';
      throw err;
    }
    const dup = rows.some((c) => c.name.trim().toLowerCase() === payload.name.trim().toLowerCase());
    if (dup) {
      const err = new Error('Duplicate name');
      err.code = 'DUPLICATE_NAME';
      throw err;
    }
    const id = (rows.at(-1)?.id || 0) + 1;
    const row = { id, status: 'active', activeBookings: 0, ...payload };
    rows.push(row);
    _seedBookingsIfMissing(facilityId, id);
    return row;
  }

  const { data } = await api.post(`/manager/facilities/${facilityId}/courts/create/`, payload);
  return data;
}

export async function updateCourt({ facilityId, courtId, payload }) {
  if (USE_MOCK) {
    await delay();
    const rows = ensureFacility(facilityId);
    const idx = rows.findIndex((c) => String(c.id) === String(courtId));
    if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });

    if (payload.name) {
      const dup = rows.some(
        (c) =>
          c.id !== Number(courtId) &&
          c.name.trim().toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (dup) {
        const err = new Error('Duplicate name');
        err.code = 'DUPLICATE_NAME';
        throw err;
      }
    }
    rows[idx] = { ...rows[idx], ...payload };
    return rows[idx];
  }
  // real request here…
  const { data } = await api.patch(`/manager/facilities/${facilityId}/courts/${courtId}/`, payload);
  return data;
}

// Simple delete (no guard). Prefer deleteCourtGuarded for UX.
export async function deleteCourt({ facilityId, courtId }) {
  if (USE_MOCK) {
    await delay();
    const rows = ensureFacility(facilityId);
    const idx = rows.findIndex((c) => String(c.id) === String(courtId));
    if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });

    if (rows[idx].activeBookings > 0) {
      const err = new Error('Court has active bookings');
      err.code = 'HAS_ACTIVE_BOOKINGS';
      err.meta = { activeBookings: rows[idx].activeBookings };
      throw err;
    }
    const [removed] = rows.splice(idx, 1);
    _mockActiveByCourt.delete(`${facilityId}:${courtId}`);
    return removed;
  }
  // real request here…
  const { data } = await api.delete(`/manager/facilities/${facilityId}/courts/${courtId}/delete/`);
  return data;
}

/* ------------------------- Guarded delete + summary --------------------- */
export async function getActiveBookingsSummary({ facilityId, courtId }) {
  if (!USE_MOCK) {
    const { data } = await api.get(`/manager/facilities/${facilityId}/courts/${courtId}/active-bookings/summary/`);
    return data; // { count, nextBookings: [{id,userName,startISO,durationHrs}] }
  }
  _seedBookingsIfMissing(facilityId, courtId);
  await delay(250);
  const list = _mockActiveByCourt.get(`${facilityId}:${courtId}`) || [];
  // only future
  const future = list
    .filter(b => new Date(b.startISO) > new Date())
    .sort((a, b) => a.startISO.localeCompare(b.startISO))
    .slice(0, 5);
  return { count: future.length, nextBookings: future };
}

// Hard delete with guard unless force=true (backend should re-check)
export async function deleteCourtGuarded({ facilityId, courtId, force = false }) {
  if (!USE_MOCK) {
    const { data } = await api.delete(`/manager/facilities/${facilityId}/courts/${courtId}/delete/`, { params: { force } });
    return data;
  }
  await delay(300);
  const summary = await getActiveBookingsSummary({ facilityId, courtId });
  if (summary.count > 0 && !force) {
    const err = new Error('HAS_ACTIVE_BOOKINGS');
    err.code = 'HAS_ACTIVE_BOOKINGS';
    err.details = summary;
    throw err;
  }
  // remove from courts mock + bookings mock
  const rows = ensureFacility(facilityId);
  const idx = rows.findIndex((c) => String(c.id) === String(courtId));
  if (idx !== -1) rows.splice(idx, 1);
  _mockActiveByCourt.delete(`${facilityId}:${courtId}`);
  return { ok: true };
}

// Convenience: fetch lightweight court options for dropdowns
export async function listCourtOptions({ facilityId }) {
  // reuse mock list with a large pageSize (mock is small anyway)
  const { results } = await listCourts({ facilityId, q: '', page: 1, pageSize: 200 });
  return results.map(r => ({ id: String(r.id), name: r.name }));
}

// Fetch all sport types
export async function getSportTypes() {
  const { data } = await api.get('/facilities/sport-types/');
  return data;
}
