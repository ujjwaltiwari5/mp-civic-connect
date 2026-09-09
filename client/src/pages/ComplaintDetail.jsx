import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getComplaintById } from "../services/complaints";
import { useAuth } from "../context/AuthContext";
import PriorityBadge from "../components/PriorityBadge";

const statusLabels = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

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
    <div className="border rounded p-3 mt-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Priority Score</h3>
        <PriorityBadge score={score} />
      </div>
      <div className="space-y-1.5">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-36 shrink-0">
              {BREAKDOWN_LABELS[key] || key}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-teal-600"
                style={{ width: `${Math.min(100, (value / maxPart) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-10 text-right">{value.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Each factor's contribution to the total priority score (out of 100).
      </p>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getComplaintById(id)
      .then((res) => {
        setComplaint(res.data.data.complaint);
        setTimeline(res.data.data.timeline);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load complaint");
      });
  }, [id]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4">
        <p className="text-red-600">{error}</p>
        <Link to="/complaints/mine" className="text-teal-700 hover:underline text-sm">
          &larr; Back to My Complaints
        </Link>
      </div>
    );
  }

  if (!complaint) {
    return <div className="max-w-2xl mx-auto mt-8 p-4">Loading...</div>;
  }

  const coords = complaint.location?.coordinates;
  const canSeePriority = user?.role === "admin" || user?.role === "department_user";

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <Link to="/complaints/mine" className="text-teal-700 hover:underline text-sm">
        &larr; Back to My Complaints
      </Link>

      <div className="flex justify-between items-start mt-3">
        <h1 className="text-2xl font-bold">{complaint.title}</h1>
        <span className="text-sm px-2 py-0.5 rounded bg-gray-100">
          {statusLabels[complaint.status] || complaint.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{complaint.category?.name}</p>
      {complaint.department?.name && (
        <p className="text-sm text-gray-600">Assigned: {complaint.department.name}</p>
      )}
      <p className="mt-3">{complaint.description}</p>

      {complaint.images && complaint.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {complaint.images.map((url, i) => (
            <img key={i} src={url} alt="complaint" className="w-24 h-24 object-cover rounded border" />
          ))}
        </div>
      )}

      {complaint.address && <p className="text-xs text-gray-500 mt-2">{complaint.address}</p>}
      {coords && (
        <div className="h-40 w-full rounded overflow-hidden border mt-2">
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

      {canSeePriority && (
        <PriorityBreakdown score={complaint.priorityScore} breakdown={complaint.priorityBreakdown} />
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Status Timeline</h2>
      <div className="space-y-3">
        {timeline.map((t) => (
          <div key={t._id} className="border-l-2 border-teal-700 pl-3">
            <p className="text-sm font-medium">{statusLabels[t.status] || t.status}</p>
            {t.note && <p className="text-sm text-gray-600">{t.note}</p>}
            <p className="text-xs text-gray-400">
              {new Date(t.createdAt).toLocaleString()} — {t.updatedBy?.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
