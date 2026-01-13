// ===================== IMPORTS =====================
import api from './api';

// ===================== ENV =====================
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_USE_MOCK === '1';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';


// ===================== ROLE HELPERS =====================
function computePrimaryRole(roles) {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  return 'user';
}


// ===================== MOCK DATA =====================
// persistent mock stores (avoid reset on HMR)
const USERS_KEY = '__MOCK_USERS_V1__';
const _MOCK_USERS =
  typeof window !== 'undefined'
    ? (window[USERS_KEY] ||= seedMockUsers())
    : seedMockUsers();

function seedMockUsers(n = 57) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const roles = ['user'];
    if (i % 5 === 0) roles.push('manager');
    if (i % 12 === 0) roles.push('admin');
    const status = i % 11 === 0 ? 'suspended' : 'active';
    out.push({
      user_id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      roles,
      role: computePrimaryRole(roles),
      status,
      last_active: new Date(Date.now() - Math.random() * 14 * 864e5).toISOString(),
    });
  }
  return out;
}


// ===================== AUDIT MOCK (localStorage backed) =====================
const AUDIT_LS_KEY = '__MOCK_AUDIT_V1__';

function loadAudit() {
  try {
    const raw = localStorage.getItem(AUDIT_LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveAudit(arr) {
  try {
    localStorage.setItem(AUDIT_LS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn('[MOCK AUDIT] Failed to persist audit log', err);
  }
}
function addAudit(entry) {
  const list = loadAudit();
  list.push(entry);
  saveAudit(list);
  console.log('[MOCK AUDIT] push', entry, 'size=', list.length);
}
export function mockGetAudit() {
  return loadAudit().slice().reverse();
}


// ===================== USERS: LIST =====================
export async function getAdminUsers({
  q = '',
  role = '',
  status = '',
  page = 1,
  pageSize = 10,
} = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    let rows = _MOCK_USERS.slice();
    const kw = q.trim().toLowerCase();
    if (kw) rows = rows.filter(u => (u.name + u.email).toLowerCase().includes(kw));
    if (role) rows = rows.filter(u => u.roles?.includes(role));
    if (status) rows = rows.filter(u => u.status === status);

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);
    return { data, meta: { page, pageSize, total } };
  }

  const res = await api.get('/admin/users', {
    params: { q, role, status, page, pageSize }
  });
  return res.data;
}


// ===================== USERS: DETAIL =====================
export async function getAdminUser(userId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    const u = _MOCK_USERS.find(x => String(x.user_id) === String(userId));
    if (!u) throw { error: { code: 'NOT_FOUND', message: 'User not found' } };
    return { data: u };
  }

  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
}


// ===================== USERS: SUSPEND =====================
export async function suspendUser({ userId, reason, durationDays }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    if (!reason || reason.trim().length < 10)
      throw { error: { code: 'VALIDATION_ERROR', message: 'Reason too short' } };
    if (!(durationDays >= 1 && durationDays <= 30))
      throw { error: { code: 'VALIDATION_ERROR', message: 'Duration 1–30' } };

    const u = _MOCK_USERS.find(x => String(x.user_id) === String(userId));
    if (!u) throw { error: { code: 'NOT_FOUND', message: 'User not found' } };
    if (u.status === 'suspended')
      throw { error: { code: 'CONFLICT', message: 'Already suspended' } };

    const until = new Date();
    until.setDate(until.getDate() + durationDays);
    u.status = 'suspended';
    u.suspended_until = until.toISOString();
    u.suspension_reason = reason;

    addAudit({
      ts: new Date().toISOString(),
      action: 'suspend_user',
      admin_user_id: 0,
      target_user_id: u.user_id,
      reason,
      metadata: { durationDays, until: u.suspended_until },
    });

    return { data: { ok: true, suspended_until: u.suspended_until } };
  }

  const res = await api.post(`/admin/users/${userId}/suspend`, { reason, durationDays });
  return res.data;
}


// ===================== USERS: UNSUSPEND =====================
export async function unsuspendUser(userId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    const u = _MOCK_USERS.find(x => String(x.user_id) === String(userId));
    if (!u) throw { error: { code: 'NOT_FOUND', message: 'User not found' } };
    u.status = 'active';
    delete u.suspended_until;
    delete u.suspension_reason;

    addAudit({
      ts: new Date().toISOString(),
      action: 'unsuspend_user',
      admin_user_id: 0,
      target_user_id: u.user_id,
      reason: 'manual-unsuspend',
      metadata: {},
    });

    return { data: { ok: true } };
  }

  const res = await api.post(`/admin/users/${userId}/unsuspend`);
  return res.data;
}


// ===================== USERS: MODIFY ROLES =====================
export async function modifyUserRoles({ userId, add = [], remove = [], reason }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    if (!reason || reason.trim().length < 10)
      throw { error: { code: 'VALIDATION_ERROR', message: 'Reason too short' } };

    const u = _MOCK_USERS.find(x => String(x.user_id) === String(userId));
    if (!u) throw { error: { code: 'NOT_FOUND', message: 'User not found' } };

    const current = new Set(u.roles ?? ['user']);
    remove.forEach(r => current.delete(r));
    add.forEach(r => current.add(r));
    if (!current.has('user')) current.add('user');
    u.roles = Array.from(current);
    u.role = computePrimaryRole(u.roles);

    addAudit({
      ts: new Date().toISOString(),
      action: 'modify_roles',
      admin_user_id: 0,
      target_user_id: u.user_id,
      reason,
      metadata: { add, remove, roles: u.roles },
    });

    return { data: { ok: true, roles: u.roles, role: u.role } };
  }

  const res = await api.post(`/admin/users/${userId}/roles`, { add, remove, reason });
  return res.data;
}


// ===================== ADMIN REAUTH =====================
export async function adminReauth({ method = 'password', credential = '' }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    if (!credential || String(credential).trim().length < 4)
      throw { error: { code: 'UNAUTHORIZED', message: 'Invalid credential' } };
    const expiresAt = Date.now() + 5 * 60 * 1000;
    return { data: { token: 'mock-reauth-token', method, expiresAt } };
  }

  const res = await api.post('/admin/reauth', { method, credential });
  return res.data;
}

export async function adminReauthVerify({ code = '' }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    if (!code || String(code).trim().length < 6)
      throw { error: { code: 'UNAUTHORIZED', message: 'Invalid OTP code' } };
    const expiresAt = Date.now() + 5 * 60 * 1000;
    return { data: { token: 'mock-reauth-token-verified', expiresAt } };
  }

  const res = await api.post('/admin/reauth/verify', { code });
  return res.data;
}


// ===================== AUDIT LOG =====================
export async function getAuditLog({
  q = '',
  action = '',
  adminId = '',
  targetUserId = '',
  page = 1,
  pageSize = 10,
} = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    let rows = loadAudit().slice().reverse();
    const kw = q.trim().toLowerCase();
    if (kw) {
      rows = rows.filter(r =>
        (r.action || '').toLowerCase().includes(kw) ||
        (r.reason || '').toLowerCase().includes(kw) ||
        JSON.stringify(r.metadata || {}).toLowerCase().includes(kw)
      );
    }
    if (action) rows = rows.filter(r => r.action === action);
    if (adminId) rows = rows.filter(r => String(r.admin_user_id || '') === String(adminId));
    if (targetUserId) rows = rows.filter(r => String(r.target_user_id || '') === String(targetUserId));

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);
    return { data, meta: { page, pageSize, total } };
  }

  const res = await api.get('/admin/audit-log', {
    params: { q, action, adminId, targetUserId, page, pageSize }
  });
  return res.data;
}

// ===================== SYSTEM REPORTS =====================
/**
 * getSystemReports({ range='7d'|'30d' })
 * Response:
 * {
 *   cards: { healthOk:number, avgLatencyMs:number, errorRate:number, openModeration:number },
 *   series: { dates:string[], activeUsers:number[], newReports:number[], errors:number[] }
 * }
 */
export async function getSystemReports({ range = '7d' } = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    const days = range === '30d' ? 30 : 7;
    const dates = Array.from({ length: days }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().slice(0, 10);
    });
    const rnd = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
    const series = {
      dates,
      activeUsers: dates.map(() => rnd(80, 260)),
      newReports:  dates.map(() => rnd(0, 12)),
      errors:      dates.map(() => rnd(0, 6)),
    };
    const cards = {
      healthOk: 1,                          // 1 = green (ok), 0 = red (down)
      avgLatencyMs: rnd(80, 180),
      errorRate: Number((Math.random() * 1.8).toFixed(2)), // %
      openModeration: rnd(2, 21),
    };
    return { data: { cards, series } };
  }

  const res = await api.get('/admin/analytics/system-health/', {
    params: { range }
  });
  return res.data;
}


// ====== Dashboard Overview ======
export async function getDashboardOverview() {
  const res = await api.get('/admin/dashboard/overview/');
  return res.data;
}

export async function getPlatformHealth() {
  const res = await api.get('/admin/analytics/platform-health/');
  return res.data;
}

export async function getAdminActionLogs({ action, adminId, targetUserId, page = 1 } = {}) {
  const res = await api.get('/admin/logs/all-actions/', {
    params: { action, admin_id: adminId, target_user_id: targetUserId, page }
  });
  return res.data;
}

// ====== Facility Management ======
export async function getAllFacilities({ approvalStatus, isActive } = {}) {
  const params = {};
  if (approvalStatus) params.approval_status = approvalStatus;
  if (isActive !== undefined && isActive !== null && isActive !== '') params.is_active = isActive;

  const res = await api.get('/admin/facilities/all/', { params });
  return res.data;
}

export async function getPendingFacilities() {
  const res = await api.get('/admin/facilities/pending/');
  return res.data;
}

export async function approveFacility({ facilityId, reason }) {
  const res = await api.post(`/admin/facilities/${facilityId}/approve/`, { reason });
  return res.data;
}

export async function rejectFacility({ facilityId, reason }) {
  const res = await api.post(`/admin/facilities/${facilityId}/reject/`, { reason });
  return res.data;
}

export async function activateFacility({ facilityId, reason }) {
  const res = await api.post(`/admin/facilities/${facilityId}/activate/`, { reason });
  return res.data;
}

export async function deactivateFacility({ facilityId, reason }) {
  const res = await api.post(`/admin/facilities/${facilityId}/deactivate/`, { reason });
  return res.data;
}

export async function suspendFacility({ facilityId, reason, durationDays }) {
  const res = await api.post(`/admin/facilities/${facilityId}/suspend/`, {
    reason,
    duration_days: durationDays
  });
  return res.data;
}

export async function unsuspendFacility({ facilityId, reason }) {
  const res = await api.post(`/admin/facilities/${facilityId}/unsuspend/`, { reason });
  return res.data;
}

export async function getFacilityAnalytics(facilityId) {
  const res = await api.get(`/admin/facilities/${facilityId}/analytics/`);
  return res.data;
}

export async function adjustCommissionRate({ facilityId, newRate, reason, effectiveDate }) {
  const res = await api.post(`/admin/facilities/${facilityId}/commission/`, {
    new_rate: newRate,
    reason,
    effective_date: effectiveDate
  });
  return res.data;
}

// ====== Manager Management ======
export async function getManagers({ q, status, page = 1, pageSize = 10 } = {}) {
  const res = await api.get('/admin/managers/', {
    params: { q, status, page, pageSize }
  });
  return res.data;
}

export async function getManagerDetail(userId) {
  const res = await api.get(`/admin/managers/${userId}/`);
  return res.data;
}

export async function getManagerApplications({ status = 'pending', page = 1, pageSize = 10 } = {}) {
  const res = await api.get('/admin/managers/applications/', {
    params: { status, page, pageSize }
  });
  return res.data;
}

export async function approveManagerApplication({ requestId, reason }) {
  const res = await api.post(`/admin/managers/applications/${requestId}/approve/`, { reason });
  return res.data;
}

export async function rejectManagerApplication({ requestId, reason }) {
  const res = await api.post(`/admin/managers/applications/${requestId}/reject/`, { reason });
  return res.data;
}

export async function suspendManager({ userId, reason, durationDays }) {
  const res = await api.post(`/admin/managers/${userId}/suspend/`, {
    reason,
    duration_days: durationDays
  });
  return res.data;
}

export async function unsuspendManager({ userId, reason }) {
  const res = await api.post(`/admin/managers/${userId}/unsuspend/`, { reason });
  return res.data;
}

export async function getManagerPerformance(userId) {
  const res = await api.get(`/admin/managers/${userId}/performance/`);
  return res.data;
}

// ====== User Analytics ======
export async function getUserBookings(userId) {
  const res = await api.get(`/admin/users/${userId}/bookings/`);
  return res.data;
}

export async function getUserActivity(userId) {
  const res = await api.get(`/admin/users/${userId}/activity/`);
  return res.data;
}

export async function getFlaggedUsers() {
  const res = await api.get('/admin/users/flagged/');
  return res.data;
}

// ====== Booking Oversight ======
export async function getBookingOverview({ status, facilityId, userId, startDate, endDate, page = 1, pageSize = 50 } = {}) {
  const res = await api.get('/admin/bookings/', {
    params: {
      status,
      facility_id: facilityId,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      page,
      pageSize
    }
  });
  return res.data;
}

export async function getBookingStatistics() {
  const res = await api.get('/admin/bookings/stats/');
  return res.data;
}

// ====== Financial Management ======
export async function getPaymentStatistics({ period = 'month', startDate, endDate } = {}) {
  const res = await api.get('/admin/payments/stats/', {
    params: { period, start_date: startDate, end_date: endDate }
  });
  return res.data;
}

export async function getRefundRequests({ status, page = 1, pageSize = 20 } = {}) {
  const res = await api.get('/admin/payments/refunds/', {
    params: { status, page, pageSize }
  });
  return res.data;
}

export async function approveRefund({ requestId, reason }) {
  const res = await api.post(`/admin/payments/refunds/${requestId}/approve/`, { reason });
  return res.data;
}

export async function rejectRefund({ requestId, reason }) {
  const res = await api.post(`/admin/payments/refunds/${requestId}/reject/`, { reason });
  return res.data;
}

export async function getCommissionBreakdown({ period = 'month' } = {}) {
  const res = await api.get('/admin/payments/commission/', {
    params: { period }
  });
  return res.data;
}

// ====== Report & Content Moderation ======
export async function getReportsList({ status, severity, category, resourceType, assignedToMe, page = 1, pageSize = 20 } = {}) {
  const res = await api.get('/admin/reports/', {
    params: {
      status,
      severity,
      category,
      resource_type: resourceType,
      assigned_to_me: assignedToMe,
      page,
      pageSize
    }
  });
  return res.data;
}

export async function getReportDetail(reportId) {
  const res = await api.get(`/admin/reports/${reportId}/`);
  return res.data;
}

export async function assignReport({ reportId, adminUserId }) {
  const res = await api.post(`/admin/reports/${reportId}/assign/`, {
    admin_user_id: adminUserId
  });
  return res.data;
}

export async function resolveReport({ reportId, resolutionNote, actionTaken }) {
  const res = await api.post(`/admin/reports/${reportId}/resolve/`, {
    resolution_note: resolutionNote,
    action_taken: actionTaken
  });
  return res.data;
}

export async function dismissReport({ reportId, resolutionNote }) {
  const res = await api.post(`/admin/reports/${reportId}/dismiss/`, {
    resolution_note: resolutionNote
  });
  return res.data;
}

export async function getReportTrends() {
  const res = await api.get('/admin/reports/trends/');
  return res.data;
}


// ===== Soft delete user (mock) =====
export async function softDeleteUser({ userId }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    // Remove the user from the mock list (or mark it as deleted)
    const idx = _MOCK_USERS.findIndex(u => String(u.user_id) === String(userId));
    if (idx === -1) throw { error: { code: 'NOT_FOUND', message: 'User not found' } };
    const u = _MOCK_USERS[idx];
    _MOCK_USERS.splice(idx, 1);

    // audit
    const entry = {
      ts: new Date().toISOString(),
      action: 'soft_delete_user',
      admin_user_id: 0,
      target_user_id: u.user_id,
      reason: 'demo-soft-delete',
      metadata: { email: u.email },
    };
    // Reuse your current audit persistence method (localStorage)
    const raw = localStorage.getItem('__MOCK_AUDIT_V1__');
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem('__MOCK_AUDIT_V1__', JSON.stringify(list));
    return { data: { ok: true } };
  }

  const res = await api.delete(`/admin/users/${userId}`, {
    params: { soft: true }
  });
  return res.data;
}

// ===== Assign/Transfer facility to manager (mock) =====
export async function assignFacilityToManager({ facilityId, managerId, reason }) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250));
    if (!reason || reason.trim().length < 10) {
      throw { error: { code: 'VALIDATION_ERROR', message: 'Reason must be ≥ 10 chars' } };
    }
    // Write an audit record
    const entry = {
      ts: new Date().toISOString(),
      action: 'assign_facility',
      admin_user_id: 0,
      target_user_id: managerId,
      reason,
      metadata: { facilityId, managerId },
    };
    const raw = localStorage.getItem('__MOCK_AUDIT_V1__');
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem('__MOCK_AUDIT_V1__', JSON.stringify(list));
    return { data: { ok: true } };
  }

  const res = await api.post(`/admin/facilities/${facilityId}/assign`, { managerId, reason });
  return res.data;
}

// ====== CSV Export Functions ======
export function exportActivityReportCSV(days = 30) {
  const url = `${API_BASE}/api/admin/reports/export/activity/?days=${days}`;
  window.open(url, '_blank');
}

export function exportAdminActionsCSV(days = 30) {
  const url = `${API_BASE}/api/admin/reports/export/admin-actions/?days=${days}`;
  window.open(url, '_blank');
}

export function exportUserStatisticsCSV() {
  const url = `${API_BASE}/api/admin/reports/export/users/`;
  window.open(url, '_blank');
}

export function exportBookingStatisticsCSV(days = 30) {
  const url = `${API_BASE}/api/admin/reports/export/bookings/?days=${days}`;
  window.open(url, '_blank');
}
