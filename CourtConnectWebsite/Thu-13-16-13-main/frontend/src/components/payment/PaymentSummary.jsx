/**
 * Payment Summary Component
 * Reusable component for displaying payment breakdown
 */
import PropTypes from 'prop-types';

export default function PaymentSummary({
  items = [],
  subtotal,
  discount = 0,
  tax,
  fee = 0,
  total,
  currency = 'AUD',
  className = ''
}) {
  const formatAmount = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Payment Summary</h2>

      <ul className="divide-y text-sm">
        {/* Line items */}
        {items.map((item, index) => (
          <li key={index} className="py-2 flex justify-between">
            <span className="text-gray-700">{item.label}</span>
            <span>{formatAmount(item.amount)}</span>
          </li>
        ))}

        {/* Subtotal */}
        {items.length > 0 && (
          <li className="py-2 flex justify-between">
            <span className="text-gray-700">Subtotal</span>
            <span>{formatAmount(subtotal)}</span>
          </li>
        )}

        {/* Discount */}
        {discount > 0 && (
          <li className="py-2 flex justify-between text-green-700">
            <span>Discount</span>
            <span>-{formatAmount(discount)}</span>
          </li>
        )}

        {/* Tax */}
        <li className="py-2 flex justify-between">
          <span className="text-gray-700">Tax</span>
          <span>{formatAmount(tax)}</span>
        </li>

        {/* Booking fee */}
        {fee > 0 && (
          <li className="py-2 flex justify-between">
            <span className="text-gray-700">Booking Fee</span>
            <span>{formatAmount(fee)}</span>
          </li>
        )}

        {/* Total */}
        <li className="py-2 flex justify-between font-semibold text-base">
          <span>Total ({currency})</span>
          <span>{formatAmount(total)}</span>
        </li>
      </ul>
    </div>
  );
}

PaymentSummary.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ),
  subtotal: PropTypes.number,
  discount: PropTypes.number,
  tax: PropTypes.number.isRequired,
  fee: PropTypes.number,
  total: PropTypes.number.isRequired,
  currency: PropTypes.string,
  className: PropTypes.string
};
