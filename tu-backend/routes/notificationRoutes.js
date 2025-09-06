const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.get('/unread-count', getUnreadCount);

router
  .route('/:id')
  .put(markAsRead)
  .delete(deleteNotification);

router.put('/mark-all-read', markAllAsRead);

module.exports = router;
