import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { updateComplaintStatus } from "../../services/complaints";
import StatusBadge from "../../components/StatusBadge";

const STATUS_OPTIONS = ["in_progress", "resolved", "rejected"];

export default function UpdateComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("in_progress");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("note", note);
      files.forEach((f) => formData.append("evidenceImages", f));

      await updateComplaintStatus(id, formData);
      navigate("/department/complaints");
    } catch {
      setError("Update failed, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link to="/department/complaints" className="text-sm text-teal-700 hover:underline">
          ← Back to My Complaints
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-3">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Update Complaint</h1>
          <p className="text-sm text-slate-500 mb-6">Set the new status and add a note for the citizen.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="What was done, what's the current status..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Evidence Photos (optional, max 3)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-700 text-white rounded-md py-2.5 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60 transition"
            >
              {submitting ? "Updating..." : "Update Status"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
