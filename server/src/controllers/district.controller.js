import District from "../models/District.js";
import Tehsil from "../models/Tehsil.js";

export const getDistricts = async (req, res) => {
  try {
    const districts = await District.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: districts,
      message: "Districts fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const getTehsilsByDistrict = async (req, res) => {
  try {
    const districtExists = await District.findById(req.params.districtId);
    if (!districtExists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    const tehsils = await Tehsil.find({ district: req.params.districtId }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: tehsils,
      message: "Tehsils fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};