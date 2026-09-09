import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import { createComplaint } from "../services/complaints";
import { getWards } from "../services/wards";

const BHOPAL_CENTER = [23.2599, 77.4126];
const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function NewComplaint() {
  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    ward: "",
  });
  const [images, setImages] = useState([]);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.data));
    getWards().then((res) => setWards(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!position) {
      setError("Please mark the location on map");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("severity", form.severity);
      formData.append("ward", form.ward);
      formData.append("lat", position.lat);
      formData.append("lng", position.lng);
      images.forEach((img) => formData.append("images", img));

      await createComplaint(formData);
      navigate("/complaints/mine");
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Report a Complaint</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Describe the issue"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <select
          className="w-full border rounded p-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            How severe is this issue?
          </label>
          <select
            className="w-full border rounded p-2"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            required
          >
            <option value="">Select severity</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ward</label>
          <select
            className="w-full border rounded p-2"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
            required
          >
            <option value="">Select ward</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Photos (optional, up to 5)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Complaint location (Mark the location on map)
          </label>
          <div className="h-64 w-full rounded overflow-hidden border">
            <MapContainer
              center={BHOPAL_CENTER}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          {position && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          )}
        </div>
        <button
          className="bg-teal-700 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
