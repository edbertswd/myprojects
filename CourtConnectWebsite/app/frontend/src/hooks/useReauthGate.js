import { useEffect, useState, useCallback } from 'react';
import { isUnlocked as _isUnlocked, remainingMs, setReauthUnlock, clearReauthUnlock } from '../utils/reauthGate';
import { adminReauth, adminReauthVerify } from '../services/adminApi';

export function useReauthGate(group = 'admin-sensitive') {
  const [unlocked, setUnlocked] = useState(_isUnlocked(group));
  const [msLeft, setMsLeft] = useState(remainingMs());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);

  // tick countdown
  useEffect(() => {
    const id = setInterval(() => {
      setUnlocked(_isUnlocked(group));
      setMsLeft(remainingMs());
    }, 1000);
    return () => clearInterval(id);
  }, [group]);

  const verify = useCallback(async ({ method, credential }) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminReauth({ method, credential });
      const data = res.data || {};

      // Check if OTP verification is required (two-step flow)
      if (data.requiresVerification) {
        setAwaitingOtp(true);
        setLoading(false);
        return { requiresOtp: true, message: data.message };
      }

      // Password method or direct success - set unlock
      const { token, expiresAt } = data;
      setReauthUnlock({ group, token, expiresAt });
      setUnlocked(true);
      setMsLeft(Math.max(0, expiresAt - Date.now()));
      setAwaitingOtp(false);
      return true;
    } catch (e) {
      setError(e?.error?.message || 'Verification failed');
      clearReauthUnlock();
      setUnlocked(false);
      setAwaitingOtp(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [group]);

  const verifyOtp = useCallback(async (code) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminReauthVerify({ code });
      const { token, expiresAt } = res.data || {};
      setReauthUnlock({ group, token, expiresAt });
      setUnlocked(true);
      setMsLeft(Math.max(0, expiresAt - Date.now()));
      setAwaitingOtp(false);
      return true;
    } catch (e) {
      setError(e?.error?.message || 'OTP verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [group]);

  const reset = useCallback(() => {
    clearReauthUnlock();
    setUnlocked(false);
    setMsLeft(0);
    setAwaitingOtp(false);
    setError('');
  }, []);

  return { unlocked, msLeft, loading, error, awaitingOtp, verify, verifyOtp, reset };
}
