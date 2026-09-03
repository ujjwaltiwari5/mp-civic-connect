import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Phase 9 me admin assign karega — abhi null rahega
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
        images: {
      type: [String], // Cloudinary secure URLs
      default: [],
    },
    status: {
      type: String,
      enum: ["submitted", "assigned", "in_progress", "resolved", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// admin table + citizen list dono is combination par query karenge
complaintSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.model("Complaint", complaintSchema);