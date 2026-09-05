import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { updateComplaintStatus } from "../../services/complaints";

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
      setError("Update fail ho gaya, dobara try karo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-4">
      <Link to="/department/complaints" className="text-sm text-teal-700 hover:underline">
        ← Back to My Complaints
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Update Complaint</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="border rounded px-3 py-2 w-full"
            placeholder="Kya kaam hua, kya status hai..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Evidence Photos (optional, max 3)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Updating..." : "Update Status"}
        </button>
      </form>
    </div>
  );
}