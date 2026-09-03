import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getMyComplaints } from "../services/complaints";
import { Link } from "react-router-dom";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    getMyComplaints().then((res) => setComplaints(res.data.data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">My Complaints</h1>
      {complaints.length === 0 && <p>No complaints yet.</p>}
      {complaints.map((c) => {
        const coords = c.location?.coordinates; // [lng, lat]
        return (
          <div key={c._id} className="border rounded p-3 mb-3">
            <div className="flex justify-between">
              <span className="font-semibold">{c.title}</span>
              <span className="text-sm px-2 py-0.5 rounded bg-gray-100">{c.status}</span>
            </div>
            <p className="text-sm text-gray-600">{c.category?.name}</p>
            <p className="text-sm mt-1">{c.description}</p>
            {c.address && <p className="text-xs text-gray-500 mt-1">{c.address}</p>}
            {c.images && c.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {c.images.map((url, i) => (
                  <img key={i} src={url} alt="complaint" className="w-16 h-16 object-cover rounded border" />
                ))}
              </div>
            )}
            {coords && (
              <>
                <div className="h-32 w-full rounded overflow-hidden border mt-2">
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
                <Link
                  to={`/complaints/${c._id}`}
                  className="text-teal-700 hover:underline text-xs mt-2 inline-block"
                >
                  View Details →
                </Link>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
