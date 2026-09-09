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
  const [duplicateWarning, setDuplicateWarning] = useState(null);
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

      const res = await createComplaint(formData);
      const created = res.data.data;
      if (created.possibleDuplicates?.length > 0) {
        setDuplicateWarning(created.possibleDuplicates);
        setLoading(false);
        return;
      }
      navigate("/complaints/mine");
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Report a Complaint</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tell us what's wrong and where — we'll route it to the right department.
        </p>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {duplicateWarning ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Complaint submit ho gaya — lekin ye pehle se report ho chuka ho sakta hai
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Hamare system ko {duplicateWarning.length} milte-julte complaint(s) isi area me mile hain.
                </p>
                <div className="space-y-2">
                  {duplicateWarning.map((m) => (
                    <div key={m.complaint._id} className="bg-white border border-amber-200 rounded-md px-3 py-2">
                      <p className="text-sm font-medium text-slate-800">{m.complaint.title}</p>
                      <p className="text-xs text-slate-500">
                        Match: {(m.score * 100).toFixed(0)}% &middot; {m.distanceMeters}m door &middot; Status: {m.complaint.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate("/complaints/mine")}
                className="w-full bg-teal-700 text-white rounded-md py-2.5 text-sm font-semibold hover:bg-teal-800 transition"
              >
                Theek hai, My Complaints dekhein
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Broken streetlight near main road"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  className={inputClass}
                  placeholder="Describe the issue"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Severity
                  </label>
                  <select
                    className={inputClass}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ward</label>
                  <select
                    className={inputClass}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Photos (optional, up to 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Complaint location (mark it on the map)
                </label>
                <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-300">
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
                  <p className="text-xs text-slate-500 mt-1.5">
                    Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </p>
                )}
              </div>
              <button
                className="w-full bg-teal-700 text-white rounded-md py-2.5 text-sm font-semibold hover:bg-teal-800 disabled:opacity-60 transition"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}