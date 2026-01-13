import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAdminUser } from "../../hooks/useAdminUser";
import { softDeleteUser } from "../../services/adminApi"; 

export default function SoftDeleteUser() {
  const { userId } = useParams();
  const nav = useNavigate();
  const { data: user, isLoading, isError } = useAdminUser(userId);
  const [confirmText, setConfirmText] = useState("");

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError || !user) return <div className="p-6 text-red-600">User not found.</div>;

  const canDelete = confirmText.trim() === "DELETE";

  const onDelete = async () => {
    try {
      await softDeleteUser({ userId }); // mock: Memory Hiding + Write Auditing
      nav("/admin/users?deleted=1");
    } catch (e) {
      alert(e?.error?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Delete User (soft)</h1>
      <div className="border rounded-lg p-4 bg-white">
        <p className="mb-2">
          You are about to soft-delete user: <b>{user.name}</b> ({user.email})
        </p>
        <ul className="list-disc ml-5 text-sm text-gray-600">
          <li>This is a reversible operation in mock mode (demo).</li>
          <li>In real environment, this should be audited and may be restricted if there is related data.</li>
        </ul>

        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-1">Type <code>DELETE</code> to confirm</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            disabled={!canDelete}
            onClick={onDelete}
            className={`px-4 py-2 rounded ${canDelete ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Confirm Delete
          </button>
          <Link to={`/admin/users/${userId}`} className="px-4 py-2 border rounded hover:bg-gray-50">Back to Detail</Link>
          <Link to="/admin/users" className="px-4 py-2 border rounded hover:bg-gray-50">Back to List</Link>
        </div>
      </div>
    </div>
  );
}
