// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BookingsPage from './pages/bookings/BookingsPage';
import ProfileSettings from './pages/profile/ProfileSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFacilities from './pages/admin/ManageFacilities';
import ApproveManagers from './pages/admin/ApproveManagers';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RequireRole from './components/auth/RequireRole';
import Unauthorized from './pages/Unauthorized';
import UserHomeDashboard from './pages/user/UserHomeDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerProfile from './pages/manager/ManagerProfile';
import ApplyForFacility from './pages/manager/ApplyForFacility';
import ManageEditFacility from './pages/manager/ManageEditFacility';
import ScheduleEditor from './pages/manager/ScheduleEditor';
import ConnectPayouts from './pages/payouts/ConnectPayouts';
import SearchFacilities from './pages/search/SearchFacilities';
import FacilityDetail from './pages/facilities/FacilityDetail';
import ChooseTimeslot from './pages/bookings/ChooseTimeslot';
import Checkout from './pages/bookings/Checkout';
import BookingSuccess from './pages/bookings/BookingSuccess';
import BookingCancel from './pages/bookings/BookingCancel';
import CourtsList from './pages/manager/CourtList';
import CreateCourt from './pages/manager/CreateCourt';
import EditCourt from './pages/manager/EditCourt';
import RateEditor from './pages/manager/RateEditor';
import UtilizationReports from './pages/manager/UtilizationReports';
import DeleteCourtConfirm from './pages/manager/DeleteCourtConfirm';
import CancellationTemplate from './pages/manager/CancellationTemplate';
import UsersTable from './pages/admin/UsersTable';
import SystemReports from './pages/admin/SystemReports';
import AuditLog from './pages/admin/AuditLog';
import AccessDenied from './pages/admin/AccessDenied';
import UserDetail from './pages/admin/UserDetail';
import AdminReports from './pages/admin/AdminReports';
//import AccessDenied from './pages/admin/AccessDenied';
import SoftDeleteUser from './pages/admin/SoftDeleteUser';
import AssignFacility from './pages/admin/AssignFacility';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const queryClient = new QueryClient();

// DEV_BYPASS is for debugging only
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === '1';
console.log('VITE_DEV_BYPASS_AUTH =', import.meta.env.VITE_DEV_BYPASS_AUTH);

// PayPal configuration
const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  currency: "AUD",
  intent: "capture",
  // Disable credit/debit card buttons - only show PayPal
  "disable-funding": "card,credit",
};

function App() {
  // CSRF token is now automatically set by the login endpoint
  // No need for a separate fetch on app load

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />

              {/* Public routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="help" element={<Help />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="facilities" element={<SearchFacilities />} />
              <Route path="facility/:id" element={<FacilityDetail />} />
              <Route path="court/:courtId/book" element={<Navigate to="/choose" replace />} />
              <Route path="choose" element={<ChooseTimeslot />} />
              <Route path="order/confirm" element={<Checkout />} />
              <Route path="bookings/success" element={guard(<BookingSuccess />)} />
              <Route path="bookings/cancel" element={<BookingCancel />} />
              <Route path="search" element={<Navigate to="/facilities" replace />} />
              <Route path="searchFacilities" element={<Navigate to="/facilities" replace />} />

              {/* Fix typo redirect */}
              <Route path="userHomeDashborad" element={<Navigate to="/userHomeDashboard" replace />} />

              {/* User routes */}
              <Route
                path="userHomeDashboard"
                element={guard(<UserHomeDashboard />, ['user', 'manager', 'admin'])}
              />
              <Route path="bookings" element={guard(<BookingsPage />)} />
              <Route path="profile" element={guard(<ProfileSettings />)} />
              <Route
                path="connect-payouts"
                element={guard(<ConnectPayouts />, ['user', 'manager', 'admin'])}
              />

              {/* Manager/Admin routes */}
              <Route path="manager/facilities"
              element={guard(<div className="p-6">Facilities (placeholder)</div>, ['manager', 'admin'])} />

              <Route path="manager/schedule"
              element={guard(<div className="p-6">Schedule Editor (placeholder)</div>, ['manager', 'admin'])} />

              <Route
                path="manager/facility/:facilityId/courts"
                element={guard(<CourtsList />, ['manager', 'admin'])}
              />
              <Route
                path="manager/facility/:facilityId/courts/new"
                element={guard(<CreateCourt />, ['manager', 'admin'])}
              />
              <Route
                path="manager/facility/:facilityId/courts/:courtId/edit"
                element={guard(<EditCourt />, ['manager', 'admin'])}
              />

              {/*These two must exist exactly once (no leading /) */}
              <Route
                path="manager/facility/:facilityId/courts/:courtId/delete"
                element={guard(<DeleteCourtConfirm />, ['manager', 'admin'])}
              />
              <Route
                path="manager/facility/:facilityId/courts/:courtId/cancel-notification"
                element={guard(<CancellationTemplate />, ['manager', 'admin'])}
              />

              <Route
                path="manager/facility/:facilityId/courts/:courtId/schedule"
                element={guard(<ScheduleEditor />, ['manager', 'admin'])}
              />

              {/* Optional extras */}
              <Route
                path="manager/facility/:facilityId/courts/:courtId/schedule"
                element={guard(<ScheduleEditor />, ['manager', 'admin'])}
              />
              <Route
                path="manager/facility/:facilityId/courts/:courtId/rate"
                element={guard(<RateEditor />, ['manager', 'admin'])}
              />

              {/* Manager dashboard and profile */}
              <Route
                path="manager"
                element={guard(<ManagerDashboard />, ['manager', 'admin'])}
              />
              <Route
                path="manager/dashboard"
                element={guard(<ManagerDashboard />, ['manager','admin'])}
              />
              <Route
                path="manager/profile"
                element={guard(<ManagerProfile />, ['manager', 'admin'])}
              />
              <Route
                path="manager/facilities/apply"
                element={guard(<ApplyForFacility />, ['manager','admin'])}
              />
              <Route
                path="manager/facilities/:facilityId/edit"
                element={guard(<ManageEditFacility />, ['manager','admin'])}
              />

              {/* Reports for a facility */}
              <Route
                path="manager/facility/:facilityId/reports"
                element={guard(<UtilizationReports />, ['manager', 'admin'])}
              />

              {/* Admin area */}
              <Route
                path="admin"
                element={guard(<AdminDashboard />, ['admin'])}
              />
              <Route
                path="admin/facilities/approve"
                element={guard(<ManageFacilities />, ['admin'])}
              />
              <Route
                path="admin/managers/approve"
                element={guard(<ApproveManagers />, ['admin'])}
              />
              <Route
                path="admin"
                element={guard(<AdminDashboard />, ['admin'])}
              />
              <Route
                path="admin/users"
                element={guard(<UsersTable />, ['admin'])}
              />

              <Route path="admin/access-denied" element={guard(<AccessDenied />, ['admin'])} />

              <Route path="admin/users/:userId/delete" element={guard(<SoftDeleteUser />, ['admin'])} />

              <Route path="admin/facilities/:facilityId/assign" element={guard(<AssignFacility />, ['admin'])} />


              <Route
                path="admin/audit-log"
                element={guard(<AuditLog />, ['admin'])}
              />

              <Route 
                path="admin/users/:userId" 
                element={guard(<UserDetail />, ['admin'])} 
              />

              <Route path="admin/audit-log" element={guard(<AuditLog />, ['admin'])} />

              <Route
                path="admin/reports"
                element={guard(<AdminReports />, ['admin'])}
              />

              <Route
                path="admin/system-reports"
                element={guard(<SystemReports />, ['admin'])}
              />

              {/* AccessDenied for admin only */}
              <Route path="access-denied" element={<AccessDenied />} />
 

              {/* Unauthorized page */}
              <Route path="unauthorized" element={<Unauthorized />} />
            </Route>
          </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </PayPalScriptProvider>
  );
}

// Simple guard wrapper with DEV_BYPASS support
function guard(element, allowRoles) {
  console.log('guard called', { DEV_BYPASS, allowRoles });
  if (DEV_BYPASS) return element;
  return allowRoles ? (
    <ProtectedRoute>
      <RequireRole allow={allowRoles}>{element}</RequireRole>
    </ProtectedRoute>
  ) : (
    <ProtectedRoute>{element}</ProtectedRoute>
  );
}

export default App;
