import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await updateProfile(form);
      setSuccess(res.message || "Profile updated successfully");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-sm text-gray-500 mb-6">Your account details</p>

        {success && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {!editing ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Name</p>
              <p className="text-sm text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{user?.phone || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Role</p>
              <p className="text-sm text-gray-900 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                setForm({ name: user?.name || "", phone: user?.phone || "" });
                setEditing(true);
              }}
              className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-semibold hover:bg-teal-800"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-teal-700 text-white rounded-md py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60">
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-semibold hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}