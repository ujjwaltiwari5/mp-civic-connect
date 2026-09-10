import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("complaint", "title status");

    return res.status(200).json({
      success: true,
      data: notifications,
      message: "Notifications fetched",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Notification marked as read",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};