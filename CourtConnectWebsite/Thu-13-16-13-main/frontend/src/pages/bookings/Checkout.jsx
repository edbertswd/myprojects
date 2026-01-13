// src/pages/bookings/Checkout.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PayPalButton from '../../components/payment/PayPalButton';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';
import PaymentSummary from '../../components/payment/PaymentSummary';
import { usePayment } from '../../hooks/payment/usePayment';
import { getReservation, cancelReservation } from '../../services/bookingApi';
// import ReauthModal from '../../components/security/ReauthModal'; // optional if you want re-auth

/**
 * Order Detail / Checkout
 * - Reads selection from router location.state:
 *   { facilityId, date, court, start, end, price }
 * - Lets user set participants, extras, promo code, payment method (mock)
 * - Calculates subtotal + tax/fees -> total
 * - Confirm = mock submit, then navigates to /bookings (or a success page)
 */

const TAX_RATE = 0.1;       // 10% tax (example)
const BOOKING_FEE = 2.5;    // flat fee (example)

export default function Checkout() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const selection = state || null;

  // Form state
  const [payment, setPayment] = useState('paypal'); // paypal | stripe
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Reservation state
  const [reservation, setReservation] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [reservationError, setReservationError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Payment hook
  const { createOrder, capture, loading: paymentLoading } = usePayment();


  // Validate reservation on mount
  useEffect(() => {
    async function validateReservation() {
      if (!selection?.reservationId) {
        setReservationError('No reservation found. Please select a time slot again.');
        setReservationLoading(false);
        return;
      }

      try {
        const res = await getReservation(selection.reservationId);
        setReservation(res);
        setTimeRemaining(res.time_remaining_seconds);
        console.log('Reservation validated:', res);
      } catch (err) {
        console.error('Reservation validation failed:', err);
        const errorMsg = err.response?.data?.error?.message ||
                        'Your reservation has expired. Please select your time slots again.';
        setReservationError(errorMsg);
      } finally {
        setReservationLoading(false);
      }
    }

    validateReservation();
  }, [selection]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setReservationError('Your reservation has expired. Please select your time slots again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // Cancel reservation on unmount if not paid
  // Use ref to avoid re-registering cleanup on every reservation change
  const reservationRef = useRef(null);
  useEffect(() => {
    reservationRef.current = reservation;
  }, [reservation]);

  useEffect(() => {
    // Only run on actual component unmount (empty deps)
    return () => {
      const res = reservationRef.current;
      if (res && !res.converted_to_booking) {
        cancelReservation(res.reservation_id).catch(console.error);
      }
    };
  }, []); // Empty deps = only runs on unmount

  // Support multiple slots
  const durationHours = selection?.totalHours ?? 1;
  const pricePerHour = selection?.price ?? 0;
  const base = selection?.totalPrice ?? (pricePerHour * durationHours);
  const subTotal = base;
  const tax = +(subTotal * TAX_RATE).toFixed(2);
  const total = +(subTotal + tax + BOOKING_FEE).toFixed(2);

  if (!selection) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border p-6">
          <h1 className="text-xl font-semibold">No selection found</h1>
          <p className="mt-2 text-gray-600">
            Please pick a timeslot first.
          </p>
          <div className="mt-4">
            <Link to="/facilities" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              Back to search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Create PayPal order
  const handleCreatePayPalOrder = async () => {
    try {
      setPaymentError('');

      if (!reservation) {
        throw new Error('Reservation expired. Please select your slots again.');
      }

      if (timeRemaining <= 0) {
        throw new Error('Reservation expired. Please select your slots again.');
      }

      console.log('Reservation object:', reservation);
      console.log('Creating payment order with:', {
        reservation_id: reservation.reservation_id,
        amount: total,
        currency: 'AUD',
        provider: 'paypal'
      });

      if (!reservation.reservation_id) {
        throw new Error('Invalid reservation: missing reservation_id');
      }

      const orderId = await createOrder({
        reservation_id: reservation.reservation_id,
        amount: total,
        currency: 'AUD',
        provider: 'paypal',
        return_url: `${window.location.origin}/bookings/success`,
        cancel_url: `${window.location.origin}/bookings/cancel`
      });

      console.log('PayPal order ID created:', orderId);
      return orderId;
    } catch (error) {
      console.error('Payment order creation error:', error);
      console.error('Error response:', error.response?.data);
      setPaymentError(error.message);
      throw error;
    }
  };

  // Handle PayPal payment approval
  const handlePayPalApprove = async (data) => {
    try {
      setSubmitting(true);
      setPaymentError('');

      if (!reservation) {
        throw new Error('Reservation expired. Please try again.');
      }

      // Capture the payment
      const captureData = await capture({
        order_id: data.orderID,
        payer_id: data.payerID,
        provider: 'paypal',
        reservation_id: reservation.reservation_id
      });

      console.log('Payment captured:', captureData);

      // Mark reservation as converted to prevent 404 errors
      if (reservation) {
        reservation.converted_to_booking = true;
      }

      // Navigate to success page with actual booking data
      navigate('/bookings?justBooked=1', {
        replace: true,
        state: {
          bookingId: captureData.booking_id,
          paymentId: captureData.payment_id
        },
      });
    } catch (error) {
      setPaymentError(error.message);
      console.error('Payment capture failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PayPal error
  const handlePayPalError = (error) => {
    setPaymentError('Payment failed. Please try again.');
    console.error('PayPal error:', error);
  };

  // Handle PayPal cancel
  const handlePayPalCancel = () => {
    setPaymentError('Payment was cancelled.');
  };

  // const onVerify = async (value) => {
  //   // mock re-auth: any non-empty value passes
  //   if (!value.trim()) return false;
  //   setReauthOpen(false);
  //   await onConfirm(); // continue checkout
  //   return true;
  // };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: order form */}
        <section className="lg:col-span-7 space-y-6">
          {/* Selection summary */}
          <div className="rounded-2xl border p-4">
            <h2 className="text-lg font-semibold">Your selection</h2>
            <dl className="mt-2 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Facility</dt>
                <dd>#{selection.facilityId}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Court</dt>
                <dd>{selection.courtName || selection.court}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Sport</dt>
                <dd>{selection.sport}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Duration</dt>
                <dd>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</dd>
              </div>
              <div className="flex gap-2 col-span-2">
                <dt className="w-24 text-gray-500">Time</dt>
                <dd>
                  {selection.startTime ? new Date(selection.startTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  }) : selection.start}
                  {' – '}
                  {selection.endTime ? new Date(selection.endTime).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  }) : selection.end}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment method */}
          <PaymentMethodSelector
            selectedMethod={payment}
            onChange={setPayment}
            availableMethods={['paypal']}
          />
        </section>

        {/* Right: order summary */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Payment Summary */}
          <PaymentSummary
            items={[
              {
                label: `Court booking (${durationHours} hr @ $${selection?.price ?? 0})`,
                amount: base
              }
            ]}
            subtotal={subTotal}
            discount={0}
            tax={tax}
            fee={BOOKING_FEE}
            total={total}
            currency="AUD"
          />

          {/* Terms & Payment */}
          <div className="rounded-2xl border p-4 space-y-4">
            {/* Reservation loading state */}
            {reservationLoading && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                Validating your reservation...
              </div>
            )}

            {/* Countdown Timer */}
            {reservation && timeRemaining > 0 && !reservationError && (
              <div className={`border px-4 py-3 rounded-lg text-sm ${
                timeRemaining <= 60
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                <p className="font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Time Remaining: {formatTimeRemaining()}
                </p>
                <p className="mt-1 text-xs">Complete payment before the timer expires</p>
              </div>
            )}

            {/* Reservation error message */}
            {reservationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold">Reservation Error</p>
                <p className="mt-1">{reservationError}</p>
                <div className="mt-3 space-x-2">
                  <button
                    onClick={() => window.history.back()}
                    className="inline-block rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm hover:bg-red-50"
                  >
                    ← Select time slots again
                  </button>
                  <Link
                    to="/facilities"
                    className="inline-block rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm hover:bg-red-50"
                  >
                    Return to search
                  </Link>
                </div>
              </div>
            )}

            {/* Payment error message */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {paymentError}
              </div>
            )}

            {/* Agreement checkbox */}
            {reservation && !reservationError && timeRemaining > 0 && (
              <>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the booking terms and the venue's cancellation policy.
                  </span>
                </label>

                {/* Info message when checkbox not checked */}
                {!agree && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    Please agree to the terms to proceed with payment
                  </div>
                )}

                {/* PayPal Button */}
                <div className={!agree ? 'opacity-50 pointer-events-none' : ''}>
                  <PayPalButton
                    amount={total}
                    currency="AUD"
                    onCreateOrder={handleCreatePayPalOrder}
                    onApprove={handlePayPalApprove}
                    onError={handlePayPalError}
                    onCancel={handlePayPalCancel}
                    disabled={!agree || submitting || paymentLoading || reservationLoading || !reservation || timeRemaining <= 0}
                  />
                </div>

                {/* Loading state */}
                {(submitting || paymentLoading) && (
                  <div className="text-center text-sm text-gray-600">
                    Processing payment...
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Optional re-auth flow; uncomment if needed */}
      {/* 
      <ReauthModal
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        mode="password"
        onVerify={onVerify}
      />
      */}
    </div>
  );
}
