// src/services/managerApi.js
import api from './api';

/**
 * Fetch manager overview data (bookings today, next 7 days, facilities)
 * GET /api/manager/overview/
 */
export async function getManagerOverview() {
  const { data } = await api.get('/manager/overview/');
  return data;
}

/**
 * Fetch list of facilities owned by the manager
 * GET /api/manager/facilities/
 */
export async function getManagerFacilities() {
  const { data } = await api.get('/manager/facilities/');
  // Handle paginated response - return results array if available, otherwise return data
  return data.results || data;
}

/**
 * Fetch a single facility owned by the manager
 * GET /api/manager/facilities/{id}/
 */
export async function getManagerFacility(facilityId) {
  const { data } = await api.get(`/manager/facilities/${facilityId}/`);
  return data;
}

/**
 * Update a facility owned by the manager
 * PUT/PATCH /api/manager/facilities/{id}/
 */
export async function updateManagerFacility(facilityId, payload) {
  const { data } = await api.patch(`/manager/facilities/${facilityId}/`, payload);
  return data;
}
