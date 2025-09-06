const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all tasks for a project
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Check if projectId is provided in query
  if (!req.query.projectId) {
    return next(new ErrorResponse('Please provide a project ID', 400));
  }

  // Check if user has access to the project
  const project = await Project.findById(req.query.projectId);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to access tasks for this project', 401)
    );
  }

  // Build query
  const query = { project: req.query.projectId };

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by assignee if provided
  if (req.query.assignedTo) {
    query.assignedTo = req.query.assignedTo;
  }

  // Execute query
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'name email avatar',
      },
      options: { sort: { createdAt: -1 } },
    });

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // Check if project exists and user has access
  const project = await Project.findById(req.body.project);
  if (!project || !project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to create tasks for this project', 401)
    );
  }

  // Create task
  const task = await Task.create(req.body);

  // Populate the created task
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

  // Create notifications for assigned users
  if (req.body.assignedTo && req.body.assignedTo.length > 0) {
    await Promise.all(
      req.body.assignedTo.map(async (userId) => {
        await Notification.create({
          user: userId,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to a new task: ${task.title}`,
          link: `/tasks/${task._id}`,
          relatedDocument: {
            kind: 'Task',
            item: task._id,
          },
          triggeredBy: req.user.id,
        });

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(userId).emit('notification:new');
      })
    );
  }

  // Emit real-time update for project
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:created', { task: populatedTask });

  res.status(201).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has permission to update the task
  const project = await Project.findById(task.project);
  if (!project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to update this task', 401)
    );
  }

  // Check for status change to trigger notifications
  const statusChanged = req.body.status && req.body.status !== task.status;
  const oldAssignedTo = [...task.assignedTo.map(id => id.toString())];
  
  // Update task
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

  // Handle status change notifications
  if (statusChanged) {
    await handleStatusChange(task, req.user.id, req.app.get('io'));
  }

  // Handle new assignees
  if (req.body.assignedTo) {
    const newAssignments = req.body.assignedTo.filter(
      id => !oldAssignedTo.includes(id.toString())
    );

    await handleNewAssignments(task, newAssignments, req.user.id, req.app.get('io'));
  }

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:updated', { task });

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has permission to delete the task
  const project = await Project.findById(task.project);
  if (!project.isAdmin(req.user.id) && task.createdBy.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Not authorized to delete this task', 401)
    );
  }

  await task.remove();

  // Emit real-time update
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:deleted', { taskId: task._id });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Assign task to user
// @route   POST /api/tasks/:id/assign
// @access  Private
exports.assignTask = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('Please provide a user ID', 400));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is already assigned
  if (task.assignedTo.includes(userId)) {
    return next(new ErrorResponse('User is already assigned to this task', 400));
  }

  // Check if user is a member of the project
  const project = await Project.findById(task.project);
  if (!project.isMember(userId)) {
    return next(
      new ErrorResponse('User is not a member of this project', 400)
    );
  }

  // Add user to assignedTo array
  task.assignedTo.push(userId);
  await task.save();

  // Populate the updated task
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

  // Create notification
  await Notification.create({
    user: userId,
    type: 'task_assigned',
    title: 'Task Assigned',
    message: `You have been assigned to the task: ${task.title}`,
    link: `/tasks/${task._id}`,
    relatedDocument: {
      kind: 'Task',
      item: task._id,
    },
    triggeredBy: req.user.id,
  });

  // Emit real-time updates
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:updated', { task: populatedTask });
  io.to(userId).emit('notification:new');

  res.status(200).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Unassign task from user
// @route   POST /api/tasks/:id/unassign
// @access  Private
exports.unassignTask = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('Please provide a user ID', 400));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is assigned to the task
  if (!task.assignedTo.includes(userId)) {
    return next(new ErrorResponse('User is not assigned to this task', 400));
  }

  // Remove user from assignedTo array
  task.assignedTo = task.assignedTo.filter(
    (id) => id.toString() !== userId.toString()
  );
  await task.save();

  // Populate the updated task
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

  // Create notification
  await Notification.create({
    user: userId,
    type: 'task_unassigned',
    title: 'Task Unassigned',
    message: `You have been unassigned from the task: ${task.title}`,
    link: `/projects/${task.project}`,
    relatedDocument: {
      kind: 'Task',
      item: task._id,
    },
    triggeredBy: req.user.id,
  });

  // Emit real-time updates
  const io = req.app.get('io');
  const project = await Project.findById(task.project);
  io.to(project._id.toString()).emit('task:updated', { task: populatedTask });
  io.to(userId).emit('notification:new');

  res.status(200).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Update status
  task.status = status;
  
  // If marking as done, set completedAt
  if (status === 'Done' && !task.completedAt) {
    task.completedAt = Date.now();
    task.completedBy = req.user.id;
  } else if (status !== 'Done') {
    task.completedAt = undefined;
    task.completedBy = undefined;
  }

  await task.save();

  // Populate the updated task
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

  // Handle status change notifications
  await handleStatusChange(populatedTask, req.user.id, req.app.get('io'));

  // Emit real-time update
  const project = await Project.findById(task.project);
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:updated', { task: populatedTask });

  res.status(200).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addTaskComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next(new ErrorResponse('Please provide comment content', 400));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Create comment
  const comment = {
    user: req.user.id,
    content,
  };

  task.comments.unshift(comment);
  await task.save();

  // Populate the updated task
  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'name email avatar',
      },
      options: { sort: { createdAt: -1 } },
    });

  // Create notifications for mentioned users and task assignees
  await handleTaskMentions(
    content,
    task,
    req.user.id,
    'comment_mention',
    `You were mentioned in a comment on task: ${task.title}`,
    req.app.get('io')
  );

  // Emit real-time update
  const project = await Project.findById(task.project);
  const io = req.app.get('io');
  io.to(project._id.toString()).emit('task:comment:added', { 
    taskId: task._id, 
    comment: populatedTask.comments[0] 
  });

  res.status(201).json({
    success: true,
    data: populatedTask.comments[0],
  });
});

// @desc    Get task comments
// @route   GET /api/tasks/:id/comments
// @access  Private
exports.getTaskComments = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate({
    path: 'comments',
    populate: {
      path: 'user',
      select: 'name email avatar',
    },
    options: { sort: { createdAt: -1 } },
  });

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    count: task.comments.length,
    data: task.comments,
  });
});

// @desc    Search tasks
// @route   GET /api/tasks/search
// @access  Private
exports.searchTasks = asyncHandler(async (req, res, next) => {
  const { q, projectId } = req.query;

  if (!q) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Check if user has access to the project
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project || !project.isMember(req.user.id)) {
      return next(
        new ErrorResponse('Not authorized to access this project', 401)
      );
    }
  }

  // Build query
  const query = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  };

  // Add project filter if provided
  if (projectId) {
    query.project = projectId;
  } else {
    // If no project ID, only show tasks from projects the user is a member of
    const projects = await Project.find({ 'members.user': req.user.id });
    query.project = { $in: projects.map(p => p._id) };
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

// Helper function to handle status change notifications
const handleStatusChange = async (task, userId, io) => {
  const statusMessages = {
    'To-Do': 'moved to To-Do',
    'In Progress': 'started working on',
    'In Review': 'marked for review',
    'Done': 'completed',
  };

  const message = statusMessages[task.status] || `updated status to ${task.status}`;
  const notificationMessage = `Task "${task.title}" has been ${message}`;

  // Notify all assignees and the task creator
  const recipients = new Set([
    ...task.assignedTo.map(id => id.toString()),
    task.createdBy.toString(),
  ]);

  // Remove the user who made the change
  recipients.delete(userId.toString());

  // Create notifications
  await Promise.all(
    Array.from(recipients).map(async (recipientId) => {
      await Notification.create({
        user: recipientId,
        type: 'status_change',
        title: 'Task Status Updated',
        message: notificationMessage,
        link: `/tasks/${task._id}`,
        relatedDocument: {
          kind: 'Task',
          item: task._id,
        },
        triggeredBy: userId,
      });

      // Emit real-time notification
      io.to(recipientId).emit('notification:new');
    })
  );
};

// Helper function to handle new task assignments
const handleNewAssignments = async (task, newAssignments, userId, io) => {
  await Promise.all(
    newAssignments.map(async (assigneeId) => {
      await Notification.create({
        user: assigneeId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to the task: ${task.title}`,
        link: `/tasks/${task._id}`,
        relatedDocument: {
          kind: 'Task',
          item: task._id,
        },
        triggeredBy: userId,
      });

      // Emit real-time notification
      io.to(assigneeId).emit('notification:new');
    })
  );
};

// Helper function to handle mentions in task comments/descriptions
const handleTaskMentions = async (content, task, userId, type, title, io) => {
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
      // Skip if the mentioned user is the one who created the comment
      if (user._id.toString() === userId.toString()) return;

      await Notification.create({
        user: user._id,
        type,
        title,
        message: content,
        link: `/tasks/${task._id}`,
        relatedDocument: {
          kind: 'Task',
          item: task._id,
        },
        triggeredBy: userId,
      });

      // Emit real-time notification
      io.to(user._id.toString()).emit('notification:new');
    })
  );
};
