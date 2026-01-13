// src/services/reportsApi.js
// Mock-first utilization + revenue reports
import api from './api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

// Helpers
function delay(ms = 350) { return new Promise(res => setTimeout(res, ms)); }
function startOfDay(d) { const t = new Date(d); t.setHours(0,0,0,0); return t; }
function enumerateDays(from, to) {
  const days = [];
  let cur = startOfDay(from);
  const last = startOfDay(to);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Naive mock generator: assume facility is open 10h/day; each court has 2–6 hours booked/day
function mockDailyRows({ facilityId, from, to, courtId, sport }) {
  const days = enumerateDays(from, to);
  const courts = courtId ? [String(courtId)] : ['Court A', 'Court B', 'Court C'];
  const result = [];

  for (const day of days) {
    for (const c of courts) {
      const seed = (day.getTime() / 86400000 + c.length + Number(facilityId)) % 7;
      const openHours = 10;
      const bookedHours = Math.max(0, Math.min(openHours, Math.round((seed * 9301) % 7) + 2)); // 2..8
      const rate = 25 + ((c.charCodeAt(0) + Number(facilityId)) % 5) * 5; // 25/30/35/40/45
      const revenue = bookedHours * rate;

      result.push({
        date: day.toISOString().slice(0, 10),
        court: c,
        sport: sport || (c.includes('A') ? 'Tennis' : c.includes('B') ? 'Badminton' : 'Pickleball'),
        openHours,
        bookedHours,
        revenue,
      });
    }
  }
  return result;
}

function groupRows(rows, by) {
  const map = new Map();
  const fmtKey = (d) => {
    const dt = new Date(d + 'T00:00:00');
    if (by === 'day') return dt.toISOString().slice(0,10);
    if (by === 'week') {
      const t = new Date(dt);
      const day = (t.getDay() + 6) % 7; // ISO week: Monday=0
      t.setDate(t.getDate() - day);
      return `W${t.getFullYear()}-${t.toISOString().slice(5,7)}-${String(t.getDate()).padStart(2,'0')}`;
    }
    // month
    return dt.toISOString().slice(0,7);
  };

  rows.forEach(r => {
    const key = `${fmtKey(r.date)}|${r.court}`;
    const prev = map.get(key) || { openHours: 0, bookedHours: 0, revenue: 0, court: r.court, bucket: key.split('|')[0] };
    prev.openHours += r.openHours;
    prev.bookedHours += r.bookedHours;
    prev.revenue += r.revenue;
    map.set(key, prev);
  });

  return Array.from(map.values());
}

export async function getUtilizationReport({
  facilityId,
  from,         // ISO yyyy-mm-dd
  to,           // ISO yyyy-mm-dd
  groupBy,      // 'day' | 'week' | 'month'
  courtId,      // optional
  sport,        // optional
}) {
  if (!USE_MOCK) {
    const { data } = await api.get(`/facilities/${facilityId}/reports/utilization`, {
      params: { from, to, groupBy, courtId, sport },
    });
    return data; // { rows: [{ bucket, court, openHours, bookedHours, revenue }], totals: {...} }
  }

  await delay();
  const daily = mockDailyRows({ facilityId, from: new Date(from), to: new Date(to), courtId, sport });
  const grouped = groupRows(daily, groupBy);
  const totals = grouped.reduce((acc, r) => {
    acc.openHours += r.openHours;
    acc.bookedHours += r.bookedHours;
    acc.revenue += r.revenue;
    return acc;
  }, { openHours: 0, bookedHours: 0, revenue: 0 });

  return { rows: grouped, totals };
}
