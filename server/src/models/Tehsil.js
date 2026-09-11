import mongoose from "mongoose";

const tehsilSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    // Cached GeoJSON boundary (fetched from Nominatim the first time this
    // tehsil's boundary is requested, then reused) — avoids hitting the
    // OSM Nominatim API on every complaint submission from this tehsil.
    boundary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    boundaryFetchedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
tehsilSchema.index({ district: 1, name: 1 }, { unique: true });

export default mongoose.model("Tehsil", tehsilSchema);