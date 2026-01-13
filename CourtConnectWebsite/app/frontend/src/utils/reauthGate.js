const KEY = 'adminReauthUnlock'; // session-scoped

export function setReauthUnlock({ group = 'admin-sensitive', token, expiresAt }) {
  const rec = { group, token, expiresAt };
  sessionStorage.setItem(KEY, JSON.stringify(rec));
  return rec;
}

export function clearReauthUnlock() {
  sessionStorage.removeItem(KEY);
}

export function getReauthUnlock() {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw);
    if (!rec || !rec.expiresAt) return null;
    if (Date.now() >= rec.expiresAt) {
      clearReauthUnlock();
      return null;
    }
    return rec;
  } catch {
    return null;
  }
}

export function isUnlocked(group = 'admin-sensitive') {
  const rec = getReauthUnlock();
  return !!rec && rec.group === group && Date.now() < rec.expiresAt;
}

export function remainingMs() {
  const rec = getReauthUnlock();
  if (!rec) return 0;
  return Math.max(0, rec.expiresAt - Date.now());
}
