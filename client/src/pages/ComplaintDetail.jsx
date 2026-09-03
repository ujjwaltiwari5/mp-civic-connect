import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getComplaintById } from "../services/complaints";

const statusLabels = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export default function ComplaintDetail() {
  const { id } = useParams();
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