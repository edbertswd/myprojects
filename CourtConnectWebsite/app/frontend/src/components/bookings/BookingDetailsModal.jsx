/**
 * Booking Details Modal
 * Shows booking confirmation/receipt with full details
 */
import { useEffect } from 'react';

export default function BookingDetailsModal({ booking, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!booking) return null;

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || 'confirmed').toLowerCase();
    const badges = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[statusLower] || badges.confirmed;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-8 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Booking Confirmation</h2>
              <p className="text-blue-100">Confirmation #{booking.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadge(booking.status_name)}`}>
              {(booking.status_name || 'Confirmed').replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Body - Receipt Style */}
        <div className="px-6 py-6 space-y-6">
          {/* Booking Details */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Booking Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Facility</span>
                <span className="font-medium text-gray-900">{booking.facility_name}</span>
              </div>
              {booking.court_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Court</span>
                  <span className="font-medium text-gray-900">{booking.court_name}</span>
                </div>
              )}
              {booking.sport_type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sport</span>
                  <span className="font-medium text-gray-900">{booking.sport_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Schedule</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time</span>
                <span className="font-medium text-gray-900">{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Time</span>
                <span className="font-medium text-gray-900">{formatDate(booking.end_time)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {booking.hourly_rate_snapshot && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Payment</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate</span>
                  <span className="font-medium text-gray-900">${booking.hourly_rate_snapshot}/hour</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Paid</span>
                  <span className="text-green-600">${booking.total_price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Booking Date */}
          <div className="text-sm text-gray-500 text-center">
            Booked on {formatDate(booking.created_at)}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
