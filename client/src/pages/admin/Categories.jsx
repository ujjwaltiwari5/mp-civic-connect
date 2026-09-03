import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", description: "", priorityWeight: 0.5 });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", priorityWeight: 0.5 });

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/categories", { ...form, priorityWeight: Number(form.priorityWeight) });
      setSuccess("Category created successfully");
      setForm({ name: "", description: "", priorityWeight: 0.5 });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditForm({ name: cat.name, description: cat.description || "", priorityWeight: cat.priorityWeight });
  };

  const handleUpdate = async (id) => {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/categories/${id}`, { ...editForm, priorityWeight: Number(editForm.priorityWeight) });
      setSuccess("Category updated successfully");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Categories</h1>
        <p className="text-sm text-gray-500 mb-6">Manage complaint categories and their priority weight (0 to 1)</p>

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
          <h2 className="text-sm font-semibold text-gray-900">Add new category</h2>
          <input type="text" placeholder="Category name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input type="text" placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority weight: {form.priorityWeight}</label>
            <input type="range" min="0" max="1" step="0.1" value={form.priorityWeight}
              onChange={(e) => setForm({ ...form, priorityWeight: e.target.value })} className="w-full" />
          </div>
          <button type="submit" disabled={submitting}
            className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60">
            {submitting ? "Adding..." : "Add Category"}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat._id} className="bg-white rounded-xl border border-gray-200 p-4">
                {editingId === cat._id ? (
                  <div className="space-y-2">
                    <input type="text" value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input type="text" value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Priority weight: {editForm.priorityWeight}</label>
                      <input type="range" min="0" max="1" step="0.1" value={editForm.priorityWeight}
                        onChange={(e) => setEditForm({ ...editForm, priorityWeight: e.target.value })} className="w-full" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(cat._id)}
                        className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-teal-800">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="bg-gray-100 text-gray-700 rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.description || "No description"} &middot; weight: {cat.priorityWeight}</p>
                    </div>
                    <button onClick={() => startEdit(cat)} className="text-teal-700 text-xs font-medium hover:underline">Edit</button>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No categories yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}