import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Clock, Users, FileText } from 'lucide-react';
import { submitManagerApplication } from '../../services/userApi';
import { getSportTypes } from '../../services/courtsApi';
import AddressAutocomplete from '../../components/AddressAutocomplete';

const TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin'
];

export default function ApplyManagerModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sportTypes, setSportTypes] = useState([]);
  const [loadingSportTypes, setLoadingSportTypes] = useState(true);

  const [formData, setFormData] = useState({
    facility_name: '',
    facility_address: '',
    contact_phone: '',
    proposed_timezone: 'Australia/Sydney',
    proposed_latitude: null,
    proposed_longitude: null,
    court_count: '',
    operating_hours: null,
    business_experience: '',
    reason: '',
    sport_type_ids: []
  });

  useEffect(() => {
    if (open) {
      fetchSportTypes();
    }
  }, [open]);

  const fetchSportTypes = async () => {
    try {
      setLoadingSportTypes(true);
      const types = await getSportTypes();
      setSportTypes(types);
    } catch (err) {
      console.error('Failed to load sport types:', err);
      setError('Failed to load sport types. Please refresh the page.');
    } finally {
      setLoadingSportTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      const sportTypeId = parseInt(value);
      setFormData(prev => ({
        ...prev,
        sport_type_ids: checked
          ? [...prev.sport_type_ids, sportTypeId]
          : prev.sport_type_ids.filter(id => id !== sportTypeId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddressSelect = ({ address, latitude, longitude }) => {
    // Format to 6 decimal places as required by backend
    const formattedLat = latitude ? parseFloat(latitude).toFixed(6) : null;
    const formattedLon = longitude ? parseFloat(longitude).toFixed(6) : null;

    setFormData(prev => ({
      ...prev,
      facility_address: address,
      proposed_latitude: formattedLat,
      proposed_longitude: formattedLon,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare data
      const submitData = {
        ...formData,
        court_count: formData.court_count ? parseInt(formData.court_count) : null,
      };

      // Remove empty fields
      if (!submitData.business_experience) delete submitData.business_experience;
      if (!submitData.proposed_latitude) delete submitData.proposed_latitude;
      if (!submitData.proposed_longitude) delete submitData.proposed_longitude;
      if (!submitData.court_count) delete submitData.court_count;

      const response = await submitManagerApplication(submitData);

      // Success
      if (onSuccess) onSuccess(response);
      onClose();

      // Reset form
      setFormData({
        facility_name: '',
        facility_address: '',
        contact_phone: '',
        proposed_timezone: 'Australia/Sydney',
        proposed_latitude: null,
        proposed_longitude: null,
        court_count: '',
        operating_hours: null,
        business_experience: '',
        reason: '',
        sport_type_ids: []
      });
    } catch (err) {
      console.error('Application submission failed:', err);

      // Handle error response
      if (err.response?.data) {
        const errorData = err.response.data;

        if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else {
          // Format field errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          setError(fieldErrors || 'Application submission failed. Please check your input.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply to be a Manager</h2>
            <p className="text-sm text-gray-600 mt-1">Fill out the form to list your facility on CourtConnect</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-900 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Facility Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Facility Name *
            </label>
            <input
              type="text"
              name="facility_name"
              value={formData.facility_name}
              onChange={handleChange}
              required
              placeholder="e.g., Downtown Tennis Club"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Facility Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Facility Address *
            </label>
            <AddressAutocomplete
              value={formData.facility_address}
              onChange={(value) => setFormData(prev => ({ ...prev, facility_address: value }))}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing Australian address..."
              required
              className="px-4 py-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.proposed_latitude && formData.proposed_longitude && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Location verified ({formData.proposed_latitude}, {formData.proposed_longitude})
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Phone *
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              required
              placeholder="e.g., +61 2 1234 5678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timezone *
            </label>
            <select
              name="proposed_timezone"
              value={formData.proposed_timezone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Sport Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Sport Types * (Select all that apply)
            </label>
            {loadingSportTypes ? (
              <div className="text-sm text-gray-500">Loading sport types...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sportTypes.map(sport => (
                  <label key={sport.sport_type_id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={sport.sport_type_id}
                      checked={formData.sport_type_ids.includes(sport.sport_type_id)}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{sport.sport_name}</span>
                  </label>
                ))}
              </div>
            )}
            {formData.sport_type_ids.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Please select at least one sport type</p>
            )}
          </div>

          {/* Court Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Number of Courts/Fields (Optional)
            </label>
            <input
              type="number"
              name="court_count"
              value={formData.court_count}
              onChange={handleChange}
              min="1"
              max="100"
              placeholder="e.g., 5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Business Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Experience (Optional)
            </label>
            <textarea
              name="business_experience"
              value={formData.business_experience}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of your experience managing sports facilities..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Reason/Motivation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Why do you want to become a manager? *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={4}
              minLength={50}
              maxLength={2000}
              placeholder="Tell us why you want to list your facility on CourtConnect... (minimum 50 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.reason.length}/2000 characters (minimum 50 required)
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingSportTypes || formData.sport_type_ids.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
