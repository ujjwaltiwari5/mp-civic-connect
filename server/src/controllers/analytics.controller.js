import Complaint from "../models/Complaint.js";
import ComplaintUpdate from "../models/ComplaintUpdate.js";

const STATUS_LIST = ["submitted", "assigned", "in_progress", "resolved", "rejected", "closed"];

const buildScopeFilter = (req) => {
  if (req.user.role === "department_user") {
    return { department: req.user.department };
  }
  return {};
};

const getAvgResolutionHours = async (scope) => {
  const rows = await ComplaintUpdate.aggregate([
    { $match: { status: "resolved" } },
    { $sort: { createdAt: 1 } },
    { $group: { _id: "$complaint", firstResolvedAt: { $first: "$createdAt" } } },
    {
      $lookup: {
        from: "complaints",
        localField: "_id",
        foreignField: "_id",
        as: "complaint",
      },
    },
    { $unwind: "$complaint" },
    ...(scope.department ? [{ $match: { "complaint.department": scope.department } }] : []),
    {
      $group: {
        _id: null,
        avgResolutionHours: {
          $avg: {
            $divide: [{ $subtract: ["$firstResolvedAt", "$complaint.createdAt"] }, 1000 * 60 * 60],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  return rows[0] || { avgResolutionHours: null, count: 0 };
};

export const getOverview = async (req, res) => {
  try {
    if (req.user.role === "department_user" && !req.user.department) {
      return res.status(403).json({ success: false, message: "Your account is not linked to a department" });
    }
    const scope = buildScopeFilter(req);

    const [total, statusCounts, resolution] = await Promise.all([
      Complaint.countDocuments(scope),
      Complaint.aggregate([{ $match: scope }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      getAvgResolutionHours(scope),
    ]);

    const byStatus = {};
    STATUS_LIST.forEach((s) => (byStatus[s] = 0));
    statusCounts.forEach((row) => {
      byStatus[row._id] = row.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalComplaints: total,
        byStatus,
        avgResolutionHours: resolution.avgResolutionHours,
        resolvedCount: resolution.count,
      },
      message: "Analytics overview fetched",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};

export const getByCategory = async (req, res) => {
  try {
    if (req.user.role === "department_user" && !req.user.department) {
      return res.status(403).json({ success: false, message: "Your account is not linked to a department" });
    }
    const scope = buildScopeFilter(req);

    const rows = await Complaint.aggregate([
      { $match: scope },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $project: { _id: 0, categoryId: "$category._id", name: "$category.name", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({ success: true, data: rows, message: "By-category analytics fetched" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};

export const getByDepartment = async (req, res) => {
  try {
    const rows = await Complaint.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "department" } },
      { $unwind: "$department" },
      { $project: { _id: 0, departmentId: "$department._id", name: "$department.name", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({ success: true, data: rows, message: "By-department analytics fetched" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};

export const getResolutionTime = async (req, res) => {
  try {
    if (req.user.role === "department_user" && !req.user.department) {
      return res.status(403).json({ success: false, message: "Your account is not linked to a department" });
    }
    const scope = buildScopeFilter(req);
    const overall = await getAvgResolutionHours(scope);

    const byCategory = await ComplaintUpdate.aggregate([
      { $match: { status: "resolved" } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: "$complaint", firstResolvedAt: { $first: "$createdAt" } } },
      { $lookup: { from: "complaints", localField: "_id", foreignField: "_id", as: "complaint" } },
      { $unwind: "$complaint" },
      ...(scope.department ? [{ $match: { "complaint.department": scope.department } }] : []),
      {
        $project: {
          category: "$complaint.category",
          resolutionHours: {
            $divide: [{ $subtract: ["$firstResolvedAt", "$complaint.createdAt"] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          avgResolutionHours: { $avg: "$resolutionHours" },
          count: { $sum: 1 },
        },
      },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          categoryId: "$category._id",
          name: "$category.name",
          avgResolutionHours: { $round: ["$avgResolutionHours", 1] },
          count: 1,
        },
      },
      { $sort: { avgResolutionHours: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: { overallAvgResolutionHours: overall.avgResolutionHours, byCategory },
      message: "Resolution-time analytics fetched",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};