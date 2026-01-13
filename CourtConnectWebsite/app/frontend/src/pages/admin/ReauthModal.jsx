import { useState, useEffect } from 'react';

export default function ReauthModal({
  open,
  onClose,
  onVerified,
  onVerifyOtp,
  loading = false,
  error = '',
  awaitingOtp = false
}) {
  const [method, setMethod] = useState('password');
  const [credential, setCredential] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCredential('');
      setOtpCode('');
      setOtpMessage('');
    }
  }, [open]);

  if (!open) return null;

  const onSubmit = async () => {
    if (awaitingOtp) {
      // Verify OTP code
      const ok = await onVerifyOtp?.(otpCode);
      if (ok) onClose?.();
    } else if (method === 'otp') {
      // Request OTP to be sent
      const result = await onVerified({ method, credential: '' });
      if (result?.requiresOtp) {
        setOtpMessage(result.message || 'OTP sent to your email');
        setCredential('');
      } else if (result) {
        onClose?.();
      }
    } else {
      // Password verification
      const ok = await onVerified({ method, credential });
      if (ok) onClose?.();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitDisabled()) {
      onSubmit();
    }
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (awaitingOtp) return otpCode.length !== 6;
    if (method === 'password') return credential.trim().length < 4;
    return false; // OTP method doesn't need credential to request code
  };

  const getSubmitButtonText = () => {
    if (loading) return 'Verifying…';
    if (awaitingOtp) return 'Verify Code';
    if (method === 'otp') return 'Send Code';
    return 'Verify';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Admin verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          {awaitingOtp
            ? 'Enter the 6-digit code sent to your email'
            : 'For sensitive actions, please verify with your password or a one-time code.'}
        </p>

        <div className="mt-4 space-y-3">
          {!awaitingOtp && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reauth-method"
                  value="password"
                  checked={method === 'password'}
                  onChange={() => setMethod('password')}
                  disabled={loading}
                />
                Password
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reauth-method"
                  value="otp"
                  checked={method === 'otp'}
                  onChange={() => setMethod('otp')}
                  disabled={loading}
                />
                One-time code
              </label>
            </div>
          )}

          {awaitingOtp ? (
            <>
              {otpMessage && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {otpMessage}
                </div>
              )}
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                maxLength={6}
                autoFocus
              />
            </>
          ) : method === 'password' ? (
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter password"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          ) : (
            <div className="text-sm text-gray-600 bg-gray-50 border rounded-lg px-3 py-2">
              A verification code will be sent to your email address.
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="px-3 py-1.5 rounded border"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
            disabled={isSubmitDisabled()}
            onClick={onSubmit}
          >
            {getSubmitButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
