import Ward from "../models/Ward.js";

export const getWards = async (req, res) => {
  try {
    const wards = await Ward.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: wards,
      message: "Wards fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const createWard = async (req, res) => {
  try {
    const { name, description, importanceWeight } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ward name is required",
      });
    }

    const existing = await Ward.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A ward with this name already exists",
      });
    }

    const ward = await Ward.create({
      name: name.trim(),
      description,
      importanceWeight: importanceWeight != null ? importanceWeight : 0.5,
    });

    return res.status(201).json({
      success: true,
      data: ward,
      message: "Ward created",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const updateWard = async (req, res) => {
  try {
    const { name, description, importanceWeight, isActive } = req.body;

    const ward = await Ward.findByIdAndUpdate(
      req.params.id,
      { name, description, importanceWeight, isActive },
      { new: true, runValidators: true }
    );

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ward,
      message: "Ward updated",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};