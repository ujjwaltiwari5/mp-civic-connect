import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link to="/" className="font-bold text-teal-700 text-sm">Bhopal CivicConnect</Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            {user.role === "admin" && (
              <>
                <Link to="/admin/departments" className="text-gray-600 hover:text-teal-700">Departments</Link>
                <Link to="/admin/categories" className="text-gray-600 hover:text-teal-700">Categories</Link>
              </>
            )}
            <span className="text-gray-600">Hi, {user.name}</span>
            <Link to="/profile" className="text-teal-700 hover:underline">Profile</Link>
            <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-teal-700 hover:underline">Login</Link>
            <Link to="/register" className="text-teal-700 hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}