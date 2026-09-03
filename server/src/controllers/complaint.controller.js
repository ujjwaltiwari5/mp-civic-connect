import ComplaintUpdate from "../models/ComplaintUpdate.js";
import { z } from "zod";
import Complaint from "../models/Complaint.js";
import Category from "../models/Category.js";
import { reverseGeocode } from "../utils/geocode.js";
const createComplaintSchema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().trim().min(10, "Description too short").max(1000),
  category: z.string().min(1, "Category is required"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const createComplaint = async (req, res) => {
  try {
    const parsed = createComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.flatten(),
      });
    }
    const { title, description, category, lat, lng } = parsed.data;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const images = (req.files || []).map((f) => f.path); // Cloudinary URLs
    let address = null;
    try{
      address = await reverseGeocode(lat, lng);
    } catch(err) {
      address = null;
    }
    const complaint = await Complaint.create({
      
      reporter: req.user._id,
      title,
      description,
      category,
      images,
      location: {type: "Point", coordinates:[lng,lat]},
      address,
    });
        await ComplaintUpdate.create({
      complaint: complaint._id,
      status: "submitted",
      note: "Complaint submitted",
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: complaint,
      message: "Complaint submitted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ reporter: req.user._id })
      .populate("category", "name")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: complaints,
      message: "Complaints fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("category", "name")
      .populate("department", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this complaint",
      });
    }

    const timeline = await ComplaintUpdate.find({ complaint: complaint._id })
      .populate("updatedBy", "name")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: { complaint, timeline },
      message: "Complaint fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};