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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
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
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null,
    },
    // ---- urban location ----
    city: {
      type: String,
      trim: true,
      default: null, // urban complaints only
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      default: null, // set only when the ward was picked from the seeded Bhopal list
    },
    wardName: {
      type: String,
      trim: true,
      default: null, // free-typed ward name — used for any city other than Bhopal,
      // or when the citizen's ward wasn't in Bhopal's seeded list either
    },
    // ---- MP statewide expansion: rural location (Ward ka alternative) ----
    locationType: {
      type: String,
      enum: ["urban", "rural"],
      default: "urban",
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      default: null, // rural complaints only
    },
    tehsil: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tehsil",
      default: null, // rural complaints only
    },
    block: {
      type: String,
      trim: true,
      default: null, // rural complaints only — free text
    },
    village: {
      type: String,
      trim: true,
      default: null, // rural complaints only — free text
    },
    duplicateCount: {
      type: Number,
      default: 0,
      min: 0,
    },
        duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
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