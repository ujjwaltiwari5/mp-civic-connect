import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDuplicateReviewQueue, reviewDuplicate } from "../../services/complaints";
import StatusBadge from "../../components/StatusBadge";

export default function DuplicateReview() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({}); // { [complaintId]: originalComplaintId }
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    getDuplicateReviewQueue()
      .then((res) => setQueue(res.data.data))
      .catch(() => setError("Queue load nahi ho payi."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (complaintId) => {
    const originalComplaintId = selected[complaintId];
    if (!originalComplaintId) {
      alert("Pehle ek original complaint select karo.");
      return;
    }
    setActing(complaintId);
    try {
      await reviewDuplicate(complaintId, { action: "confirm", originalComplaintId });
      setQueue((prev) => prev.filter((c) => c._id !== complaintId));
    } catch {
      alert("Confirm fail ho gaya, dobara try karo.");
    } finally {
      setActing(null);
    }
  };

  const handleDismiss = async (complaintId) => {
    setActing(complaintId);
    try {
      await reviewDuplicate(complaintId, { action: "dismiss" });
      setQueue((prev) => prev.filter((c) => c._id !== complaintId));
    } catch {
      alert("Dismiss fail ho gaya, dobara try karo.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Duplicate Review</h1>
        <p className="text-sm text-slate-500 mb-6">
          System ne jo possible duplicate complaints flag kiye hain, unhe confirm ya dismiss karo.
        </p>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && queue.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Review ke liye koi pending duplicate nahi hai.
          </div>
        )}

        <div className="space-y-4">
          {queue.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link to={`/complaints/${c._id}`} className="font-semibold text-slate-900 hover:text-teal-700">
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.category?.name} &middot; {c.reporter?.name} &middot;{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Possible matches
              </p>
              <div className="space-y-2 mb-4">
                {c.possibleDuplicates.map((m) => (
                  <label
                    key={m.complaint._id}
                    className="flex items-start gap-3 border border-slate-200 rounded-md px-3 py-2 cursor-pointer hover:border-teal-300 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50"
                  >
                    <input
                      type="radio"
                      name={`match-${c._id}`}
                      className="mt-1"
                      checked={selected[c._id] === m.complaint._id}
                      onChange={() =>
                        setSelected((prev) => ({ ...prev, [c._id]: m.complaint._id }))
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{m.complaint.title}</p>
                      <p className="text-xs text-slate-500">
                        Confidence: {(m.score * 100).toFixed(0)}% (text {(m.textScore * 100).toFixed(0)}% +
                        proximity {(m.proximityScore * 100).toFixed(0)}%) &middot; {m.distanceMeters}m door
                      </p>
                    </div>
                    <StatusBadge status={m.complaint.status} />
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  disabled={acting === c._id}
                  onClick={() => handleConfirm(c._id)}
                  className="flex-1 bg-teal-700 text-white rounded-md py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
                >
                  Confirm Duplicate
                </button>
                <button
                  disabled={acting === c._id}
                  onClick={() => handleDismiss(c._id)}
                  className="flex-1 bg-slate-100 text-slate-700 rounded-md py-2 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}