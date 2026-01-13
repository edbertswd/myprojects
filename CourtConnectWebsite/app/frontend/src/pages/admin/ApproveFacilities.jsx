// src/pages/admin/ApproveFacilities.jsx
import { useEffect, useState } from 'react';
import { getPendingFacilities, approveFacility, rejectFacility } from '../../services/adminApi';

/**
 * Admin page to approve/reject pending facility applications
 */
export default function ApproveFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingFacilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingFacilities();
      setFacilities(response || []);
    } catch (err) {
      console.error('Failed to fetch pending facilities:', err);
      setError(err?.error?.message || 'Failed to load pending facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const handleApprove = async (facilityId) => {
    const reason = prompt('Please provide a reason for approving this facility (minimum 10 characters):');
    if (!reason) return;

    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    setProcessingId(facilityId);
    try {
      await approveFacility({ facilityId, reason: reason.trim() });
      // Remove from list after approval
      setFacilities((prev) => prev.filter((f) => f.facility_id !== facilityId));
    } catch (err) {
      console.error('Failed to approve facility:', err);
      alert(err?.error?.message || err?.detail || 'Failed to approve facility');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (facilityId) => {
    const reason = prompt('Please provide a reason for rejecting this facility (minimum 10 characters):');
    if (!reason) return;

    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    setProcessingId(facilityId);
    try {
      await rejectFacility({ facilityId, reason: reason.trim() });
      // Remove from list after rejection
      setFacilities((prev) => prev.filter((f) => f.facility_id !== facilityId));
    } catch (err) {
      console.error('Failed to reject facility:', err);
      alert(err?.error?.message || err?.detail || 'Failed to reject facility');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Approve Facilities</h1>
        <div className="text-gray-500">Loading pending facilities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Approve Facilities</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Approve Facilities</h1>
        <p className="text-sm text-gray-600 mt-2">
          Review and approve or reject pending facility applications
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center text-gray-500">
          No pending facility applications
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facilities.map((facility) => (
                <tr key={facility.facility_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {facility.facility_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {facility.facility_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {facility.address}
                    </div>
                    <div className="text-xs text-gray-500">
                      {facility.timezone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {facility.manager_name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {facility.manager_email || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(facility.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(facility.facility_id)}
                        disabled={processingId === facility.facility_id}
                        className="rounded-lg bg-green-600 text-white px-3 py-1 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(facility.facility_id)}
                        disabled={processingId === facility.facility_id}
                        className="rounded-lg bg-red-600 text-white px-3 py-1 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
