import { useState } from 'react';
import PropTypes from 'prop-types';
import AddressAutocomplete from './AddressAutocomplete';
import api from '../services/api';

// Australian timezone options
const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (NSW, ACT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (VIC)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (QLD)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (SA)' },
  { value: 'Australia/Perth', label: 'Perth (WA)' },
  { value: 'Australia/Hobart', label: 'Hobart (TAS)' },
  { value: 'Australia/Darwin', label: 'Darwin (NT)' },
];

/**
 * Facility Form Component
 * Form for creating/editing facilities with Australian address autocomplete and timezone selection
 * Uses AJAX for form submission without page reloads
 *
 * @param {object} initialData - Initial facility data for editing
 * @param {function} onSuccess - Callback when form is successfully submitted
 * @param {function} onCancel - Callback when form is cancelled
 */
export default function FacilityForm({
  initialData = {},
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    facility_name: initialData.facility_name || '',
    address: initialData.address || '',
    timezone: initialData.timezone || 'Australia/Sydney',
    latitude: initialData.latitude || '',
    longitude: initialData.longitude || '',
    is_active: initialData.is_active !== undefined ? initialData.is_active : true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.image_url || null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddressSelect = ({ address, latitude, longitude }) => {
    // Format to 6 decimal places as required by backend
    const formattedLat = latitude ? parseFloat(latitude).toFixed(6) : '';
    const formattedLon = longitude ? parseFloat(longitude).toFixed(6) : '';

    setFormData((prev) => ({
      ...prev,
      address,
      latitude: formattedLat,
      longitude: formattedLon,
    }));
    // Clear address-related errors
    setErrors((prev) => ({
      ...prev,
      address: null,
      latitude: null,
      longitude: null,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }

      setImageFile(file);
      setErrors((prev) => ({ ...prev, image: null }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.facility_name.trim()) {
      newErrors.facility_name = 'Facility name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    // Validate that both lat/long are provided together
    if (formData.latitude && !formData.longitude) {
      newErrors.longitude = 'Longitude is required when latitude is provided';
    }
    if (formData.longitude && !formData.latitude) {
      newErrors.latitude = 'Latitude is required when longitude is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (no page reload)

    // Clear previous messages
    setSuccessMessage('');
    setApiError('');

    if (!validate()) {
      return;
    }

    // Create FormData for multipart/form-data submission (required for file uploads)
    const submitData = new FormData();
    submitData.append('facility_name', formData.facility_name);
    submitData.append('address', formData.address);
    submitData.append('timezone', formData.timezone);
    submitData.append('latitude', formData.latitude || '');
    submitData.append('longitude', formData.longitude || '');
    submitData.append('is_active', formData.is_active);

    // Add image file if selected
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    // AJAX request using Axios
    setLoading(true);
    try {
      const url = initialData.facility_id
        ? `/facilities/${initialData.facility_id}/update/`
        : '/facilities/create/';

      const method = initialData.facility_id ? 'put' : 'post';

      const response = await api[method](url, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Success - show message without page reload
      setSuccessMessage(
        initialData.facility_id
          ? 'Facility updated successfully!'
          : 'Facility created successfully!'
      );

      // Clear form if creating new
      if (!initialData.facility_id) {
        setFormData({
          facility_name: '',
          address: '',
          timezone: 'Australia/Sydney',
          latitude: '',
          longitude: '',
          is_active: true,
        });
        setImageFile(null);
        setImagePreview(null);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

    } catch (error) {
      console.error('Form submission error:', error);

      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data) {
        const backendErrors = {};
        Object.keys(error.response.data).forEach((key) => {
          backendErrors[key] = Array.isArray(error.response.data[key])
            ? error.response.data[key][0]
            : error.response.data[key];
        });
        setErrors(backendErrors);
        setApiError('Please fix the errors below');
      } else if (error.response?.status === 401) {
        setApiError('You must be logged in to create a facility');
      } else {
        setApiError(
          error.response?.data?.message ||
          error.response?.data?.detail ||
          'Failed to submit form. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {apiError}
        </div>
      )}

      {/* Facility Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Facility Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="facility_name"
          value={formData.facility_name}
          onChange={handleChange}
          className={`w-full rounded-xl border px-3 py-2 ${
            errors.facility_name ? 'border-red-500' : ''
          }`}
          placeholder="e.g., Harbour Tennis Club"
          required
        />
        {errors.facility_name && (
          <p className="text-red-500 text-sm mt-1">{errors.facility_name}</p>
        )}
      </div>

      {/* Address with Autocomplete */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          value={formData.address}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, address: value }))
          }
          onAddressSelect={handleAddressSelect}
          className={errors.address ? 'border-red-500' : ''}
          required
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>

      {/* Facility Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Facility Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className={`w-full rounded-xl border px-3 py-2 ${
            errors.image ? 'border-red-500' : ''
          }`}
        />
        {errors.image && (
          <p className="text-red-500 text-sm mt-1">{errors.image}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
        </p>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Facility preview"
              className="w-full max-w-md h-48 object-cover rounded-xl border"
            />
          </div>
        )}
      </div>

      {/* Timezone Dropdown */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Timezone <span className="text-red-500">*</span>
        </label>
        <select
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          className={`w-full rounded-xl border px-3 py-2 ${
            errors.timezone ? 'border-red-500' : ''
          }`}
          required
        >
          {AUSTRALIAN_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>
        )}
      </div>

      {/* Latitude & Longitude (read-only, auto-filled) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            readOnly
            step="any"
            className="w-full rounded-xl border px-3 py-2 bg-gray-50"
            placeholder="Auto-filled from address"
          />
          {errors.latitude && (
            <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            readOnly
            step="any"
            className="w-full rounded-xl border px-3 py-2 bg-gray-50"
            placeholder="Auto-filled from address"
          />
          {errors.longitude && (
            <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      {/* Is Active */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="rounded"
        />
        <label className="ml-2 text-sm font-medium">Facility is active</label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gray-900 text-white px-4 py-3 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData.facility_id ? 'Update Facility' : 'Create Facility'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

FacilityForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
};
