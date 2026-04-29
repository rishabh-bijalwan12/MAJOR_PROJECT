import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  });
  const [doctor, setDoctor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("doctor"));
    } catch (e) {
      return null;
    }
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    localStorage.removeItem("doctor");
    setUser(null);
    setDoctor(null);
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 font-bold border-b-2 border-blue-600"
      : "text-gray-600 hover:text-blue-600 transition";

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">🏥</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MediCare
            </span>
          </Link>

          <div className="hidden md:flex gap-8 items-center">
            {(user || (!user && !doctor)) && (
              <Link to="/" className={`font-semibold transition py-2 ${isActive("/")}`}>
                📤 Upload
              </Link>
            )}

            {user ? (
              <>
                <Link
                  to="/book-appointment"
                  className={`font-semibold transition py-2 ${isActive("/book-appointment")}`}
                >
                  📅 Book Appointment
                </Link>
                <Link
                  to="/profile"
                  className={`font-semibold transition py-2 flex items-center gap-2 ${isActive("/profile")}`}
                >
                  <span>👤</span>
                  <span className="truncate max-w-32">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm"
                >
                  🚪 Logout
                </button>
              </>
            ) : doctor ? (
              <>
                <Link
                  to="/hospital-appointments"
                  className={`font-semibold transition py-2 ${isActive("/hospital-appointments")}`}
                >
                  📋 Appointments
                </Link>
                <Link
                  to="/doctor-profile"
                  className={`font-semibold transition py-2 ${isActive("/doctor-profile")}`}
                >
                  ⚙️ Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  📝 Patient
                </Link>
                <Link
                  to="/doctor-register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  👨‍⚕️ Hospital
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200">
          <div className="px-4 pt-4 pb-4 space-y-2">
            {(user || (!user && !doctor)) && (
              <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                📤 Upload
              </Link>
            )}

            {user ? (
              <>
                <Link to="/book-appointment" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                  📅 Book Appointment
                </Link>
                <Link to="/profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                  👤 My Profile
                </Link>
                <button onClick={handleLogout} className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm text-left">
                  🚪 Logout
                </button>
              </>
            ) : doctor ? (
              <>
                <Link to="/hospital-appointments" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                  📋 Appointments
                </Link>
                <Link to="/doctor-profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                  ⚙️ Profile
                </Link>
                <button onClick={handleLogout} className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold text-sm text-left">
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
                  📝 Patient Register/Login
                </Link>
                <Link to="/doctor-register" className="block px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
                  👨‍⚕️ Hospital Register/Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}