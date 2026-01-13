// src/pages/manager/ApplyForFacility.jsx
import { useNavigate } from 'react-router-dom';
import FacilityForm from '../../components/FacilityForm';

/**
 * Apply for Facility Page
 * Allows managers to submit a facility application
 */
export default function ApplyForFacility() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to manager dashboard after successful submission
    setTimeout(() => {
      navigate('/manager/dashboard');
    }, 2000);
  };

  const handleCancel = () => {
    navigate('/manager/dashboard');
  };

  return (
    <div className="mx-auto max-w-3xl py-8 px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Apply for Facility</h1>
        <p className="text-sm text-gray-600 mt-2">
          Submit your facility details for approval. Once approved, you'll be able to manage courts and bookings.
        </p>
      </div>

      <div className="rounded-2xl border p-6">
        <FacilityForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
