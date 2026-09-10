import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const [expandedId, setExpandedId] = useState(null);
  const [deptUsers, setDeptUsers] = useState({}); // { [deptId]: { loading, error, users } }

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/departments", form);
      setSuccess("Department created successfully");
      setForm({ name: "", description: "" });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dept) => {
    setEditingId(dept._id);
    setEditForm({ name: dept.name, description: dept.description || "" });
  };

  const handleUpdate = async (id) => {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/departments/${id}`, editForm);
      setSuccess("Department updated successfully");
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const toggleUsers = async (deptId) => {
    if (expandedId === deptId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(deptId);
    if (deptUsers[deptId]) return; // already fetched, use cache

    setDeptUsers((prev) => ({ ...prev, [deptId]: { loading: true, error: "", users: [] } }));
    try {
      const res = await api.get(`/departments/${deptId}/users`);
      setDeptUsers((prev) => ({ ...prev, [deptId]: { loading: false, error: "", users: res.data.data } }));
    } catch (err) {
      setDeptUsers((prev) => ({
        ...prev,
        [deptId]: { loading: false, error: err.response?.data?.message || "Could not load users", users: [] },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Departments</h1>
        <p className="text-sm text-gray-500 mb-6">Manage civic departments (Water Works, Roads, etc.)</p>

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

        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Add new department</h2>
          <input type="text" placeholder="Department name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input type="text" placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="submit" disabled={submitting}
            className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60">
            {submitting ? "Adding..." : "Add Department"}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept._id} className="bg-white rounded-xl border border-gray-200 p-4">
                {editingId === dept._id ? (
                  <div className="space-y-2">
                    <input type="text" value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input type="text" value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(dept._id)}
                        className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-teal-800">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="bg-gray-100 text-gray-700 rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-500">{dept.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleUsers(dept._id)} className="text-teal-700 text-xs font-medium hover:underline">
                          {expandedId === dept._id ? "Hide Users" : "View Users"}
                        </button>
                        <button onClick={() => startEdit(dept)} className="text-teal-700 text-xs font-medium hover:underline">Edit</button>
                      </div>
                    </div>

                    {expandedId === dept._id && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {deptUsers[dept._id]?.loading && (
                          <p className="text-xs text-gray-500">Loading users...</p>
                        )}
                        {deptUsers[dept._id]?.error && (
                          <p className="text-xs text-red-600">{deptUsers[dept._id].error}</p>
                        )}
                        {deptUsers[dept._id] && !deptUsers[dept._id].loading && !deptUsers[dept._id].error && (
                          deptUsers[dept._id].users.length === 0 ? (
                            <p className="text-xs text-gray-500">No staff assigned to this department yet.</p>
                          ) : (
                                                        <ul className="space-y-2">
                              {deptUsers[dept._id].users.map((u) => (
                                <li key={u._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">{u.name}</span>
                                    <span className={u.isActive ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                                      {u.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-gray-600">Email: {u.email}</div>
                                  <div className="text-gray-600">Phone: {u.phone || "Not provided"}</div>
                                  <div className="text-gray-600">Role: Department Staff</div>
                                  <div className="text-gray-500">
                                    Joined: {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {departments.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No departments yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}