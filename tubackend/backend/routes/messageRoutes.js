const express = require('express');
const router = express.Router();
const {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  likeMessage,
  unlikeMessage,
  getMessageReplies,
  createMessageReply,
  searchMessages,
} = require('../controllers/messageController');

const { protect, checkProjectMembership } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(protect);

// Routes for project messages
router
  .route('/')
  .get(checkProjectMembership, getMessages)
  .post(checkProjectMembership, createMessage);

// Message search
router.get('/search', searchMessages);

// Routes for a specific message
router
  .route('/:id')
  .get(checkProjectMembership, getMessage)
  .put(checkProjectMembership, updateMessage)
  .delete(checkProjectMembership, deleteMessage);

// Message reactions
router.post('/:id/like', checkProjectMembership, likeMessage);
router.post('/:id/unlike', checkProjectMembership, unlikeMessage);

// Message replies
router
  .route('/:id/replies')
  .get(checkProjectMembership, getMessageReplies)
  .post(checkProjectMembership, createMessageReply);

module.exports = router;
