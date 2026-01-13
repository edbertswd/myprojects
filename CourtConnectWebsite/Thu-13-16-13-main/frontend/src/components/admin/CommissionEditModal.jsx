import { useState } from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Commission Edit Modal
 * Allows admins to adjust facility commission rates
 *
 * @param {object} facility - The facility object with current commission_rate
 * @param {boolean} open - Whether modal is open
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSuccess - Callback when commission is successfully adjusted
 */
export default function CommissionEditModal({ facility, open, onClose, onSuccess }) {
  const [newRate, setNewRate] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !facility) return null;

  // Convert decimal commission rate to percentage for display
  const currentRatePercent = (parseFloat(facility.commission_rate || 0.10) * 100).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newRate || newRate === '') {
      setError('Please enter a new commission rate');
      return;
    }

    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setError('Commission rate must be between 0 and 100');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Import here to avoid circular dependencies
      const { adjustCommissionRate } = await import('../../services/adminApi');

      const response = await adjustCommissionRate({
        facilityId: facility.facility_id,
        newRate: rateNum / 100, // Convert percentage to decimal
        reason: reason.trim(),
        effectiveDate: new Date(effectiveDate).toISOString()
      });

      // Success
      if (onSuccess) onSuccess(response);
      handleClose();
    } catch (err) {
      console.error('Failed to adjust commission:', err);
      setError(
        err?.error?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.new_rate?.[0] ||
        'Failed to adjust commission rate. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setNewRate('');
    setReason('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setError(null);
    onClose();
  };

  const rateChange = newRate ? (parseFloat(newRate) - parseFloat(currentRatePercent)).toFixed(2) : 0;
  const isIncrease = rateChange > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Adjust Commission Rate</h2>
            <p className="text-sm text-gray-600 mt-1">
              {facility.facility_name}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Current Rate Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Current Commission Rate</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{currentRatePercent}%</div>
          </div>

          {/* New Rate Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Commission Rate (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder={currentRatePercent}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
              required
            />
            {newRate && rateChange !== 0 && (
              <div className={`mt-2 flex items-center gap-1 text-sm ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {isIncrease ? '+' : ''}{rateChange}% change
                </span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Adjustment *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why the commission rate is being adjusted..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={submitting}
              required
              minLength={10}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave as today to apply immediately
            </p>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> This adjustment will be logged in the audit trail. The estimated financial impact will be calculated based on recent bookings.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newRate || reason.trim().length < 10}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adjusting...' : 'Adjust Commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
