import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';

const ProfileSettings = () => {
  const { user, updatePhone, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user) {
      setMfaEnabled(user.mfa_enabled || false);
      setPhoneNumber(user.phone_number || '');
    }
  }, [user]);

  const handleToggleMfa = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const newValue = !mfaEnabled;

      // Update on backend
      const res = await api.patch('/auth/profile/', {
        mfa_enabled: newValue,
      });

      // Update local state
      setMfaEnabled(newValue);
      setUser(res.data);

      setSuccess(
        newValue
          ? 'MFA enabled! You will receive a code via email on next login.'
          : 'MFA disabled. You can login with just your password.'
      );
    } catch (err) {
      console.error('Failed to update MFA:', err);
      setError('Failed to update MFA setting');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();

    // Validate phone number format if not empty
    if (phoneNumber.trim() !== '') {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.()]*([0-9]{1,4}[-\s.()]*){1,6}$/;
      const digitCount = (phoneNumber.match(/\d/g) || []).length;
      if (!phoneRegex.test(phoneNumber.trim()) || digitCount < 7) {
        setPhoneError('Invalid phone number format');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setPhoneError('');

      await api.patch('/auth/profile/', {
        phone_number: phoneNumber,
      });

      updatePhone(phoneNumber);
      setSuccess('Phone number updated successfully');
    } catch (err) {
      console.error('Failed to update phone:', err);
      setError('Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="mt-1 text-gray-900">{user.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Number */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        <form onSubmit={handleUpdatePhone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPhoneError('');
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                phoneError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+61 400 000 000"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Phone'}
          </button>
        </form>
      </div>

      {/* Security Settings - MFA */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Security</h2>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Two-Factor Authentication (2FA)
              </h3>
              {mfaEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Enabled
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {mfaEnabled
                ? 'You will receive a 6-digit code via email each time you login. This adds an extra layer of security to your account.'
                : 'Enable two-factor authentication to receive a verification code via email when you login. This helps protect your account from unauthorized access.'}
            </p>
          </div>

          <button
            onClick={handleToggleMfa}
            disabled={loading}
            className={`ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
              mfaEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                mfaEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {mfaEnabled && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  Make sure you have access to <strong>{user.email}</strong> to receive verification codes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
