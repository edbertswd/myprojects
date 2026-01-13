import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
      <p className="text-gray-600">
        You don’t have permission to access this area. If you believe this is a mistake, please contact support or request admin access.
      </p>

      <div className="mt-6 space-x-3">
        <Link to="/" className="inline-block px-4 py-2 border rounded hover:bg-gray-50">Back to Home</Link>
        <Link to="/profile" className="inline-block px-4 py-2 border rounded hover:bg-gray-50">Go to Profile</Link>
        {/* Can be replaced by support channels */}
        <a href="mailto:support@example.com" className="inline-block px-4 py-2 border rounded hover:bg-gray-50">Contact Support</a>
      </div>
    </div>
  );
}
