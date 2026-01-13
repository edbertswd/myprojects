// src/services/ratesApi.js
// Mock-first service. Swap to real axios calls when backend is ready.
import api from './api';

const USE_MOCK = false;

// Guardrails - match backend validation (Court model: hourly_rate between $10 and $200)
export const MIN_RATE = 10;      // $10/hr (backend minimum)
export const MAX_RATE = 200;     // $200/hr (backend maximum)
export const STEP     = 1;       // $1

// --- MOCK STORE (per facility + court) ---
const _mockRates = new Map(); // key: `${facilityId}:${courtId}` => { ratePerHour, currency, updatedAt }

function _key(facilityId, courtId) {
  return `${facilityId}:${courtId}`;
}

function _seedIfMissing(facilityId, courtId) {
  const k = _key(facilityId, courtId);
  if (!_mockRates.has(k)) {
    _mockRates.set(k, {
      ratePerHour: 25.0,
      currency: 'AUD',
      updatedAt: new Date().toISOString(),
    });
  }
}

function delay(ms = 350) {
  return new Promise(res => setTimeout(res, ms));
}

export async function getRate({ facilityId, courtId }) {
  if (!USE_MOCK) {
    // Fetch court data from the manager courts endpoint
    const { data } = await api.get(`/manager/facilities/${facilityId}/courts/`);
    const court = data.courts?.find(c => String(c.court_id) === String(courtId));

    if (!court) {
      throw new Error('Court not found');
    }

    return {
      ratePerHour: parseFloat(court.hourly_rate),
      currency: 'AUD',
      updatedAt: court.updated_at,
    };
  }
  _seedIfMissing(facilityId, courtId);
  await delay();
  return _mockRates.get(_key(facilityId, courtId));
}

export async function updateRate({ facilityId, courtId, ratePerHour, currency = 'AUD' }) {
  // Backend validation: rate must be between MIN_RATE and MAX_RATE
  if (ratePerHour < MIN_RATE || ratePerHour > MAX_RATE) {
    const error = new Error('VALIDATION_ERROR');
    error.code = 'VALIDATION_ERROR';
    error.details = { field: 'ratePerHour', min: MIN_RATE, max: MAX_RATE };
    throw error;
  }
  // enforce step increment
  const centsMultiple = Math.round((ratePerHour * 100) % Math.round(STEP * 100));
  if (centsMultiple !== 0) {
    const error = new Error('STEP_ERROR');
    error.code = 'STEP_ERROR';
    error.details = { step: STEP };
    throw error;
  }

  if (!USE_MOCK) {
    // Update court's hourly rate using the manager endpoint
    const { data } = await api.patch(`/manager/facilities/${facilityId}/courts/${courtId}/`, {
      hourly_rate: ratePerHour,
    });

    return {
      ratePerHour: parseFloat(data.hourly_rate),
      currency: 'AUD',
      updatedAt: data.updated_at,
    };
  }

  await delay();
  const next = {
    ratePerHour: Number(ratePerHour),
    currency,
    updatedAt: new Date().toISOString(),
  };
  _mockRates.set(_key(facilityId, courtId), next);
  return next;
}
