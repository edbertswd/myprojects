// src/pages/bookings/BookingCancel.jsx
import { Link } from 'react-router-dom';

/**
 * Booking Cancel Page
 * Displayed when user cancels payment on PayPal
 */
export default function BookingCancel() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Cancel Header */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-amber-900">Payment Cancelled</h1>
        <p className="mt-2 text-amber-800">
          Your payment was cancelled and no charges were made.
        </p>
      </div>

      {/* Information Card */}
      <div className="mt-6 rounded-2xl border p-6">
        <h2 className="text-lg font-semibold mb-3">What happened?</h2>
        <p className="text-gray-700 mb-4">
          You cancelled the payment process on PayPal. Your reservation has not been confirmed
          and will expire shortly.
        </p>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Want to try again?</strong><br />
            You can return to the booking page and complete your reservation before it expires.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            ← Return to Checkout
          </button>
          <Link
            to="/facilities"
            className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Browse Other Facilities
          </Link>
          <Link
            to="/bookings"
            className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            View My Bookings
          </Link>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 rounded-2xl border p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">Having trouble with payment?</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Make sure your PayPal account has sufficient funds</li>
          <li>Check that your payment method is verified</li>
          <li>Try a different payment method if available</li>
          <li>Contact support if the problem persists</li>
        </ul>
      </div>
    </div>
  );
}
