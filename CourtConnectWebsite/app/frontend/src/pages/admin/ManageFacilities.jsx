// src/pages/admin/ManageFacilities.jsx
import { useEffect, useState, useCallback } from 'react';
import { getAllFacilities, approveFacility, rejectFacility, activateFacility, deactivateFacility } from '../../services/adminApi';
import CommissionEditModal from '../../components/admin/CommissionEditModal';
import { Eye, Filter, Loader2, Edit2, CheckCircle, XCircle, Power, PowerOff } from 'lucide-react';

/**
 * Admin page to review and manage all facility applications
 * Displays a table of facilities with filters and action buttons
 */
export default function ManageFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('approved');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllFacilities({
        approvalStatus: approvalStatusFilter || undefined,
        isActive: isActiveFilter
      });

      // Handle different response formats
      if (Array.isArray(response)) {
        setFacilities(response);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, [approvalStatusFilter, isActiveFilter]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

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
      fetchFacilities(); // Refresh list
      alert('Facility approved successfully!');
    } catch (err) {
      console.error('Failed to approve facility:', err);
      alert(err?.response?.data?.detail || err?.detail || 'Failed to approve facility');
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
      fetchFacilities(); // Refresh list
      alert('Facility rejected successfully!');
    } catch (err) {
      console.error('Failed to reject facility:', err);
      alert(err?.response?.data?.detail || err?.detail || 'Failed to reject facility');
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (facilityId) => {
    const reason = prompt('Please provide a reason for activating this facility (minimum 10 characters):');
    if (!reason) return;

    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    setProcessingId(facilityId);
    try {
      await activateFacility({ facilityId, reason: reason.trim() });
      fetchFacilities(); // Refresh list
      alert('Facility activated successfully!');
    } catch (err) {
      console.error('Failed to activate facility:', err);
      alert(err?.response?.data?.detail || err?.detail || 'Failed to activate facility');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (facilityId) => {
    const reason = prompt('Please provide a reason for deactivating this facility (minimum 10 characters):');
    if (!reason) return;

    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    setProcessingId(facilityId);
    try {
      await deactivateFacility({ facilityId, reason: reason.trim() });
      fetchFacilities(); // Refresh list
      alert('Facility deactivated successfully!');
    } catch (err) {
      console.error('Failed to deactivate facility:', err);
      alert(err?.response?.data?.detail || err?.detail || 'Failed to deactivate facility');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditCommission = (facility) => {
    setSelectedFacility(facility);
    setCommissionModalOpen(true);
  };

  const handleCommissionSuccess = (response) => {
    fetchFacilities(); // Refresh to show updated commission rate
    alert(response.detail || 'Commission rate adjusted successfully');
  };

  // Format commission rate for display
  const formatCommissionRate = (rate) => {
    if (!rate) return '10.00%'; // Default
    const rateNum = parseFloat(rate);
    return `${(rateNum * 100).toFixed(2)}%`;
  };

  if (loading && facilities.length === 0) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Manage Facilities</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading facilities...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Manage Facilities</h1>
          <p className="text-sm text-gray-600 mt-2">
            Review and manage facility applications and commission rates
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Approval Status:</label>
            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Active Status:</label>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchFacilities()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 mb-6">
            {error}
            <button
              onClick={fetchFacilities}
              className="ml-4 text-red-700 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {facilities.length === 0 && !loading ? (
          <div className="rounded-2xl border p-10 text-center text-gray-500">
            No {approvalStatusFilter && approvalStatusFilter !== '' ? approvalStatusFilter : ''} facilities found
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden shadow-sm">
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
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facilities.map((facility) => (
                  <tr
                    key={facility.facility_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {facility.facility_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {facility.facility_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCommissionRate(facility.commission_rate)}
                        </span>
                        <button
                          onClick={() => handleEditCommission(facility)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit commission rate"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          facility.approval_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : facility.approval_status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {facility.approval_status?.charAt(0).toUpperCase() + facility.approval_status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          facility.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {facility.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {facility.created_at
                        ? new Date(facility.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex flex-col gap-2 items-stretch">
                        {/* Show Approve/Reject only for pending facilities */}
                        {facility.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(facility.facility_id)}
                              disabled={processingId === facility.facility_id}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                              title="Approve facility"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(facility.facility_id)}
                              disabled={processingId === facility.facility_id}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                              title="Reject facility"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}

                        {/* Show Activate/Deactivate for non-pending facilities */}
                        {facility.approval_status !== 'pending' && (
                          <>
                            {facility.is_active ? (
                              <button
                                onClick={() => handleDeactivate(facility.facility_id)}
                                disabled={processingId === facility.facility_id}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                                title="Deactivate facility"
                              >
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(facility.facility_id)}
                                disabled={processingId === facility.facility_id}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                                title="Activate facility"
                              >
                                <Power className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission Edit Modal */}
      <CommissionEditModal
        facility={selectedFacility}
        open={commissionModalOpen}
        onClose={() => setCommissionModalOpen(false)}
        onSuccess={handleCommissionSuccess}
      />
    </>
  );
}
