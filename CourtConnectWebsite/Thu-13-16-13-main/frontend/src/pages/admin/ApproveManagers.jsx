// src/pages/admin/ApproveManagers.jsx
import { useEffect, useState, useCallback } from 'react';
import { getManagerApplications } from '../../services/adminApi';
import ManagerApplicationReviewModal from './ManagerApplicationReviewModal';
import { Eye, Filter, Loader2 } from 'lucide-react';

/**
 * Admin page to review and approve/reject manager applications
 * Displays a table of applications with filters and detailed review modal
 */
export default function ApproveManagers() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getManagerApplications({
        status: statusFilter,
        page: page,
        pageSize: 20
      });

      // Handle different response formats
      if (response?.data) {
        setApplications(response.data);
        if (response.meta) {
          setTotalPages(Math.ceil(response.meta.total / response.meta.pageSize));
        }
      } else if (Array.isArray(response)) {
        setApplications(response);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to fetch manager applications:', err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to load manager applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedApplication(null);
  };

  const handleActionSuccess = (action) => {
    // Refresh the list after approve/reject
    fetchApplications();
    alert(`Application ${action} successfully!`);
  };

  if (loading && applications.length === 0) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-6">Manager Applications</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Manager Applications</h1>
        <p className="text-sm text-gray-600 mt-2">
          Review and manage manager applications
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchApplications()}
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
            onClick={fetchApplications}
            className="ml-4 text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {applications.length === 0 && !loading ? (
        <div className="rounded-2xl border p-10 text-center text-gray-500">
          No {statusFilter && statusFilter !== '' ? statusFilter : ''} applications found
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {applications.map((application) => (
                  <tr
                    key={application.request_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(application)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {application.user_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.user_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.facility_name}
                      </div>
                      {application.court_count && (
                        <div className="text-xs text-gray-500">
                          {application.court_count} courts
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate">
                        {application.facility_address}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.proposed_timezone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {application.sport_types && application.sport_types.length > 0 ? (
                          application.sport_types.slice(0, 2).map((sport, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                            >
                              {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                        {application.sport_types && application.sport_types.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{application.sport_types.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          application.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : application.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.created_at
                        ? new Date(application.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(application);
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      <ManagerApplicationReviewModal
        application={selectedApplication}
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
