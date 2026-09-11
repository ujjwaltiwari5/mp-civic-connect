import ComplaintUpdate from "../models/ComplaintUpdate.js";
import { z } from "zod";
import Complaint from "../models/Complaint.js";
import Category from "../models/Category.js";
import { reverseGeocode } from "../utils/geocode.js";
import Department from "../models/Department.js";
import Ward from "../models/Ward.js";
import District from "../models/District.js";
import Tehsil from "../models/Tehsil.js";
import { calculatePriorityScore } from "../services/priorityScoring.js";
import { findPossibleDuplicates } from "../services/duplicateDetection.js";
import { notifyUser, notifyDepartment } from "../services/notification.service.js";
import { asString } from "../utils/sanitizeFilter.js";

const createComplaintSchema = z
  .object({
    title: z.string().trim().min(3, "Title too short").max(120),
    description: z.string().trim().min(10, "Description too short").max(1000),
    category: z.string().min(1, "Category is required"),
    severity: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Severity must be low, medium, or high" }),
    }),
    locationType: z.enum(["urban", "rural"]).default("urban"),
    // urban fields
    city: z.string().trim().max(100).optional(),
    ward: z.string().optional(), // Ward ObjectId — set only when picked from the seeded Bhopal list
    wardName: z.string().trim().max(100).optional(), // free-typed ward — any other city, or Bhopal fallback
    // rural fields
    district: z.string().optional(),
    tehsil: z.string().optional(),
    block: z.string().trim().max(100).optional(),
    village: z.string().trim().max(100).optional(),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  })
  .superRefine((data, ctx) => {
    if (data.locationType === "urban") {
      if (!data.city || !data.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "City is required for an urban complaint",
        });
      }
      if (!data.ward && (!data.wardName || !data.wardName.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ward"],
          message: "Ward is required for an urban complaint",
        });
      }
    } else {
      if (!data.district) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["district"],
          message: "District is required for a rural complaint",
        });
      }
      if (!data.tehsil) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tehsil"],
          message: "Tehsil is required for a rural complaint",
        });
      }
      if (!data.village || !data.village.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["village"],
          message: "Village is required for a rural complaint",
        });
      }
    }
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
    const {
      title,
      description,
      category,
      severity,
      locationType,
      city,
      ward,
      wardName,
      district,
      tehsil,
      block,
      village,
      lat,
      lng,
    } = parsed.data;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    let wardExists = null; // only set for urban complaints where the ward was picked from the seeded list
    let districtExists = null;
    let tehsilExists = null;
    let resolvedWardName = null;

    if (locationType === "urban") {
      if (ward) {
        wardExists = await Ward.findById(ward);
        if (!wardExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid ward",
          });
        }
        resolvedWardName = wardExists.name;
      } else {
        resolvedWardName = wardName.trim();
      }
    } else {
      districtExists = await District.findById(district);
      if (!districtExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid district",
        });
      }
      tehsilExists = await Tehsil.findById(tehsil);
      if (!tehsilExists || tehsilExists.district.toString() !== district) {
        return res.status(400).json({
          success: false,
          message: "Invalid tehsil for the selected district",
        });
      }
    }

    const images = (req.files || []).map((f) => f.path); // Cloudinary URLs
    let address = null;
    try {
      address = await reverseGeocode(lat, lng);
    } catch (err) {
      address = null;
    }

    // A complaint has locationImportance only when it's tied to a known,
    // weighted Bhopal ward. Rural complaints, and urban complaints from a
    // ward that isn't in the seeded list, leave it undefined — calculatePriorityScore
    // already falls back to a neutral 0.5 default for any missing factor
    // (the same pattern used for pre-Phase-11 legacy data).
    const { priorityScore, priorityBreakdown } = calculatePriorityScore({
      severity,
      duplicateCount: 0,
      categoryWeight: categoryExists.priorityWeight,
      locationImportance: wardExists ? wardExists.importanceWeight : undefined,
      createdAt: new Date(),
    });

    const complaint = await Complaint.create({
      reporter: req.user._id,
      title,
      description,
      category,
      severity,
      locationType,
      city: locationType === "urban" ? city.trim() : null,
      ward: locationType === "urban" && wardExists ? wardExists._id : null,
      wardName: locationType === "urban" ? resolvedWardName : null,
      district: locationType === "rural" ? district : null,
      tehsil: locationType === "rural" ? tehsil : null,
      block: locationType === "rural" ? block || null : null,
      village: locationType === "rural" ? village : null,
      images,
      location: { type: "Point", coordinates: [lng, lat] },
      address,
      priorityScore,
      priorityBreakdown,
    });
    await ComplaintUpdate.create({
      complaint: complaint._id,
      status: "submitted",
      note: "Complaint submitted",
      updatedBy: req.user._id,
    });
        let responseComplaint = complaint;
    const matches = await findPossibleDuplicates({
      complaintId: complaint._id,
      title,
      description,
      category,
      location: complaint.location,
      createdAt: complaint.createdAt,
    });

    if (matches.length > 0) {
      responseComplaint = await Complaint.findByIdAndUpdate(
        complaint._id,
        { possibleDuplicates: matches, duplicateReviewStatus: "pending" },
        { new: true, runValidators: true }
      ).populate("possibleDuplicates.complaint", "title status createdAt");
    }
        return res.status(201).json({
      success: true,
      data: responseComplaint,
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
      .populate("department", "name")
      .populate("ward", "name")
      .populate("district", "name")
      .populate("tehsil", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }
        const isOwner = complaint.reporter.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isAssignedDept =
    req.user.role === "department_user" &&
    complaint.department &&
    req.user.department &&
    complaint.department._id.toString() === req.user.department.toString();

  if (!isOwner && !isAdmin && !isAssignedDept) {
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
const ALLOWED_SORT_FIELDS = ["createdAt", "status", "title", "priorityScore"];

export const getAllComplaints = async (req, res) => {
  try {
    const {
      status,
      category,
      department,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    const safeStatus = asString(status);
    const safeCategory = asString(category);
    const safeDepartment = asString(department);
    const safeSearch = asString(search);
    if (safeStatus) filter.status = safeStatus;
    if (safeCategory) filter.category = safeCategory;
    if (safeDepartment) filter.department = safeDepartment;
    if (safeSearch) {
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("category", "name")
        .populate("department", "name")
        .populate("reporter", "name email")
        .populate("ward", "name")
        .populate("district", "name")
        .populate("tehsil", "name")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: complaints,
      message: "Complaints fetched",
      meta: { page: pageNum, limit: limitNum, total },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const assignDepartment = async (req, res) => {
  try {
    const { department } = req.body;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "department is required",
      });
    }

    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { department, status: "assigned" },
      { new: true, runValidators: true }
    )
      .populate("category", "name")
      .populate("department", "name")
      .populate("reporter", "name email");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    await ComplaintUpdate.create({
      complaint: complaint._id,
      status: "assigned",
      note: `Assigned to ${departmentExists.name}`,
      updatedBy: req.user._id,
    });

    await notifyUser({
      user: complaint.reporter._id,
      complaint: complaint._id,
      type: "assignment",
      message: `Your complaint "${complaint.title}" has been assigned to ${departmentExists.name}.`,
    });

    await notifyDepartment({
      department: departmentExists._id,
      complaint: complaint._id,
      type: "assignment",
      message: `New complaint assigned to your department: "${complaint.title}".`,
    });

    return res.status(200).json({
      success: true,
      data: complaint,
      message: "Complaint assigned",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const getAssignedComplaints = async (req, res) => {
  try {
    if (!req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a department",
      });
    }

    const {
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { department: req.user.department };
    const safeStatus = asString(status);
    const safeSearch = asString(search);
    if (safeStatus) filter.status = safeStatus;
    if (safeSearch) {
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("category", "name")
        .populate("reporter", "name")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: complaints,
      message: "Assigned complaints fetched",
      meta: { page: pageNum, limit: limitNum, total },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const allowedStatuses = ["in_progress", "resolved", "rejected"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (
      req.user.role === "department_user" &&
      (!complaint.department ||
        !req.user.department ||
        complaint.department.toString() !== req.user.department.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "This complaint is not assigned to your department",
      });
    }

    const evidenceUrls = (req.files || []).map((f) => f.path);

    const update = { $set: { status } };
    if (evidenceUrls.length > 0) {
      update.$push = { evidenceImages: { $each: evidenceUrls } };
    }

    const updated = await Complaint.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("department", "name")
      .populate("reporter", "name email");

    await ComplaintUpdate.create({
      complaint: updated._id,
      status,
      note: note || "",
      updatedBy: req.user._id,
    });

    await notifyUser({
      user: updated.reporter._id,
      complaint: updated._id,
      type: "status_update",
      message: `Your complaint "${updated.title}" status was updated to "${status.replace("_", " ")}".`,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Complaint status updated",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const recalculatePriority = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("category", "priorityWeight")
      .populate("ward", "importanceWeight");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const { priorityScore, priorityBreakdown } = calculatePriorityScore({
      severity: complaint.severity,
      duplicateCount: complaint.duplicateCount,
      categoryWeight: complaint.category?.priorityWeight,
      locationImportance: complaint.ward?.importanceWeight,
      createdAt: complaint.createdAt,
    });

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { priorityScore, priorityBreakdown },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Priority recalculated",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const recalculateAllPriorities = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: { $nin: ["resolved", "rejected"] },
    })
      .populate("category", "priorityWeight")
      .populate("ward", "importanceWeight");

    const bulkOps = complaints.map((complaint) => {
      const { priorityScore, priorityBreakdown } = calculatePriorityScore({
        severity: complaint.severity,
        duplicateCount: complaint.duplicateCount,
        categoryWeight: complaint.category?.priorityWeight,
        locationImportance: complaint.ward?.importanceWeight,
        createdAt: complaint.createdAt,
      });
      return {
        updateOne: {
          filter: { _id: complaint._id },
          update: { $set: { priorityScore, priorityBreakdown } },
        },
      };
    });

    if (bulkOps.length > 0) {
      await Complaint.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      success: true,
      message: `Recalculated priority for ${bulkOps.length} complaint(s)`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const getDuplicateReviewQueue = async (req, res) => {
  try {
    const complaints = await Complaint.find({ duplicateReviewStatus: "pending" })
      .populate("category", "name")
      .populate("reporter", "name email")
      .populate("possibleDuplicates.complaint", "title description status createdAt reporter")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: complaints,
      message: "Duplicate review queue fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const reviewDuplicate = async (req, res) => {
  try {
    const { action, originalComplaintId } = req.body;
    if (!["confirm", "dismiss"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'confirm' or 'dismiss'",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    if (complaint.duplicateReviewStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This complaint is not pending duplicate review",
      });
    }

    if (action === "dismiss") {
      const updated = await Complaint.findByIdAndUpdate(
        req.params.id,
        { duplicateReviewStatus: "dismissed" },
        { new: true, runValidators: true }
      );
      await ComplaintUpdate.create({
        complaint: updated._id,
        status: updated.status,
        note: "Duplicate flag dismissed by admin",
        updatedBy: req.user._id,
      });
      return res.status(200).json({ success: true, data: updated, message: "Duplicate dismissed" });
    }

    // action === "confirm"
    const isValidMatch = complaint.possibleDuplicates.some(
      (m) => m.complaint.toString() === originalComplaintId
    );
    if (!originalComplaintId || !isValidMatch) {
      return res.status(400).json({
        success: false,
        message: "originalComplaintId must be one of the detected matches",
      });
    }

    const original = await Complaint.findById(originalComplaintId)
      .populate("category", "priorityWeight")
      .populate("ward", "importanceWeight");
    if (!original) {
      return res.status(404).json({ success: false, message: "Original complaint not found" });
    }

    const newDuplicateCount = (original.duplicateCount || 0) + 1;
    const { priorityScore, priorityBreakdown } = calculatePriorityScore({
      severity: original.severity,
      duplicateCount: newDuplicateCount,
      categoryWeight: original.category?.priorityWeight,
      locationImportance: original.ward?.importanceWeight,
      createdAt: original.createdAt,
    });

    await Complaint.findByIdAndUpdate(originalComplaintId, {
      duplicateCount: newDuplicateCount,
      priorityScore,
      priorityBreakdown,
    });

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { duplicateOf: originalComplaintId, duplicateReviewStatus: "confirmed" },
      { new: true, runValidators: true }
    );

    await ComplaintUpdate.create({
      complaint: originalComplaintId,
      status: original.status,
      note: `Duplicate confirmed: complaint ${updated._id} merged into this one`,
      updatedBy: req.user._id,
    });
    await ComplaintUpdate.create({
      complaint: updated._id,
      status: updated.status,
      note: `Marked as duplicate of complaint ${originalComplaintId}`,
      updatedBy: req.user._id,
    });

    return res.status(200).json({ success: true, data: updated, message: "Duplicate confirmed and merged" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};
export const verifyComplaintResolution = async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!["confirm", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'confirm' or 'reject'",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the citizen who filed this complaint can verify its resolution",
      });
    }

    if (complaint.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "This complaint is not currently marked resolved, so it can't be verified",
      });
    }

    if (action === "reject" && !note?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please explain why you're reopening this complaint",
      });
    }

    const newStatus = action === "confirm" ? "closed" : "in_progress";

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true, runValidators: true }
    )
      .populate("category", "name")
      .populate("department", "name");

    await ComplaintUpdate.create({
      complaint: updated._id,
      status: newStatus,
      note:
        action === "confirm"
          ? note?.trim()
            ? `Citizen confirmed the resolution: ${note.trim()}`
            : "Citizen confirmed the resolution"
          : `Citizen reopened the complaint: ${note.trim()}`,
      updatedBy: req.user._id,
    });

    if (updated.department) {
      await notifyDepartment({
        department: updated.department._id,
        complaint: updated._id,
        type: action === "confirm" ? "verification_confirmed" : "verification_rejected",
        message:
          action === "confirm"
            ? `Citizen confirmed the fix for "${updated.title}" — marked closed.`
            : `Citizen reopened "${updated.title}": ${note.trim()}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: action === "confirm" ? "Resolution confirmed, complaint closed" : "Complaint reopened",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};