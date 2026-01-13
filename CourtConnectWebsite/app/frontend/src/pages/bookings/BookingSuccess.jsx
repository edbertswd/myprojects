// src/pages/bookings/BookingSuccess.jsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePayment } from '../../hooks/payment/usePayment';
import { getPayment } from '../../services/paymentApi';
import PaymentSummary from '../../components/payment/PaymentSummary';

/**
 * Booking Success Page
 * Handles PayPal redirect after user approves payment
 * Captures payment and displays booking confirmation
 */
export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const { capture } = usePayment();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    async function capturePayment() {
      // Get PayPal redirect parameters
      const token = searchParams.get('token') || searchParams.get('orderID');
      const payerId = searchParams.get('PayerID');

      if (!token || !payerId) {
        setError('Missing payment information. Please try booking again.');
        setLoading(false);
        return;
      }

      try {
        console.log('Capturing payment:', { token, payerId });

        // Capture the payment
        const captureResult = await capture({
          order_id: token,
          payer_id: payerId,
          provider: 'paypal'
        });

        console.log('Payment captured:', captureResult);

        // Set booking and payment details
        setBooking({
          booking_id: captureResult.booking_id,
          payment_id: captureResult.payment_id,
          amount: parseFloat(captureResult.amount),
          currency: captureResult.currency,
          status: captureResult.status
        });

        // Fetch full payment details if needed
        if (captureResult.payment_id) {
          try {
            const paymentInfo = await getPayment(captureResult.payment_id);
            setPaymentDetails(paymentInfo);
          } catch (err) {
            console.warn('Could not fetch payment details:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Payment capture failed:', err);
        setError(err.message || 'Failed to complete payment. Please contact support.');
        setLoading(false);
      }
    }

    capturePayment();
  }, [searchParams, capture]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border p-8 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <h2 className="mt-4 text-xl font-semibold">Processing your payment...</h2>
          <p className="mt-2 text-gray-600">Please wait while we confirm your booking.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold">Payment Error</h2>
          </div>
          <p className="mt-3 text-red-800">{error}</p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/facilities"
              className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Back to Search
            </Link>
            <Link
              to="/bookings"
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Success Header */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-green-900">Booking Confirmed!</h1>
        <p className="mt-2 text-green-800">
          Your payment has been processed and your court is reserved.
        </p>
      </div>

      {/* Booking Details */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Booking Information */}
        <div className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Booking ID</dt>
              <dd className="font-mono font-semibold">#{booking.booking_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Payment ID</dt>
              <dd className="font-mono text-xs">{booking.payment_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status</dt>
              <dd>
                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  {booking.status || 'Confirmed'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-gray-600">Amount Paid</dt>
              <dd className="text-lg font-bold text-green-700">
                ${booking.amount.toFixed(2)} {booking.currency}
              </dd>
            </div>
          </dl>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <Link
              to="/bookings"
              className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-white font-medium hover:bg-blue-700"
            >
              View My Bookings
            </Link>
            <Link
              to="/facilities"
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-gray-700 font-medium hover:bg-gray-50"
            >
              Book Another Court
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          {paymentDetails ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Court Booking</span>
                <span className="font-medium">${booking.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium capitalize">{paymentDetails.provider || 'PayPal'}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-base">
                <span>Total Paid</span>
                <span className="text-green-700">${booking.amount.toFixed(2)} {booking.currency}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">${booking.amount.toFixed(2)} {booking.currency}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span>PayPal</span>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong><br />
              A confirmation email has been sent to your registered email address.
              Please arrive at the facility 10 minutes before your booking time.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 rounded-2xl border p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-gray-700">
          If you have any questions about your booking, please visit the{' '}
          <Link to="/bookings" className="text-blue-600 hover:underline">
            My Bookings
          </Link>{' '}
          page or contact the facility directly.
        </p>
      </div>
    </div>
  );
}
