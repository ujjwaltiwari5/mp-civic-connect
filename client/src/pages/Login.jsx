import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <div className="flex justify-center mb-4">
          <span className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
            BC
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Log in to Bhopal CivicConnect</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-teal-700 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}