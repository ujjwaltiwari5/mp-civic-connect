import { z } from "zod";
import Department from "../models/Department.js";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
});

const updateDepartmentSchema = departmentSchema.partial();

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const parsed = departmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }

    const existing = await Department.findOne({ name: parsed.data.name });
    if (existing) {
      return res.status(409).json({ success: false, message: "A department with this name already exists" });
    }

    const department = await Department.create(parsed.data);
    res.status(201).json({ success: true, message: "Department created successfully", data: department });
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const department = await Department.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department updated successfully", data: department });
  } catch (err) {
    next(err);
  }
};