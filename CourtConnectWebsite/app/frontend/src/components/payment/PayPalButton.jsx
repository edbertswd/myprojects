/**
 * PayPal Button Component
 * Reusable PayPal Smart Payment Buttons wrapper
 */
import { PayPalButtons } from '@paypal/react-paypal-js';
import PropTypes from 'prop-types';

export default function PayPalButton({
  amount,
  currency = 'AUD',
  onCreateOrder,
  onApprove,
  onError,
  onCancel,
  disabled = false,
  style = {}
}) {
  const defaultStyle = {
    layout: 'vertical',
    color: 'gold',
    shape: 'rect',
    label: 'paypal',
    ...style
  };

  return (
    <PayPalButtons
      disabled={disabled}
      style={defaultStyle}
      createOrder={async (data, actions) => {
        try {
          // IMPORTANT: this must resolve to a string id
          const id = await onCreateOrder({
            amount,
            currency,
            data,
            actions
          });
          return id; // MUST be a string like "3L12..."
        } catch (e) {
          // Show real cause in console to avoid generic SDK parse error
          console.error('createOrder failed:', e?.response?.status, e?.response?.data, e);
          if (onError) onError(e);
          // Re-throw to let the PayPal SDK show the error
          throw e;
        }
      }}
      onApprove={async (data, actions) => {
        try {
          if (actions?.order?.capture) {
            await actions.order.capture();
          }
          // Call the provided onApprove function with order and payer details
          await onApprove({
            orderID: data.orderID,
            payerID: data.payerID,
            currency,
            amount,
            ...data
          });
        } catch (error) {
          console.error('Error approving payment:', error);
          if (onError) onError(error);
        }
      }}
      onCancel={(data) => {
        console.log('Payment cancelled:', data);
        if (onCancel) onCancel(data);
      }}
      onError={(err) => {
        console.error('PayPal error:', err);
        if (onError) onError(err);
      }}
    />
  );
}

PayPalButton.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  onCreateOrder: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onCancel: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.object
};
