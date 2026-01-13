// src/components/profile/ProfilePanel.jsx
import React from 'react';
import api from '../../services/api';

const USE_API = true; // Backend is ready

export default function ProfilePanel({
  open,
  onClose,
  initialPhone = '',
  onSaved, // (newPhone) => void
}) {
  const [phone, setPhone] = React.useState(initialPhone);
  const [saving, setSaving] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPhone(initialPhone || '');
      setTouched(false);
    }
  }, [open, initialPhone]);


  const isValidPhone = (phone) => {
    if (!phone || phone.trim() === '') return true;
    const pattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.()]*([0-9]{1,4}[-\s.()]*){1,6}$/;
    const digitCount = (phone.match(/\d/g) || []).length;
    return pattern.test(phone.trim()) && digitCount >= 7;
  };
  const valid = isValidPhone(phone);
  const dirty = phone !== (initialPhone || '');

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      if (USE_API) {
        await api.patch('/auth/profile/', { phone_number: phone.trim() });
      } else {

        await new Promise(r => setTimeout(r, 400));
      }
      onSaved?.(phone.trim());
      alert('Phone updated successfully');
      onClose?.();
    } catch {
      alert('Failed to update phone, please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-panel-title"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="profile-panel-title" className="text-lg font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="rounded-xl border px-3 py-1 text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone number</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (!touched) setTouched(true); }}
              onBlur={() => setTouched(true)}
              placeholder="+61 4xx xxx xxx"
              className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${(!valid && touched) ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
            />
            {!valid && touched && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid phone number format.</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-white ${valid && dirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 opacity-60 cursor-not-allowed'}`}
              disabled={!valid || !dirty || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
