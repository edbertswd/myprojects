import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AddressAutocomplete from '../../components/AddressAutocomplete';

const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (NSW, ACT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (VIC)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (QLD)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (SA)' },
  { value: 'Australia/Perth', label: 'Perth (WA)' },
  { value: 'Australia/Hobart', label: 'Hobart (TAS)' },
  { value: 'Australia/Darwin', label: 'Darwin (NT)' },
];

export default function ManageEditFacility() {
  const { facilityId } = useParams();
  const [courts, setCourts] = useState([]);
  const [sportTypes, setSportTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    facility_name: '',
    address: '',
    timezone: 'Australia/Sydney',
    latitude: '',
    longitude: '',
    is_active: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingCourt, setEditingCourt] = useState(null);
  const [showCourtForm, setShowCourtForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [facilityRes, courtsRes, sportTypesRes] = await Promise.all([
        api.get(`/manager/facilities/${facilityId}/`),
        api.get(`/manager/facilities/${facilityId}/courts/`),
        api.get('/facilities/sport-types/'),
      ]);

      const fac = facilityRes.data;
      setFormData({
        facility_name: fac.facility_name || '',
        address: fac.address || '',
        timezone: fac.timezone || 'Australia/Sydney',
        latitude: fac.latitude || '',
        longitude: fac.longitude || '',
        is_active: fac.is_active !== undefined ? fac.is_active : true,
      });

      // Set current facility image as preview if it exists
      if (fac.image_url) {
        setImagePreview(fac.image_url);
      }

      setCourts(courtsRes.data.courts || []);
      setSportTypes(sportTypesRes.data || []);
    } catch (err) {
      console.error('Error loading facility:', err);
      setError(err.response?.data?.detail || 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressSelect = ({ address, latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      address,
      latitude: latitude ? parseFloat(latitude).toFixed(6) : '',
      longitude: longitude ? parseFloat(longitude).toFixed(6) : '',
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateFacility = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      // If there's an image file, use FormData, otherwise use JSON
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('facility_name', formData.facility_name);
        formDataToSend.append('address', formData.address);
        formDataToSend.append('timezone', formData.timezone);
        formDataToSend.append('is_active', formData.is_active);
        if (formData.latitude) formDataToSend.append('latitude', formData.latitude);
        if (formData.longitude) formDataToSend.append('longitude', formData.longitude);
        formDataToSend.append('image', imageFile);

        await api.put(`/manager/facilities/${facilityId}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.put(`/manager/facilities/${facilityId}/`, formData);
      }

      setSuccess('Facility updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setImageFile(null); // Clear the file after successful upload
      loadData(); // Reload to get updated image URL
    } catch (err) {
      console.error('Error updating facility:', err);
      setError(err.response?.data?.detail || 'Failed to update facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourt = async (courtId) => {
    if (!confirm('Are you sure you want to deactivate this court?')) return;

    try {
      await api.delete(`/manager/facilities/${facilityId}/courts/${courtId}/delete/`);
      setSuccess('Court deactivated successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadData(); // Reload courts
    } catch (err) {
      console.error('Error deleting court:', err);
      setError(err.response?.data?.error || 'Failed to delete court');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Facility</h1>
        <Link
          to="/manager/dashboard"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {/* Basic Info Section */}
      <section className="rounded-2xl border p-6 space-y-6">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <form onSubmit={handleUpdateFacility} className="space-y-4">
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
              className="w-full rounded-xl border px-3 py-2"
              required
            />
          </div>

          {/* Facility Image */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Facility Image
            </label>
            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview}
                  alt="Facility preview"
                  className="w-48 h-48 object-cover rounded-xl border"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-xl border px-3 py-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a new image to replace the current one
            </p>
          </div>

          {/* Address */}
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
              required
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              required
            >
              {AUSTRALIAN_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lat/Lng (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                readOnly
                className="w-full rounded-xl border px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                readOnly
                className="w-full rounded-xl border px-3 py-2 bg-gray-50"
              />
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

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gray-900 text-white px-6 py-2 hover:bg-black disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update Facility'}
          </button>
        </form>
      </section>

      {/* Courts Section */}
      <section className="rounded-2xl border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Courts ({courts.length}/20)
          </h2>
          {courts.length < 20 && (
            <button
              onClick={() => {
                setEditingCourt(null);
                setShowCourtForm(true);
              }}
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
            >
              Add Court
            </button>
          )}
        </div>

        {/* Courts List */}
        {courts.length === 0 ? (
          <p className="text-gray-500 text-sm">No courts added yet</p>
        ) : (
          <div className="space-y-2">
            {courts.map((court) => (
              <div
                key={court.court_id}
                className="flex items-center justify-between border rounded-xl p-4"
              >
                <div>
                  <div className="font-medium">{court.name}</div>
                  <div className="text-sm text-gray-500">
                    {court.sport_name} • ${court.hourly_rate}/hr •{' '}
                    {court.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCourt(court);
                      setShowCourtForm(true);
                    }}
                    className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {court.is_active && (
                    <button
                      onClick={() => handleDeleteCourt(court.court_id)}
                      className="text-sm rounded-lg border border-red-200 text-red-600 px-3 py-1 hover:bg-red-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Court Form Modal/Inline */}
        {showCourtForm && (
          <CourtFormSection
            facilityId={facilityId}
            court={editingCourt}
            sportTypes={sportTypes}
            onSuccess={() => {
              setShowCourtForm(false);
              setEditingCourt(null);
              loadData();
              setSuccess(editingCourt ? 'Court updated successfully' : 'Court added successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
            onCancel={() => {
              setShowCourtForm(false);
              setEditingCourt(null);
            }}
          />
        )}
      </section>
    </div>
  );
}

function CourtFormSection({ facilityId, court, sportTypes, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: court?.name || '',
    sport_type: court?.sport_type || '',
    hourly_rate: court?.hourly_rate || '',
    is_active: court?.is_active !== undefined ? court.is_active : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      if (court) {
        // Update existing court
        await api.put(`/manager/facilities/${facilityId}/courts/${court.court_id}/`, formData);
      } else {
        // Create new court
        await api.post(`/manager/facilities/${facilityId}/courts/create/`, formData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving court:', err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save court');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t pt-6 space-y-4">
      <h3 className="font-semibold">{court ? 'Edit Court' : 'Add New Court'}</h3>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Court Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Court Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="e.g., Court A"
            required
          />
        </div>

        {/* Sport Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Sport Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.sport_type}
            onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
            className="w-full rounded-xl border px-3 py-2"
            required
          >
            <option value="">Select a sport</option>
            {sportTypes.map((sport) => (
              <option key={sport.sport_type_id} value={sport.sport_type_id}>
                {sport.sport_name}
              </option>
            ))}
          </select>
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Hourly Rate (AUD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
            className="w-full rounded-xl border px-3 py-2"
            min="10"
            max="200"
            step="0.01"
            placeholder="10 - 200"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Must be between $10 and $200</p>
        </div>

        {/* Is Active */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded"
          />
          <label className="ml-2 text-sm font-medium">Court is active</label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-gray-900 text-white px-4 py-2 hover:bg-black disabled:opacity-50"
          >
            {saving ? 'Saving...' : court ? 'Update Court' : 'Add Court'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
