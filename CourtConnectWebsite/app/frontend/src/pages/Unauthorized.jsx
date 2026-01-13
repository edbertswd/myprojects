// src/pages/Unauthorized.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleGoBack = () => {
    // Go back to previous page or home if no history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const getRoleMessage = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return 'This page requires administrator privileges.';
    } else if (path.startsWith('/manager')) {
      return 'This page requires manager or administrator privileges.';
    }
    return 'You don\'t have permission to view this page.';
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldX className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Unauthorized Access
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          {getRoleMessage()}
        </p>

        {user && (
          <p className="text-sm text-gray-500 mb-6">
            You are currently logged in as: <span className="font-medium">{user.role}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>

        {/* Additional help text */}
        <p className="text-xs text-gray-500 mt-8">
          If you believe you should have access to this page, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
