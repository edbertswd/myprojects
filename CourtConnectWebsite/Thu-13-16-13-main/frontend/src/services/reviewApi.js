// src/services/reviewApi.js
import api from './api';

/**
 * Submit a review for a facility based on a booking
 * POST /api/facilities/reviews/
 */
export async function submitReview({ bookingId, rating, comment }) {
  const { data } = await api.post('/facilities/reviews/', {
    booking: bookingId,
    rating: rating,
    comment: comment || ''
  });
  return data;
}

/**
 * Get all reviews for a specific facility
 * GET /api/facilities/{facilityId}/reviews/
 */
export async function getFacilityReviews(facilityId) {
  const { data } = await api.get(`/facilities/${facilityId}/reviews/`);
  // Handle paginated response - return results array if available, otherwise return data
  return data.results || data;
}

/**
 * Check if a booking has been reviewed
 * GET /api/facilities/bookings/{bookingId}/review-status/
 */
export async function checkBookingReviewStatus(bookingId) {
  const { data } = await api.get(`/facilities/bookings/${bookingId}/review-status/`);
  return data;
}

/**
 * Get all reviews by the current user
 * GET /api/facilities/my-reviews/
 */
export async function getMyReviews() {
  const { data } = await api.get('/facilities/my-reviews/');
  return data;
}

/**
 * Update an existing review
 * PUT/PATCH /api/facilities/reviews/{reviewId}/
 */
export async function updateReview(reviewId, { rating, comment }) {
  const { data } = await api.patch(`/facilities/reviews/${reviewId}/`, {
    rating: rating,
    comment: comment || ''
  });
  return data;
}
