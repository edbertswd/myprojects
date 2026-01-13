// src/components/auth/RequireRole.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function RequireRole({ allow, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const loc = useLocation();

  if (loading) return <div>Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;

  const role = user?.role;
  if (!role || (allow && !allow.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
