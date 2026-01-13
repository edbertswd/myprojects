/**
 * Booking API Service
 * Reusable API functions for booking operations
 */
import api from './api';

/**
 * Create a booking
 * @param {number|number[]} availabilityId - Single availability ID or array of IDs for multi-hour bookings
 * @returns {Promise<Object>} Booking response with booking_id
 */
export async function createBooking(availabilityId) {
  const payload = Array.isArray(availabilityId)
    ? { availability_ids: availabilityId }
    : { availability_id: availabilityId };

  const response = await api.post('/bookings/v1/', payload);
  return response.data;
}

/**
 * Get user's bookings
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status
 * @param {boolean} params.upcoming - Show only upcoming bookings
 * @returns {Promise<Array>} List of bookings
 */
export async function getMyBookings({ status, upcoming } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (upcoming !== undefined) params.append('upcoming', upcoming);

  const response = await api.get(`/bookings/v1/my-bookings/?${params}`);
  // Handle paginated response - return results array if available, otherwise return data
  return response.data.results || response.data;
}

/**
 * Get booking details
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} Booking details
 */
export async function getBooking(bookingId) {
  const response = await api.get(`/bookings/v1/${bookingId}/`);
  return response.data;
}

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @param {Object} data - Cancellation data
 * @param {string} data.reason - Cancellation reason
 * @returns {Promise<Object>} Updated booking
 */
export async function cancelBooking(bookingId, data = {}) {
  const response = await api.delete(`/bookings/v1/${bookingId}/cancel/`, {
    data
  });
  return response.data;
}

/**
 * Get booking statistics
 * @returns {Promise<Object>} Booking stats
 */
export async function getBookingStats() {
  const response = await api.get('/bookings/v1/stats/');
  return response.data;
}

// ===================== TEMPORARY RESERVATIONS =====================

/**
 * Create a temporary reservation for availability slots
 * @param {number|number[]} availabilityId - Single or array of availability IDs
 * @returns {Promise<Object>} Reservation with reservation_id, expires_at, time_remaining_seconds
 */
export async function createReservation(availabilityId) {
  const payload = Array.isArray(availabilityId)
    ? { availability_ids: availabilityId }
    : { availability_id: availabilityId };

  const response = await api.post('/bookings/v1/reservations/', payload);
  return response.data;
}

/**
 * Get a specific reservation by ID
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<Object>} Reservation details
 */
export async function getReservation(reservationId) {
  const response = await api.get(`/bookings/v1/reservations/${reservationId}/`);
  return response.data;
}

/**
 * Get user's active reservation if any
 * @returns {Promise<Object|null>} Active reservation or null
 */
export async function getActiveReservation() {
  try {
    const response = await api.get('/bookings/v1/reservations/active/');
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Cancel a reservation
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<void>}
 */
export async function cancelReservation(reservationId) {
  await api.delete(`/bookings/v1/reservations/${reservationId}/`);
}
