import api from "./api";

// q should be a full-ish query like "Indore, Madhya Pradesh, India" for
// accurate results. Returns { lat, lon } or null if not found.
export const getPlaceCenter = (q) => api.get("/geocode/center", { params: { q } });