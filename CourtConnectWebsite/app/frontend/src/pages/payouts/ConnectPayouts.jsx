import { useState } from 'react';
import ReauthModal from '../../components/security/ReauthModal';

export default function ConnectPayouts() {
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);
  const [mode, setMode] = useState('password'); // 'password' or 'otp'

  const askReauthThen = (provider) => {
    setPendingProvider(provider);
    setMode('password'); // If 2FA is required, change it to 'otp'
    setReauthOpen(true);
  };

  const onVerify = async (val) => {
    // MOCK: Pass if it is not empty; you can also limit it to '123456'
    const ok = !!val.trim();
    if (ok) {
      alert(`${pendingProvider} connect initiated (mock)`);
      setPendingProvider(null);
    }
    return ok;
  };

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Connect Payouts</h1>
      <p className="text-gray-600">Choose a provider to start the (mock) connection flow.</p>

      <div className="grid gap-3">
        <button
          className="rounded-xl border px-4 py-3 text-left hover:bg-gray-50"
          onClick={() => askReauthThen('Stripe')}
        >
          <div className="font-medium">Stripe</div>
          <div className="text-sm text-gray-600">Connect your Stripe account</div>
        </button>

        <button
          className="rounded-xl border px-4 py-3 text-left hover:bg-gray-50"
          onClick={() => askReauthThen('PayPal')}
        >
          <div className="font-medium">PayPal</div>
          <div className="text-sm text-gray-600">Connect your PayPal account</div>
        </button>
      </div>

      {/* Optional: Demonstrate recertification components separately */}
      <div className="pt-2">
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => { setMode('otp'); setPendingProvider('Demo'); setReauthOpen(true); }}
        >
          Open Re-auth (demo)
        </button>
      </div>

      <ReauthModal
        open={reauthOpen}
        onClose={() => { setReauthOpen(false); setPendingProvider(null); }}
        mode={mode}
        onVerify={onVerify}
      />
    </div>
  );
}
