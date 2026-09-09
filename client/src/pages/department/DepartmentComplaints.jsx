import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedComplaints } from "../../services/complaints";
import PriorityBadge from "../../components/PriorityBadge";
import StatusBadge from "../../components/StatusBadge";

const STATUS_OPTIONS = ["assigned", "in_progress", "resolved", "rejected","closed"];

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
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Department's Complaints</h1>
        <p className="text-sm text-slate-500 mb-6">Complaints assigned to your department, sorted by what matters most.</p>

        <div className="flex flex-wrap gap-3 mb-4 bg-white border border-slate-200 rounded-xl p-3">
          <input
            type="text"
            placeholder="Search title/description..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="status_asc">Status (A-Z)</option>
            <option value="priorityScore_desc">Priority (High → Low)</option>
            <option value="priorityScore_asc">Priority (Low → High)</option>
          </select>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reporter</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No complaints assigned yet.
                    </td>
                  </tr>
                )}
                {complaints.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{c.title}</td>
                    <td className="px-3 py-2.5 text-slate-600">{c.category?.name}</td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge score={c.priorityScore} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{c.reporter?.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2.5 flex gap-3">
                      <Link to={`/complaints/${c._id}`} className="text-teal-700 hover:underline font-medium">
                        View →
                      </Link>
                      <Link
                        to={`/department/complaints/${c._id}/update`}
                        className="text-teal-700 hover:underline font-medium"
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

        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            Page {meta.page} of {totalPages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-white transition"
            >
              Prev
            </button>
            <button
              disabled={meta.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
