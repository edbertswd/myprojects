import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { assignFacilityToManager } from "../../services/adminApi"; // 见下方 Service 补充

// can change it to a real manager list; here are some placeholders
const MOCK_MANAGERS = [
  { id: 101, name: "Alice (mgr)" },
  { id: 102, name: "Bob (mgr)" },
  { id: 103, name: "Carol (mgr)" },
];

export default function AssignFacility() {
  const { facilityId } = useParams();
  const nav = useNavigate();
  const [managerId, setManagerId] = useState(MOCK_MANAGERS[0].id);
  const [reason, setReason] = useState("");
  const canSave = reason.trim().length >= 10;

  const onSave = async () => {
    try {
      await assignFacilityToManager({ facilityId, managerId, reason });
      nav(`/manager/facility/${facilityId}/courts?assigned=1`);
    } catch (e) {
      alert(e?.error?.message || "Failed to assign");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Assign / Transfer Facility</h1>
      <div className="border rounded-lg p-4 bg-white space-y-4">
        <div>
          <div className="text-sm text-gray-600">Facility</div>
          <div className="font-medium">#{facilityId}</div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Manager</label>
          <select
            value={managerId}
            onChange={(e) => setManagerId(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          >
            {MOCK_MANAGERS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Reason (≥ 10 chars)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            placeholder="Why transfer/assign this facility?"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={!canSave}
            className={`px-4 py-2 rounded ${canSave ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Save
          </button>
          <Link to={`/manager/facility/${facilityId}/courts`} className="px-4 py-2 border rounded hover:bg-gray-50">Back to Courts</Link>
          <Link to="/admin" className="px-4 py-2 border rounded hover:bg-gray-50">Back to Admin</Link>
        </div>
      </div>
    </div>
  );
}
