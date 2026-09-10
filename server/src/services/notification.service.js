import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Same non-blocking philosophy as reverseGeocode (Phase 6): a notification
// failing to save should never break the actual complaint action it's attached to.
export const notifyUser = async ({ user, complaint, type, message }) => {
  try {
    await Notification.create({ user, complaint, type, message });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

export const notifyDepartment = async ({ department, complaint, type, message }) => {
  try {
    const staff = await User.find({ role: "department_user", department }).select("_id");
    if (staff.length === 0) return;
    await Notification.insertMany(
      staff.map((u) => ({ user: u._id, complaint, type, message }))
    );
  } catch (err) {
    console.error("Failed to notify department:", err.message);
  }
};