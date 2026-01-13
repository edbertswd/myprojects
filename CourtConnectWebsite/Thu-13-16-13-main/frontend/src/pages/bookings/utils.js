// src/pages/bookings/utils.js
export const canCancelBooking = (startIso, now = new Date()) => {
  const start = new Date(startIso).getTime();
  const diffMs = start - now.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return hours >= 2; // FR3.2 rule
};
