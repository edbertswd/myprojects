// src/components/common/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { User, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ProfilePanel from '../profile/ProfilePanel';

const Header = () => {
  const { user, logout, isAuthenticated, updatePhone } = useAuth();
  const navigate = useNavigate();

  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // click outside to close the menu
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: brand + primary nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">CourtConnect</h1>
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/facilities"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Facilities
              </Link>
              {isAuthenticated && (
                <Link
                  to="/bookings"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  My Bookings
                </Link>
              )}

              {/* Manager entry visible only to manager/admin */}
              {isAuthenticated && (user?.role === 'manager' || user?.role === 'admin') && (
                <Link
                  to="/manager"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Manager
                </Link>
              )}

              {/* Admin entry visible only to admin */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Admin
                </Link>
              )}

            </nav>
          </div>

          {/* Right: auth area */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              // Use a relative container for the dropdown to position absolutely
              <div className="flex items-center space-x-4 relative" ref={menuRef}>
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>

                {/* Avatar button -> toggles menu */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="text-gray-500 hover:text-gray-900"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open user menu"
                >
                  <User className="h-5 w-5" />
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-10 w-48 rounded-xl border bg-white shadow-lg p-1 z-50"
                  >
                    {/* User Dashboard Link */}
                    <Link
                      to="/userHomeDashboard"
                      className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>

                    {/* Profile Link */}
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>

                    <div className="border-t my-1"></div>

                    <button
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                      onClick={() => { setPanelOpen(true); setMenuOpen(false); }}
                    >
                      Quick edit phone
                    </button>

                    {/* Quick link to Manager Profile for manager/admin */}
                    {(user?.role === 'manager' || user?.role === 'admin') && (
                      <>
                        <div className="border-t my-1"></div>
                        <Link
                          to="/manager/profile"
                          className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          Manager Profile
                        </Link>
                      </>
                    )}

                  </div>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-900"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile drawer (quick phone edit) */}
      {isAuthenticated && (
        <ProfilePanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          initialPhone={user?.phone_number || ''}
          onSaved={(newPhone) => updatePhone(newPhone)}
        />
      )}
    </header>
  );
};

export default Header;
