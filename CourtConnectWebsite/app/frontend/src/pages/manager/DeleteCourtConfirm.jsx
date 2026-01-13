// src/pages/manager/DeleteCourtConfirm.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trash2, Power, AlertTriangle } from 'lucide-react';

export default function DeleteCourtConfirm() {
  const { facilityId, courtId } = useParams();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [operationType, setOperationType] = useState('deactivate'); // 'deactivate' or 'delete'

  // Fetch court details to check if it's active
  const { data: courtData } = useQuery({
    queryKey: ['court', facilityId, courtId],
    queryFn: async () => {
      const { data } = await api.get(`/manager/facilities/${facilityId}/courts/`);
      return data.courts?.find(c => String(c.court_id) === String(courtId));
    }
  });

  const isCourtActive = courtData?.is_active;

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/manager/facilities/${facilityId}/courts/${courtId}/delete/`);
      return data;
    },
    onSuccess: () => {
      navigate(`/manager/facility/${facilityId}/courts`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to deactivate court');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/manager/facilities/${facilityId}/courts/${courtId}/delete/`, {
        params: { permanent: true }
      });
      return data;
    },
    onSuccess: () => {
      navigate(`/manager/facility/${facilityId}/courts`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to delete court');
    }
  });

  async function onSubmit() {
    setError('');

    // Check if trying to delete an active court
    if (operationType === 'delete' && isCourtActive) {
      setError('This court is active! Please deactivate the court first.');
      return;
    }

    if (operationType === 'deactivate') {
      deactivateMutation.mutate();
    } else {
      deleteMutation.mutate();
    }
  }

  const isPending = deactivateMutation.isPending || deleteMutation.isPending;
  const isSuccess = deactivateMutation.isSuccess || deleteMutation.isSuccess;

  // Determine required confirmation text based on operation
  const requiredConfirmText = operationType === 'deactivate' ? 'DEACTIVATE' : 'DELETE';
  const isConfirmValid = confirmText === requiredConfirmText;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Manage Court</h1>
      <p className="text-sm text-gray-600 mb-6">
        Managing court <span className="font-medium">#{courtId}</span> in facility <span className="font-medium">#{facilityId}</span>.
      </p>


      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">
        {/* Operation Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-3">Choose Action</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOperationType('deactivate');
                setConfirmText('');
                setError('');
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                operationType === 'deactivate'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Power className={operationType === 'deactivate' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                <div>
                  <div className="font-medium text-gray-900">Deactivate</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Stop accepting bookings but preserve all data
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperationType('delete');
                setConfirmText('');
                setError('');
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                operationType === 'delete'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Trash2 className={operationType === 'delete' ? 'text-red-600' : 'text-gray-400'} size={20} />
                <div>
                  <div className="font-medium text-gray-900">Delete Permanently</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Remove court completely (no active bookings)
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Active Court Warning for Delete */}
        {operationType === 'delete' && isCourtActive && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Cannot Delete Active Court</p>
                <p>This court is currently active. Please deactivate the court first before attempting to delete it permanently.</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {operationType === 'deactivate' ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">About Deactivation:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Court status will be set to inactive</li>
                <li>No new bookings will be accepted</li>
                <li>Existing bookings remain valid</li>
                <li>All historical data is preserved</li>
                <li>Can be reactivated later by editing the court</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">About Permanent Deletion:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Court will be permanently removed</li>
                <li>Cannot be undone</li>
                <li>Court must be inactive first</li>
                <li>Requires no active bookings</li>
                <li>Historical booking data may be preserved for audit</li>
                <li>All availability slots will be deleted</li>
              </ul>
            </div>
          </div>
        )}

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Type <span className="font-mono font-semibold">{requiredConfirmText}</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="rounded-xl border px-3 py-2 w-full max-w-xs"
            placeholder={requiredConfirmText}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isConfirmValid || isPending}
            className={`px-4 py-2 rounded-xl text-white flex items-center gap-2 ${
              isConfirmValid && !isPending
                ? operationType === 'deactivate'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            type="button"
          >
            {operationType === 'deactivate' ? (
              <>
                <Power size={16} />
                {isPending ? 'Deactivating…' : 'Deactivate Court'}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {isPending ? 'Deleting…' : 'Delete Permanently'}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 p-3">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="text-sm text-green-600 rounded-lg border border-green-200 bg-green-50 p-3">
            {operationType === 'deactivate' ? 'Court deactivated successfully!' : 'Court deleted permanently!'}
          </div>
        )}
      </div>
    </div>
  );
}
