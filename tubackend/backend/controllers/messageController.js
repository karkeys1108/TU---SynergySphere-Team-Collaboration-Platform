const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all messages for a project
// @route   GET /api/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  // Check if projectId is provided in query
  if (!req.query.projectId) {
    return next(new ErrorResponse('Please provide a project ID', 400));
  }

  // Check if user has access to the project
  const project = await Project.findById(req.query.projectId);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to access messages for this project', 401)
    );
  }

  // Build query
  const query = { 
    project: req.query.projectId,
    parentMessage: { $exists: false } // Only get top-level messages
  };

  // Execute query
  const messages = await Message.find(query)
    .populate('user', 'name email avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'name email avatar',
      },
      options: { sort: { createdAt: 1 } },
      perDocumentLimit: 3, // Only get 3 most recent replies
    })
    .populate('likes', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
exports.getMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id)
    .populate('user', 'name email avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'name email avatar',
      },
      options: { sort: { createdAt: 1 } },
    })
    .populate('likes', 'name email');

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const project = await Project.findById(message.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to access this message', 401)
    );
  }

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
exports.createMessage = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if project exists and user has access
  const project = await Project.findById(req.body.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to post messages in this project', 401)
    );
  }

  // Create message
  const message = await Message.create(req.body);

  // Populate the created message
  const populatedMessage = await Message.findById(message._id)
    .populate('user', 'name email avatar');

  // Handle mentions and notify mentioned users
  if (req.body.content) {
    await handleMentions(
      req.body.content,
      populatedMessage,
      req.user.id,
      'message_mention',
      `You were mentioned in a message in ${project.name}`,
      req.app.get('io')
    );
  }

  // Emit real-time update for project
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:created', { 
    message: populatedMessage,
    isReply: !!req.body.parentMessage
  });

  res.status(201).json({
    success: true,
    data: populatedMessage,
  });
});

// @desc    Update message
// @route   PUT /api/messages/:id
// @access  Private
exports.updateMessage = asyncHandler(async (req, res, next) => {
  let message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the message owner or project admin
  const project = await Project.findById(message.project);
  const isAdmin = project.isAdmin(req.user.id);
  
  if (message.user.toString() !== req.user.id && !isAdmin) {
    return next(
      new ErrorResponse('Not authorized to update this message', 401)
    );
  }

  // Only allow updating content and isPinned (if admin)
  const updateFields = {
    content: req.body.content,
    updatedAt: Date.now(),
  };

  // Only admins can pin/unpin messages
  if (typeof req.body.isPinned === 'boolean' && isAdmin) {
    updateFields.isPinned = req.body.isPinned;
  }

  // Update message
  message = await Message.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true,
  })
    .populate('user', 'name email avatar')
    .populate('likes', 'name email');

  // Handle new mentions if content was updated
  if (req.body.content) {
    await handleMentions(
      req.body.content,
      message,
      req.user.id,
      'message_mention',
      `You were mentioned in a message in ${project.name}`,
      req.app.get('io')
    );
  }

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:updated', { 
    message,
    isReply: !!message.parentMessage
  });

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the message owner or project admin
  const project = await Project.findById(message.project);
  const isAdmin = project.isAdmin(req.user.id);
  
  if (message.user.toString() !== req.user.id && !isAdmin) {
    return next(
      new ErrorResponse('Not authorized to delete this message', 401)
    );
  }

  // Store message data for real-time update before deletion
  const messageData = {
    _id: message._id,
    project: message.project,
    parentMessage: message.parentMessage,
  };

  // Delete the message
  await message.remove();

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:deleted', { 
    messageId: messageData._id,
    isReply: !!messageData.parentMessage
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Like a message
// @route   POST /api/messages/:id/like
// @access  Private
exports.likeMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const project = await Project.findById(message.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to like this message', 401)
    );
  }

  // Check if the message has already been liked
  if (message.likes.includes(req.user.id)) {
    return next(new ErrorResponse('Message already liked', 400));
  }

  // Add like
  message.likes.push(req.user.id);
  await message.save();

  // Populate the updated message
  const populatedMessage = await Message.findById(message._id)
    .populate('user', 'name email avatar')
    .populate('likes', 'name email');

  // Create notification for message owner (if not the same user)
  if (message.user.toString() !== req.user.id) {
    await Notification.create({
      user: message.user,
      type: 'message_like',
      title: 'Message Liked',
      message: `${req.user.name} liked your message`,
      link: `/projects/${message.project}?messageId=${message._id}`,
      relatedDocument: {
        kind: 'Message',
        item: message._id,
      },
      triggeredBy: req.user.id,
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(message.user.toString()).emit('notification:new');
  }

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:updated', { 
    message: populatedMessage,
    isReply: !!message.parentMessage
  });

  res.status(200).json({
    success: true,
    data: populatedMessage,
  });
});

// @desc    Unlike a message
// @route   POST /api/messages/:id/unlike
// @access  Private
exports.unlikeMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const project = await Project.findById(message.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to unlike this message', 401)
    );
  }

  // Get remove index
  const removeIndex = message.likes.indexOf(req.user.id);

  if (removeIndex === -1) {
    return next(new ErrorResponse('Message not liked yet', 400));
  }

  // Remove like
  message.likes.splice(removeIndex, 1);
  await message.save();

  // Populate the updated message
  const populatedMessage = await Message.findById(message._id)
    .populate('user', 'name email avatar')
    .populate('likes', 'name email');

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:updated', { 
    message: populatedMessage,
    isReply: !!message.parentMessage
  });

  res.status(200).json({
    success: true,
    data: populatedMessage,
  });
});

// @desc    Get message replies
// @route   GET /api/messages/:id/replies
// @access  Private
exports.getMessageReplies = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const project = await Project.findById(message.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to access these replies', 401)
    );
  }

  // Get replies
  const replies = await Message.find({ parentMessage: message._id })
    .populate('user', 'name email avatar')
    .populate('likes', 'name email')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: replies.length,
    data: replies,
  });
});

// @desc    Create message reply
// @route   POST /api/messages/:id/replies
// @access  Private
exports.createMessageReply = asyncHandler(async (req, res, next) => {
  // Add user and parent message to req.body
  req.body.user = req.user.id;
  req.body.parentMessage = req.params.id;

  // Get parent message to get project ID
  const parentMessage = await Message.findById(req.params.id);
  if (!parentMessage) {
    return next(
      new ErrorResponse(`Parent message not found with id of ${req.params.id}`, 404)
    );
  }

  // Set project from parent message
  req.body.project = parentMessage.project;

  // Check if user has access to the project
  const project = await Project.findById(parentMessage.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to reply to this message', 401)
    );
  }

  // Create reply
  const reply = await Message.create(req.body);

  // Populate the created reply
  const populatedReply = await Message.findById(reply._id)
    .populate('user', 'name email avatar');

  // Handle mentions and notify mentioned users
  if (req.body.content) {
    await handleMentions(
      req.body.content,
      populatedReply,
      req.user.id,
      'message_mention',
      `You were mentioned in a reply in ${project.name}`,
      req.app.get('io')
    );
  }

  // Notify the parent message author (if different from reply author)
  if (parentMessage.user.toString() !== req.user.id) {
    await Notification.create({
      user: parentMessage.user,
      type: 'message_reply',
      title: 'New Reply to Your Message',
      message: `${req.user.name} replied to your message`,
      link: `/projects/${project._id}?messageId=${parentMessage._id}`,
      relatedDocument: {
        kind: 'Message',
        item: parentMessage._id,
      },
      triggeredBy: req.user.id,
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(parentMessage.user.toString()).emit('notification:new');
  }

  // Emit real-time update for project
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('message:reply:added', { 
    parentMessageId: parentMessage._id,
    reply: populatedReply
  });

  res.status(201).json({
    success: true,
    data: populatedReply,
  });
});

// @desc    Search messages in a project
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = asyncHandler(async (req, res, next) => {
  const { q, projectId } = req.query;

  if (!q) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  if (!projectId) {
    return next(new ErrorResponse('Please provide a project ID', 400));
  }

  // Check if user has access to the project
  const project = await Project.findById(projectId);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to search messages in this project', 401)
    );
  }

  // Build search query
  const searchQuery = {
    project: projectId,
    $text: { $search: q },
  };

  // Execute search
  const messages = await Message.find(searchQuery)
    .populate('user', 'name email avatar')
    .sort({ score: { $meta: 'textScore' } });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

// Helper function to handle user mentions in message content
const handleMentions = async (content, message, userId, type, title, io) => {
  // Find user mentions in the content (format: @username)
  const mentionRegex = /@(\w+)/g;
  let match;
  const mentionedUsernames = [];

  while ((match = mentionRegex.exec(content)) !== null) {
    mentionedUsernames.push(match[1]);
  }

  if (mentionedUsernames.length === 0) return;

  // Find mentioned users
  const mentionedUsers = await User.find({
    username: { $in: mentionedUsernames },
  });

  // Create notifications for mentioned users
  await Promise.all(
    mentionedUsers.map(async (user) => {
      // Skip if the mentioned user is the one who created the message
      if (user._id.toString() === userId.toString()) return;

      await Notification.create({
        user: user._id,
        type,
        title,
        message: content,
        link: `/projects/${message.project}?messageId=${message._id}`,
        relatedDocument: {
          kind: 'Message',
          item: message._id,
        },
        triggeredBy: userId,
      });

      // Emit real-time notification
      io.to(user._id.toString()).emit('notification:new');
    })
  );
};
