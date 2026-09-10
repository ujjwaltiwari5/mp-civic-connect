import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? "text-teal-700" : "text-slate-600 hover:text-teal-700"
    }`;

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
            BC
          </span>
          <span className="font-semibold text-slate-900 text-sm hidden sm:inline">
            Bhopal CivicConnect
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {user ? (
            <>
              {user.role === "admin" && (
                <>
                  <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>
                  <NavLink to="/admin/complaints" className={linkClass}>All Complaints</NavLink>
                  <NavLink to="/admin/duplicates" className={linkClass}>Duplicate Review</NavLink>
                  <NavLink to="/admin/departments" className={linkClass}>Departments</NavLink>
                  <NavLink to="/admin/categories" className={linkClass}>Categories</NavLink>
                </>
              )}
              {user.role === "department_user" && (
                <NavLink to="/department/complaints" className={linkClass}>
                  My Assigned Complaints
                </NavLink>
              )}
              <NavLink to="/complaints/new" className={linkClass}>New Complaint</NavLink>
              <NavLink to="/complaints/mine" className={linkClass}>My Complaints</NavLink>
              <NotificationBell />

              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xs font-semibold hover:bg-teal-100"
                title={user.name}
              >
                {initial}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-red-600 border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-teal-700 hover:underline">Login</Link>
              <Link to="/register" className="text-sm font-medium text-teal-700 hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}