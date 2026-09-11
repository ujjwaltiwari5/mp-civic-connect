import mongoose from "mongoose";
import User from "../models/User.js";
import Department from "../models/Department.js";

const ROLES = ["citizen", "department_user", "admin"];

export const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role && ROLES.includes(role)) {
      filter.role = role;
    }
    if (search) {
      const safe = String(search).trim();
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: { page: pageNum, limit: limitNum, total },
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot change your own role" });
    }

    const update = { role };

    if (role === "department_user") {
      if (!department || !mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ success: false, message: "A valid department is required for department staff" });
      }
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }
      update.department = department;
    } else {
      update.department = undefined;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: update, ...(update.department === undefined ? { $unset: { department: "" } } : {}) },
      { new: true, runValidators: true }
    ).populate("department", "name");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};