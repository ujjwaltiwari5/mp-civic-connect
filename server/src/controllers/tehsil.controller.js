import Tehsil from "../models/Tehsil.js";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export const getTehsilBoundary = async (req, res) => {
  try {
    const tehsil = await Tehsil.findById(req.params.id).populate("district", "name");
    if (!tehsil) {
      return res.status(404).json({
        success: false,
        message: "Tehsil not found",
      });
    }

    if (tehsil.boundary) {
      return res.status(200).json({
        success: true,
        data: { boundary: tehsil.boundary, cached: true },
        message: "Tehsil boundary fetched",
      });
    }

    const query = `${tehsil.name} Tehsil, ${tehsil.district.name}, Madhya Pradesh, India`;
    const url = `${NOMINATIM_URL}?format=json&polygon_geojson=1&limit=1&q=${encodeURIComponent(query)}`;

    let results = [];
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "BhopalCivicConnect/1.0 (academic project)" },
      });
      results = await response.json();
    } catch (fetchErr) {
      results = [];
    }

    if (!Array.isArray(results) || results.length === 0 || !results[0].geojson) {
      return res.status(200).json({
        success: true,
        data: { boundary: null, cached: false },
        message: "No boundary found for this tehsil",
      });
    }

    const boundary = results[0].geojson;
    tehsil.boundary = boundary;
    tehsil.boundaryFetchedAt = new Date();
    await tehsil.save();

    return res.status(200).json({
      success: true,
      data: { boundary, cached: false },
      message: "Tehsil boundary fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};