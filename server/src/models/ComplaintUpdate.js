import mongoose from "mongoose";

const complaintUpdateSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "assigned", "in_progress", "resolved", "rejected"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// timeline hamesha ek complaint ke liye chronological order me fetch hogi
complaintUpdateSchema.index({ complaint: 1, createdAt: 1 });

export default mongoose.model("ComplaintUpdate", complaintUpdateSchema);