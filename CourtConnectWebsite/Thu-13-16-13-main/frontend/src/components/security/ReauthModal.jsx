import { useState, useEffect } from 'react';

export default function ReauthModal({
  open,
  onClose,               // () => void
  mode = 'password',     // 'password' | 'otp'
  onVerify,              // async (value) => boolean
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const label = mode === 'otp' ? '2FA code' : 'Password';

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      const ok = await (onVerify?.(value) ?? Promise.resolve(true));
      if (ok) onClose?.();          // Close after verification; continue operation as needed externally
      else alert('Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-2xl border bg-white p-5 shadow-xl"
        >
          <h3 className="text-lg font-semibold">Re-authentication required</h3>
          <p className="mt-1 text-sm text-gray-600">
            Please enter your {label.toLowerCase()} to continue.
          </p>

          <div className="mt-4">
            <input
              type={mode === 'otp' ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === 'otp' ? '123456' : '••••••••'}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded-xl border px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-xl px-4 py-2 text-white ${value ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 opacity-60 cursor-not-allowed'}`}
              disabled={!value || submitting}
            >
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
