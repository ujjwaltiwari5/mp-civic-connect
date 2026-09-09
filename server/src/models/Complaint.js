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
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["submitted", "assigned", "in_progress", "resolved", "rejected","closed"],
      default: "submitted",
    },
    evidenceImages: {
      type: [String],
      default: [],
    },
    // ---- Phase 11: priority scoring ----
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null, // Phase 11 se pehle ki complaints ke liye null rahega
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      default: null, // Phase 11 se pehle ki complaints ke liye null rahega
    },
    duplicateCount: {
      type: Number,
      default: 0, // Phase 12 (duplicate detection) tak hamesha 0
      min: 0,
    },
        duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null, // set hota hai jab admin confirm karta hai ki ye duplicate hai
    },
    duplicateReviewStatus: {
      type: String,
      enum: ["none", "pending", "confirmed", "dismissed"],
      default: "none",
    },
    possibleDuplicates: {
      type: [
        {
          complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
          score: { type: Number },
          textScore: { type: Number },
          proximityScore: { type: Number },
          distanceMeters: { type: Number },
        },
      ],
      default: [],
    },
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    priorityBreakdown: {
      severity: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 },
      categoryWeight: { type: Number, default: 0 },
      locationImportance: { type: Number, default: 0 },
      ageFactor: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
complaintSchema.index({ reporter: 1, createdAt: -1 });
complaintSchema.index({ location: "2dsphere" });
complaintSchema.index({ priorityScore: -1 });

export default mongoose.model("Complaint", complaintSchema);