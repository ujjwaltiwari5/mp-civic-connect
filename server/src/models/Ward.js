import mongoose from "mongoose";

const wardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ward name is required"],
      unique: true,
      trim: true,
    },
    description: { type: String, trim: true },
    importanceWeight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Ward", wardSchema);