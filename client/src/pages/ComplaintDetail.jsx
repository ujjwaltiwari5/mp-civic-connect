import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getComplaintById, verifyResolution } from "../services/complaints";
import { useAuth } from "../context/AuthContext";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge, { STATUS_META } from "../components/StatusBadge";

const BREAKDOWN_LABELS = {
  severity: "Severity",
  duplicateCount: "Duplicate reports",
  categoryWeight: "Category",
  locationImportance: "Ward importance",
  ageFactor: "Age (unresolved time)",
};

function PriorityBreakdown({ score, breakdown }) {
  if (!breakdown) return null;
  const maxPart = Math.max(1, ...Object.values(breakdown));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Priority Score</h3>
        <PriorityBadge score={score} />
      </div>
      <div className="space-y-2">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-36 shrink-0">
              {BREAKDOWN_LABELS[key] || key}
            </span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full"
                style={{ width: `${Math.min(100, (value / maxPart) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-10 text-right">{value.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Each factor's contribution to the total priority score (out of 100).
      </p>
    </div>
  );
}

function VerifyResolutionCard({ complaintId, onVerified }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (action) => {
    if (action === "reject" && !note.trim()) {
      setError("Please tell us why you're reopening this complaint.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await verifyResolution(complaintId, { action, note: note.trim() });
      setNote("");
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        Department ne ise resolved mark kiya hai
      </p>
      <p className="text-xs text-amber-700 mb-3">
        Kya ye issue waqai fix ho gaya? Confirm karo, ya reason bata kar dobara reopen karo.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note (reopen karte waqt zaroori hai)"
        className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5 mb-3">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          disabled={submitting}
          onClick={() => handleVerify("confirm")}
          className="flex-1 bg-teal-700 text-white rounded-md py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
        >
          Haan, Fixed Hai
        </button>
        <button
          disabled={submitting}
          onClick={() => handleVerify("reject")}
          className="flex-1 bg-white text-amber-800 border border-amber-300 rounded-md py-2 text-sm font-semibold hover:bg-amber-100 disabled:opacity-60"
        >
          Nahi, Reopen Karo
        </button>
      </div>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");

  const loadComplaint = () => {
    getComplaintById(id)
      .then((res) => {
        setComplaint(res.data.data.complaint);
        setTimeline(res.data.data.timeline);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load complaint");
      });
  };

  useEffect(() => {
    loadComplaint();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600 mb-2">{error}</p>
          <Link to="/complaints/mine" className="text-teal-700 hover:underline text-sm">
            &larr; Back to My Complaints
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
        <div className="max-w-2xl mx-auto text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  const coords = complaint.location?.coordinates;
  const canSeePriority = user?.role === "admin" || user?.role === "department_user";
  const isOwner = user?.id === complaint.reporter;
  const needsVerification = isOwner && complaint.status === "resolved";

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/complaints/mine" className="text-teal-700 hover:underline text-sm">
          &larr; Back to My Complaints
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mt-3">
          <div className="flex justify-between items-start gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{complaint.title}</h1>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="text-sm text-teal-700 font-medium mt-1">{complaint.category?.name}</p>
          {complaint.department?.name && (
            <p className="text-sm text-slate-500">Assigned: {complaint.department.name}</p>
          )}
          <p className="mt-3 text-slate-700">{complaint.description}</p>

          {complaint.images && complaint.images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {complaint.images.map((url, i) => (
                <img key={i} src={url} alt="complaint" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
              ))}
            </div>
          )}

          {complaint.address && <p className="text-xs text-slate-400 mt-2">{complaint.address}</p>}
          {coords && (
            <div className="h-40 w-full rounded-lg overflow-hidden border border-slate-200 mt-2">
              <MapContainer
                center={[coords[1], coords[0]]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={[coords[1], coords[0]]} />
              </MapContainer>
            </div>
          )}
        </div>

        {needsVerification && (
          <VerifyResolutionCard complaintId={complaint._id} onVerified={loadComplaint} />
        )}

        {canSeePriority && (
          <PriorityBreakdown score={complaint.priorityScore} breakdown={complaint.priorityBreakdown} />
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Status Timeline</h2>
          <div className="space-y-4">
            {timeline.map((t) => (
              <div key={t._id} className="flex gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${STATUS_META[t.status]?.dot || "bg-slate-400"}`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {STATUS_META[t.status]?.label || t.status}
                  </p>
                  {t.note && <p className="text-sm text-slate-600">{t.note}</p>}
                  <p className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleString()} — {t.updatedBy?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}