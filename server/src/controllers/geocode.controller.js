// Generic "forward geocode" helper used to re-center the complaint map when
// the citizen picks a City (urban) or a District shows up before its Tehsil
// boundary has loaded (rural). Same Nominatim source the rest of the project
// already uses (utils/geocode.js for reverse geocoding, tehsil.controller.js
// for boundaries) — this just returns a plain lat/lon, no polygon, so it's a
// much lighter request.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Best-effort, in-memory only (resets on server restart/cold start) — fine
// here since this is just for re-centering a map, not stored data.
const cache = new Map();

export const getPlaceCenter = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "q (place name) is required",
      });
    }

    const cacheKey = q.toLowerCase();
    if (cache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        data: cache.get(cacheKey),
        message: "Place center fetched (cached)",
      });
    }

    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`;

    let results = [];
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "BhopalCivicConnect/1.0 (academic project)" },
      });
      results = await response.json();
    } catch (fetchErr) {
      results = [];
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "Place not found",
      });
    }

    const center = {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    };
    cache.set(cacheKey, center);

    return res.status(200).json({
      success: true,
      data: center,
      message: "Place center fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};