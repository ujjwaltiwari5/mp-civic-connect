import { z } from "zod";
import Complaint from "../models/Complaint.js";
import Category from "../models/Category.js";

const createComplaintSchema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().trim().min(10, "Description too short").max(1000),
  category: z.string().min(1, "Category is required"),
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
    const { title, description, category } = parsed.data;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const images = (req.files || []).map((f) => f.path); // Cloudinary URLs

    const complaint = await Complaint.create({
      reporter: req.user._id,
      title,
      description,
      category,
      images,
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