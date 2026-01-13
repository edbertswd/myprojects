import { useState } from 'react';
import { X, Building2, MapPin, Phone, Clock, Users, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { approveManagerApplication, rejectManagerApplication } from '../../services/adminApi';

/**
 * Manager Application Review Modal
 * Shows full application details and allows admin to approve/reject
 *
 * @param {object} application - The manager application object
 * @param {boolean} open - Whether modal is open
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSuccess - Callback when approve/reject succeeds
 */
export default function ManagerApplicationReviewModal({ application, open, onClose, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [reason, setReason] = useState('');

  if (!open || !application) return null;

  const handleApprove = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for approval');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await approveManagerApplication({
        requestId: application.request_id,
        reason: reason.trim()
      });

      // Success
      if (onSuccess) onSuccess('approved');
      onClose();
      setReason('');
      setAction(null);
    } catch (err) {
      console.error('Failed to approve application:', err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection (required)');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    if (!confirm('Are you sure you want to reject this application? This cannot be undone.')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await rejectManagerApplication({
        requestId: application.request_id,
        reason: reason.trim()
      });

      // Success
      if (onSuccess) onSuccess('rejected');
      onClose();
      setReason('');
      setAction(null);
    } catch (err) {
      console.error('Failed to reject application:', err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (processing) return;
    setReason('');
    setAction(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manager Application Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review application details before making a decision
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Applicant Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-base text-gray-900">{application.user_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-base text-gray-900">{application.user_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">User ID</p>
                <p className="text-base text-gray-900">#{application.user_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Application Date</p>
                <p className="text-base text-gray-900">
                  {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Facility Details */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-4">Facility Details</h3>
            <div className="space-y-4">
              {/* Facility Name */}
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Facility Name</p>
                  <p className="text-base text-gray-900">{application.facility_name}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="text-base text-gray-900">{application.facility_address}</p>
                  {application.proposed_latitude && application.proposed_longitude && (
                    <p className="text-sm text-gray-500 mt-1">
                      Coordinates: {application.proposed_latitude}, {application.proposed_longitude}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Contact Phone</p>
                  <p className="text-base text-gray-900">{application.contact_phone}</p>
                </div>
              </div>

              {/* Timezone */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Timezone</p>
                  <p className="text-base text-gray-900">{application.proposed_timezone}</p>
                </div>
              </div>

              {/* Sport Types */}
              {application.sport_types && application.sport_types.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Sport Types</p>
                    <div className="flex flex-wrap gap-2">
                      {application.sport_types.map((sport, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Court Count */}
              {application.court_count && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Estimated Court Count</p>
                  <p className="text-base text-gray-900">{application.court_count} courts/fields</p>
                </div>
              )}

              {/* Business Experience */}
              {application.business_experience && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Business Experience</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.business_experience}</p>
                  </div>
                </div>
              )}

              {/* Reason/Motivation */}
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-pink-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Reason for Applying</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Action Section */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Admin Decision</h3>

            {/* Action Buttons (if no action selected) */}
            {!action && (
              <div className="flex gap-4">
                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Application
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </button>
              </div>
            )}

            {/* Reason Input (after action selected) */}
            {action && (
              <div className="space-y-4">
                <div className={`rounded-lg border-2 p-4 ${
                  action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className="font-semibold text-gray-900 mb-2">
                    {action === 'approve' ? 'Approving Application' : 'Rejecting Application'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {action === 'approve'
                      ? 'Provide a reason for approval (e.g., "Application meets all requirements")'
                      : 'Provide a reason for rejection (this will be sent to the applicant)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {action === 'reject' && '(Required)'} *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder={
                      action === 'approve'
                        ? 'e.g., Application meets all requirements. Facility details verified.'
                        : 'e.g., Insufficient business experience. Please provide more details about facility management.'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    disabled={processing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/500 characters (minimum 10 required)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAction(null);
                      setReason('');
                      setError(null);
                    }}
                    disabled={processing}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={action === 'approve' ? handleApprove : handleReject}
                    disabled={processing || !reason.trim() || reason.trim().length < 10}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      action === 'approve'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {processing
                      ? 'Processing...'
                      : action === 'approve'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
