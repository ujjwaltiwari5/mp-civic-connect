import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: { type: String, trim: true },
    // Priority scoring formula (Phase 11) me use hoga — category kitni
    // urgent hoti hai usually, 0 (kam) se 1 (zyada) ke beech.
    priorityWeight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);