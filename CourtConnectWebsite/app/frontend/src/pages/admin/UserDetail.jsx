import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAdminUser, useSuspendUser, useUnsuspendUser, useModifyUserRoles } from '../../hooks/useAdminUser';
import { useReauthGate } from '../../hooks/useReauthGate';
import SuspendDialog from './SuspendDialog';
import RolesDialog from './RolesDialog';
import ReauthModal from './ReauthModal';

export default function UserDetail() {
  const { userId } = useParams();
  const nav = useNavigate();
  const { data: user, isLoading, isError } = useAdminUser(userId);

  // dialogs
  const [openSuspend, setOpenSuspend] = useState(false);
  const [openRoles, setOpenRoles] = useState(false);
  const [showReauth, setShowReauth] = useState(false);

  // mutations
  const suspendMut = useSuspendUser(userId);
  const unsuspendMut = useUnsuspendUser(userId);
  const rolesMut = useModifyUserRoles(userId);

  // reauth gate for sensitive actions
  const gate = useReauthGate('admin-sensitive');
  const secondsLeft = Math.floor(gate.msLeft / 1000);

  const ensureUnlockedThen = async (fnOpenDialog) => {
    if (gate.unlocked) {
      fnOpenDialog();
    } else {
      setShowReauth(true);
      // onVerified in modal will re-open the dialog
      _pendingOpen = fnOpenDialog; // see simple closure trick below
    }
  };

  // simple closure to reopen requested dialog after modal verifies
  let _pendingOpen = null;

  const onVerified = async ({ method, credential }) => {
    const ok = await gate.verify({ method, credential });
    if (ok && _pendingOpen) {
      const fn = _pendingOpen;
      _pendingOpen = null;
      fn();
    }
    return ok;
  };

  const onConfirmSuspend = async ({ reason, durationDays }) => {
    try {
      await suspendMut.mutateAsync({ reason, durationDays });
      setOpenSuspend(false);
      alert('Suspended successfully');
    } catch (e) {
      alert(e?.error?.message || 'Failed to suspend');
    }
  };

  const onUnsuspend = async () => {
    try {
      // Require reauth before unsuspend too (sensitive)
      if (!gate.unlocked) {
        _pendingOpen = onUnsuspend; // re-call after unlock
        setShowReauth(true);
        return;
      }
      await unsuspendMut.mutateAsync();
      alert('Unsuspended');
    } catch (e) {
      alert(e?.error?.message || 'Failed to unsuspend');
    }
  };

  const onConfirmRoles = async ({ add, remove, reason }) => {
    try {
      await rolesMut.mutateAsync({ add, remove, reason });
      setOpenRoles(false);
      alert('Roles updated');
    } catch (e) {
      alert(e?.error?.message || 'Failed to update roles');
    }
  };

  const suspendedUntil = user?.suspended_until ? new Date(user.suspended_until).toLocaleString() : null;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Detail</h1>
          <p className="text-gray-500">ID: {userId}</p>
          {gate.unlocked ? (
            <div className="mt-1 inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
              Sensitive actions unlocked • {secondsLeft}s left
            </div>
          ) : (
            <div className="mt-1 text-xs text-gray-500">Sensitive actions require verification.</div>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="px-3 py-1.5 rounded border">Back to Users</Link>
          <button onClick={() => nav('/admin')} className="px-3 py-1.5 rounded border">Admin Home</button>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">Loading…</div>}
      {isError && <div className="text-red-600">Failed to load user.</div>}

      {!isLoading && !isError && user && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h2 className="font-medium mb-2">Profile</h2>
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-500">Name:</span> {user.name}</div>
              <div><span className="text-gray-500">Email:</span> {user.email}</div>
              <div>
                <span className="text-gray-500">Primary Role:</span>{' '}
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border">{user.role}</span>
              </div>
              <div>
                <span className="text-gray-500">All Roles:</span>{' '}
                {user.roles?.map(r => (
                  <span key={r} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border mr-1 capitalize">{r}</span>
                ))}
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                  user.status === 'active' ? 'border-green-500 text-green-700' : 'border-yellow-500 text-yellow-700'
                }`}>
                  {user.status}
                </span>
              </div>
              <div><span className="text-gray-500">Last Active:</span> {new Date(user.last_active).toLocaleString()}</div>
              {user.status === 'suspended' && (
                <>
                  <div><span className="text-gray-500">Suspended Until:</span> {suspendedUntil}</div>
                  {user.suspension_reason && (
                    <div className="text-gray-500">Reason: {user.suspension_reason}</div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {user.status === 'active' ? (
                <button
                  className="px-3 py-1.5 rounded bg-black text-white"
                  onClick={() => ensureUnlockedThen(() => setOpenSuspend(true))}
                  disabled={suspendMut.isLoading}
                >
                  Suspend
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 rounded bg-black text-white"
                  onClick={onUnsuspend}
                  disabled={unsuspendMut.isLoading}
                >
                  Unsuspend
                </button>
              )}
              <button
                className="px-3 py-1.5 rounded border"
                onClick={() => ensureUnlockedThen(() => setOpenRoles(true))}
                disabled={rolesMut.isLoading}
              >
                Modify Roles
              </button>
              {!gate.unlocked && (
                <button
                  className="px-3 py-1.5 rounded border"
                  onClick={() => setShowReauth(true)}
                >
                  Verify now
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="font-medium mb-2">Notes</h2>
            <p className="text-sm text-gray-500">
              This page uses a 5-minute re-auth window for sensitive actions. In mock mode any password/OTP ≥ 4 chars passes.
            </p>
          </div>
        </div>
      )}

      <SuspendDialog
        open={openSuspend}
        onClose={() => setOpenSuspend(false)}
        onConfirm={onConfirmSuspend}
        loading={suspendMut.isLoading}
      />

      <RolesDialog
        open={openRoles}
        onClose={() => setOpenRoles(false)}
        onConfirm={onConfirmRoles}
        currentRoles={user?.roles ?? ['user']}
        loading={rolesMut.isLoading}
      />

      <ReauthModal
        open={showReauth}
        onClose={() => { setShowReauth(false); }}
        onVerified={onVerified}
        loading={gate.loading}
        error={gate.error}
      />
    </div>
  );
}
