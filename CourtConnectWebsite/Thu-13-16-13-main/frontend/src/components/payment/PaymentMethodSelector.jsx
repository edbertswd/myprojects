/**
 * Payment Method Selector Component
 * Reusable component for selecting payment method
 */
import PropTypes from 'prop-types';

export default function PaymentMethodSelector({
  selectedMethod,
  onChange,
  availableMethods = ['paypal'],
  disabled = false,
  className = ''
}) {
  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Payment Method</h2>
      <div className="space-y-3">
        {availableMethods.map((method) => (
          <label
            key={method}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              selectedMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name="payment-method"
              value={method}
              checked={selectedMethod === method}
              onChange={() => onChange(method)}
              disabled={disabled}
              className="mt-1"
            />
            <div>
              <div className="font-medium capitalize">{method}</div>
              <p className="text-sm text-gray-600">
                {method === 'paypal'
                  ? 'Pay securely with PayPal'
                  : 'Use this method to complete your payment'}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

PaymentMethodSelector.propTypes = {
  selectedMethod: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  availableMethods: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  className: PropTypes.string
};
