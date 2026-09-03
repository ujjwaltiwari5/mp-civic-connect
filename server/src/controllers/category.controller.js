import { z } from "zod";
import Category from "../models/Category.js";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  priorityWeight: z.number().min(0).max(1).optional(),
});

const updateCategorySchema = categorySchema.partial();

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }

    const existing = await Category.findOne({ name: parsed.data.name });
    if (existing) {
      return res.status(409).json({ success: false, message: "A category with this name already exists" });
    }

    const category = await Category.create(parsed.data);
    res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category updated successfully", data: category });
  } catch (err) {
    next(err);
  }
};