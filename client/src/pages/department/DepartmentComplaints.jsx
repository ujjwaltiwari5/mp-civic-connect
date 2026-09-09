import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedComplaints } from "../../services/complaints";
import PriorityBadge from "../../components/PriorityBadge";

const STATUS_OPTIONS = ["assigned", "in_progress", "resolved", "rejected"];

export default function DepartmentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    sortBy: "createdAt",
    order: "desc",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    getAssignedComplaints(filters)
      .then((res) => {
        setComplaints(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Complaints load nahi ho payi."))
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">My Department's Complaints</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search title/description..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-56"
        />
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={`${filters.sortBy}_${filters.order}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split("_");
            setFilters((f) => ({ ...f, sortBy, order, page: 1 }));
          }}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="createdAt_desc">Newest first</option>
          <option value="createdAt_asc">Oldest first</option>
          <option value="status_asc">Status (A-Z)</option>
          <option value="priorityScore_desc">Priority (High → Low)</option>
          <option value="priorityScore_asc">Priority (Low → High)</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2">Title</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2">Priority</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Reporter</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No complaints assigned yet.
                  </td>
                </tr>
              )}
              {complaints.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="px-3 py-2">{c.title}</td>
                  <td className="px-3 py-2">{c.category?.name}</td>
                  <td className="px-3 py-2">
                    <PriorityBadge score={c.priorityScore} />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{c.status}</span>
                  </td>
                  <td className="px-3 py-2">{c.reporter?.name}</td>
                  <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 flex gap-3">
                    <Link to={`/complaints/${c._id}`} className="text-teal-700 hover:underline">
                      View →
                    </Link>
                    <Link
                      to={`/department/complaints/${c._id}/update`}
                      className="text-teal-700 hover:underline"
                    >
                      Update →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 text-sm">
        <span>
          Page {meta.page} of {totalPages} ({meta.total} total)
        </span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={meta.page >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
