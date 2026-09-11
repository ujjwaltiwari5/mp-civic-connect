import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import { createComplaint } from "../services/complaints";
import { getWards } from "../services/wards";
import { getDistricts, getTehsilsByDistrict, getTehsilBoundary } from "../services/districts";
import { getPlaceCenter } from "../services/geocode";

const BHOPAL_CENTER = [23.2599, 77.4126];
const MP_CENTER = [23.4733, 77.947]; // rough state centroid, used until a city/district center loads

// Best-effort list of MP's major urban centres (all 16 Nagar Nigams + most
// district headquarters + a couple of well-known industrial towns). Only
// Bhopal has a seeded Ward list with real importance weights, so every other
// city's ward is entered as free text — same "Other" escape hatch is also
// offered for Bhopal in case a ward is missing from that list.
const MP_CITIES = [
  "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
  "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
  "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
  "Indore", "Itarsi", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone",
  "Maihar", "Mandla", "Mandsaur", "Mauganj", "Morena", "Narmadapuram",
  "Narsinghpur", "Neemuch", "Niwari", "Pandhurna", "Panna", "Pithampur",
  "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni",
  "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli",
  "Tikamgarh", "Ujjain", "Umaria", "Vidisha",
];
const OTHER_CITY = "__other_city__";
const MANUAL_WARD = "__manual_ward__";

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

// Re-centers the map whenever the selected city/district changes, or fits it
// to the tehsil boundary polygon once that loads (boundary wins — it's more
// precise than a plain center point).
function MapController({ boundary, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (boundary) {
      try {
        const layer = L.geoJSON(boundary);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
          return;
        }
      } catch (err) {
        // Malformed/unexpected geometry — fall through to the center below.
      }
    }
    if (center) {
      map.setView([center.lat, center.lon], zoom);
    }
  }, [boundary, center, zoom, map]);
  return null;
}

export default function NewComplaint() {
  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [boundary, setBoundary] = useState(null);
  const [boundaryStatus, setBoundaryStatus] = useState(""); // "", "loading", "not_found"
  const [cityCenter, setCityCenter] = useState(null);
  const [districtCenter, setDistrictCenter] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    locationType: "urban",
    // urban
    city: "",
    cityManual: "",
    ward: "", // Ward ObjectId, only used when city === "Bhopal" and picked from the list
    wardMode: "select", // "select" | "manual" — only relevant when city === "Bhopal"
    wardName: "", // free-typed ward — any non-Bhopal city, or Bhopal's manual fallback
    // rural
    district: "",
    tehsil: "",
    block: "",
    village: "",
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
    getDistricts().then((res) => setDistricts(res.data.data));
  }, []);

  const effectiveCity = form.city === OTHER_CITY ? form.cityManual.trim() : form.city;
  const isBhopal = form.city === "Bhopal";

  // Re-center the map on the selected city (debounced, so free-typing an
  // "Other" city name doesn't spam Nominatim on every keystroke).
  useEffect(() => {
    if (form.locationType !== "urban" || !effectiveCity) {
      setCityCenter(null);
      return;
    }
    const timer = setTimeout(() => {
      getPlaceCenter(`${effectiveCity}, Madhya Pradesh, India`)
        .then((res) => setCityCenter(res.data.data))
        .catch(() => setCityCenter(null));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.locationType, effectiveCity]);

  // Re-center on the selected district (shows immediately; the finer tehsil
  // boundary fit — once it loads — takes over from this).
  useEffect(() => {
    if (form.locationType !== "rural" || !form.district) {
      setDistrictCenter(null);
      return;
    }
    const districtObj = districts.find((d) => d._id === form.district);
    if (!districtObj) {
      setDistrictCenter(null);
      return;
    }
    getPlaceCenter(`${districtObj.name}, Madhya Pradesh, India`)
      .then((res) => setDistrictCenter(res.data.data))
      .catch(() => setDistrictCenter(null));
  }, [form.locationType, form.district, districts]);

  // Refetch tehsils whenever the selected district changes
  useEffect(() => {
    if (form.locationType !== "rural" || !form.district) {
      setTehsils([]);
      return;
    }
    getTehsilsByDistrict(form.district).then((res) => setTehsils(res.data.data));
  }, [form.locationType, form.district]);

  // Fetch (and cache-serve) the tehsil boundary whenever the selected tehsil changes
  useEffect(() => {
    if (form.locationType !== "rural" || !form.tehsil) {
      setBoundary(null);
      setBoundaryStatus("");
      return;
    }
    setBoundary(null);
    setBoundaryStatus("loading");
    getTehsilBoundary(form.tehsil)
      .then((res) => {
        const b = res.data.data.boundary;
        setBoundary(b);
        setBoundaryStatus(b ? "" : "not_found");
      })
      .catch(() => setBoundaryStatus("not_found"));
  }, [form.locationType, form.tehsil]);

  const switchLocationType = (locationType) => {
    setForm((f) => ({
      ...f,
      locationType,
      city: "",
      cityManual: "",
      ward: "",
      wardMode: "select",
      wardName: "",
      district: "",
      tehsil: "",
      block: "",
      village: "",
    }));
    setPosition(null);
    setBoundary(null);
    setBoundaryStatus("");
    setCityCenter(null);
    setDistrictCenter(null);
  };

  const handleCityChange = (value) => {
    setForm((f) => ({
      ...f,
      city: value,
      cityManual: "",
      ward: "",
      wardMode: "select",
      wardName: "",
    }));
    setPosition(null); // old marker is likely nowhere near the newly picked city
  };

  const handleDistrictChange = (value) => {
    setForm((f) => ({ ...f, district: value, tehsil: "" }));
    setPosition(null); // old marker is likely nowhere near the newly picked district
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!position) {
      setError("Please mark the location on map");
      return;
    }

    if (form.locationType === "urban") {
      if (!effectiveCity) {
        setError("Please select (or enter) your city");
        return;
      }
      const wardOk =
        (isBhopal && form.wardMode === "select" && form.ward) ||
        ((!isBhopal || form.wardMode === "manual") && form.wardName.trim());
      if (!wardOk) {
        setError("Please select or enter your ward");
        return;
      }
    } else if (form.locationType === "rural" && (!form.district || !form.tehsil || !form.village.trim())) {
      setError("Please select district, tehsil and enter the village name");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("severity", form.severity);
      formData.append("locationType", form.locationType);
      if (form.locationType === "urban") {
        formData.append("city", effectiveCity);
        if (isBhopal && form.wardMode === "select" && form.ward) {
          formData.append("ward", form.ward);
        } else {
          formData.append("wardName", form.wardName.trim());
        }
      } else {
        formData.append("district", form.district);
        formData.append("tehsil", form.tehsil);
        formData.append("block", form.block);
        formData.append("village", form.village);
      }
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

  const mapCenter = form.locationType === "rural" ? MP_CENTER : BHOPAL_CENTER;
  const controllerCenter = form.locationType === "urban" ? cityCenter : districtCenter;
  const controllerZoom = form.locationType === "urban" ? 13 : 10;

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
                  Complaint submitted — but it may already have been reported
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Our system found {duplicateWarning.length} similar complaint(s) in this area.
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
                Okay, View My Complaints
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Severity</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                <input className={inputClass + " bg-slate-50 text-slate-500"} value="Madhya Pradesh" disabled />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Area type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => switchLocationType("urban")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium border transition ${
                      form.locationType === "urban"
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    Urban (City/Ward)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchLocationType("rural")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium border transition ${
                      form.locationType === "rural"
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    Rural (District/Tehsil)
                  </button>
                </div>
              </div>

              {form.locationType === "urban" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <select
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      required
                    >
                      <option value="">Select city</option>
                      {MP_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value={OTHER_CITY}>Other (city not listed)</option>
                    </select>
                    {form.city === OTHER_CITY && (
                      <input
                        className={inputClass + " mt-2"}
                        placeholder="Enter your city name"
                        value={form.cityManual}
                        onChange={(e) => setForm({ ...form, cityManual: e.target.value })}
                        required
                      />
                    )}
                  </div>

                  {isBhopal && form.wardMode === "select" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ward</label>
                      <select
                        className={inputClass}
                        value={form.ward}
                        onChange={(e) => {
                          if (e.target.value === MANUAL_WARD) {
                            setForm({ ...form, wardMode: "manual", ward: "", wardName: "" });
                          } else {
                            setForm({ ...form, ward: e.target.value });
                          }
                        }}
                        required
                      >
                        <option value="">Select ward</option>
                        {wards.map((w) => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                        <option value={MANUAL_WARD}>Ward not in this list — type it myself</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ward</label>
                      <input
                        className={inputClass}
                        placeholder="Ward name/number"
                        value={form.wardName}
                        onChange={(e) => setForm({ ...form, wardName: e.target.value })}
                        required
                      />
                      {isBhopal && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, wardMode: "select", wardName: "" })}
                          className="text-xs text-teal-700 hover:underline mt-1"
                        >
                          Choose from Bhopal's ward list instead
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">District</label>
                      <select
                        className={inputClass}
                        value={form.district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        required
                      >
                        <option value="">Select district</option>
                        {districts.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Tehsil</label>
                      <select
                        className={inputClass}
                        value={form.tehsil}
                        onChange={(e) => setForm({ ...form, tehsil: e.target.value })}
                        required
                        disabled={!form.district}
                      >
                        <option value="">Select tehsil</option>
                        {tehsils.map((t) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Block</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Berasia"
                        value={form.block}
                        onChange={(e) => setForm({ ...form, block: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Village</label>
                      <input
                        className={inputClass}
                        placeholder="Village name"
                        value={form.village}
                        onChange={(e) => setForm({ ...form, village: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

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
                {form.locationType === "rural" && boundaryStatus === "loading" && (
                  <p className="text-xs text-slate-500 mb-1.5">Loading tehsil boundary...</p>
                )}
                {form.locationType === "rural" && boundaryStatus === "not_found" && (
                  <p className="text-xs text-amber-600 mb-1.5">
                    Tehsil boundary not found on the map — click your approximate location manually.
                  </p>
                )}
                <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-300">
                  <MapContainer
                    center={mapCenter}
                    zoom={form.locationType === "rural" ? 8 : 12}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    {boundary && (
                      <GeoJSON
                        key={form.tehsil}
                        data={boundary}
                        style={{ color: "#0f766e", weight: 2, fillOpacity: 0.1 }}
                      />
                    )}
                    <MapController boundary={boundary} center={controllerCenter} zoom={controllerZoom} />
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