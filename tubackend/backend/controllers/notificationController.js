const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  // Build query
  const query = { user: req.user.id };
  
  // Filter by read status if provided
  if (req.query.read === 'true' || req.query.read === 'false') {
    query.read = req.query.read === 'true';
  }

  // Filter by type if provided
  if (req.query.type) {
    query.type = req.query.type;
  }

  // Execute query
  const notifications = await Notification.find(query)
    .populate('triggeredBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to 100 most recent notifications

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Not authorized to update this notification', 401)
    );
  }

  // Mark as read
  notification.read = true;
  await notification.save();

  // Emit real-time update
  const io = req.app.get('io');
  io.to(req.user.id).emit('notification:read', { notificationId: notification._id });

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { $set: { read: true } }
  );

  // Emit real-time update
  const io = req.app.get('io');
  io.to(req.user.id).emit('notifications:allRead');

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Not authorized to delete this notification', 401)
    );
  }

  await notification.remove();

  // Emit real-time update
  const io = req.app.get('io');
  io.to(req.user.id).emit('notification:deleted', { notificationId: notification._id });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ user: req.user.id });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(req.user.id).emit('notifications:cleared');

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false,
  });

  res.status(200).json({
    success: true,
    count,
  });
});
