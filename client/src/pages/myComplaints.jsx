import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getMyComplaints } from "../services/complaints";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyComplaints()
      .then((res) => setComplaints(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Complaints</h1>
        <p className="text-sm text-slate-500 mb-6">Everything you've reported, and where it stands.</p>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}

        {!loading && complaints.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 mb-4">You haven't reported any issues yet.</p>
            <Link
              to="/complaints/new"
              className="inline-block bg-teal-700 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-teal-800 transition"
            >
              Report your first issue
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {complaints.map((c) => {
            const coords = c.location?.coordinates; // [lng, lat]
            return (
              <div
                key={c._id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <span className="font-semibold text-slate-900">{c.title}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-teal-700 font-medium mt-1">{c.category?.name}</p>
                <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                {c.address && <p className="text-xs text-slate-400 mt-1">{c.address}</p>}
                {c.images && c.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {c.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="complaint"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                    ))}
                  </div>
                )}
                {coords && (
                  <div className="h-32 w-full rounded-lg overflow-hidden border border-slate-200 mt-3">
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
                <Link
                  to={`/complaints/${c._id}`}
                  className="text-teal-700 hover:underline text-xs mt-3 inline-block font-medium"
                >
                  View Details →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
