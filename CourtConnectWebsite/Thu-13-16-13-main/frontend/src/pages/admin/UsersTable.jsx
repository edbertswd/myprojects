// src/pages/admin/UsersTable.jsx
import { useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAdminUsers } from "../../hooks/useAdminUsers"; // plural

const ROLE_OPTS = ["", "user", "manager", "admin"];
const STATUS_OPTS = ["", "active", "suspended"];
const PAGE_SIZE_OPTS = [10, 20, 50];

function toInt(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

export default function UsersTable() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const role = sp.get("role") ?? "";
  const status = sp.get("status") ?? "";
  const page = toInt(sp.get("page"), 1);
  const pageSize = toInt(sp.get("pageSize"), 10);

  const { data, isLoading, isError, error } = useAdminUsers({
    q,
    role,
    status,
    page,
    pageSize,
  });

  // Safe fallbacks
  const rows = data?.data ?? [];
  const meta = data?.meta ?? { page, pageSize, total: 0 };
  const total = meta.total;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  // Keep page within range if filters/pageSize change
  useEffect(() => {
    if (!data) return;
    const t = data.meta?.total ?? 0;
    const max = Math.max(1, Math.ceil(t / pageSize));
    if (page > max) {
      const next = new URLSearchParams(sp);
      next.set("page", String(max));
      setSp(next, { replace: true });
    }
  }, [data, page, pageSize, setSp, sp]);

  const onChange = (key, val) => {
    const next = new URLSearchParams(sp);
    if (val === "" || val == null) next.delete(key);
    else next.set(key, String(val));
    if (["q", "role", "status", "pageSize"].includes(key)) next.set("page", "1");
    setSp(next);
  };

  const goPrev = () => onChange("page", Math.max(1, page - 1));
  const goNext = () => onChange("page", Math.min(maxPage, page + 1));

  const header = useMemo(
    () => (
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold">User Moderation</h1>
        <p className="text-gray-500">
          View users and suspend rule violators.
        </p>
      </div>
    ),
    []
  );

  const ActionButtons = ({ u }) => {
    // Moderation-only actions:
    // - View → detail page
    // - Suspend/Unsuspend → detail page with ?open=suspend
    const base = `/admin/users/${u.user_id}`;
    const suspendLabel = u.status === "suspended" ? "Unsuspend" : "Suspend";

    return (
      <div className="inline-flex items-center gap-2 justify-end">
        <Link
          to={base}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          title="View user details"
        >
          View
        </Link>

        <Link
          to={`${base}?open=suspend`}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          title="Suspend/Unsuspend user"
        >
          {suspendLabel}
        </Link>
      </div>
    );
  };

  return (
    <div className="p-6">
      {header}

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => onChange("q", e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={role}
          onChange={(e) => onChange("role", e.target.value)}
        >
          {ROLE_OPTS.map((v) => (
            <option key={v} value={v}>
              {v === "" ? "All roles" : v}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={status}
          onChange={(e) => onChange("status", e.target.value)}
        >
          {STATUS_OPTS.map((v) => (
            <option key={v} value={v}>
              {v === "" ? "All status" : v}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={pageSize}
          onChange={(e) => onChange("pageSize", e.target.value)}
        >
          {PAGE_SIZE_OPTS.map((ps) => (
            <option key={ps} value={ps}>
              {ps} / page
            </option>
          ))}
        </select>
      </div>

      {/* States */}
      {isLoading && <div className="mt-6 text-gray-500">Loading…</div>}
      {isError && (
        <div className="mt-6 text-red-600">
          Failed to load users
          {error?.code ? ` (${error.code})` : ""}.
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <>
          <div className="mt-4 overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Last Active</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No users match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((u) => (
                  <tr key={u.user_id} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        to={`/admin/users/${u.user_id}`}
                        className="text-blue-600 underline"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                          u.status === "active"
                            ? "border-green-500 text-green-700"
                            : "border-yellow-500 text-yellow-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {u.last_active
                        ? new Date(u.last_active).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <ActionButtons u={u} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {total} • Page {page} / {maxPage}
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={goPrev}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={goNext}
                disabled={page >= maxPage}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
