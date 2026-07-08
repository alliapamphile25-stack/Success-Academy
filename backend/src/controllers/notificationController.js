const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/notifications/me
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ message: 'Notification marquée comme lue' });
});

// @route PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
