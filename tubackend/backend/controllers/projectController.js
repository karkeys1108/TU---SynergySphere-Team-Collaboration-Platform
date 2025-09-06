const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all projects for the authenticated user
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
  const projects = await Project.find({ 'members.user': req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'members.user',
      select: 'name email avatar',
    });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate({
      path: 'members.user',
      select: 'name email avatar',
    })
    .populate({
      path: 'createdBy',
      select: 'name email',
    });

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.to(req.params.id).emit('project:updated', { project });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // Add current user as admin member
  req.body.members = [
    {
      user: req.user.id,
      role: 'admin',
    },
  ];

  const project = await Project.create(req.body);

  // Populate the created document
  const populatedProject = await Project.findById(project._id)
    .populate({
      path: 'members.user',
      select: 'name email avatar',
    })
    .populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    data: populatedProject,
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is project admin
  if (!project.isAdmin(req.user.id)) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this project`,
        401
      )
    );
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({
      path: 'members.user',
      select: 'name email avatar',
    })
    .populate('createdBy', 'name email');

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.to(req.params.id).emit('project:updated', { project });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is project admin
  if (!project.isAdmin(req.user.id)) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this project`,
        401
      )
    );
  }

  await project.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Add project member
// @route   POST /api/projects/:projectId/members/:userId
// @access  Private
exports.addProjectMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  const user = await User.findById(req.params.userId);

  if (!project || !user) {
    return next(new ErrorResponse('Project or user not found', 404));
  }

  // Check if user is already a member
  const isMember = project.members.some(
    (member) => member.user.toString() === req.params.userId
  );

  if (isMember) {
    return next(
      new ErrorResponse(
        `User ${user.name} is already a member of this project`,
        400
      )
    );
  }

  // Add user as a member
  project.members.push({
    user: req.params.userId,
    role: 'member',
  });

  await project.save();

  // Create notification
  await Notification.create({
    user: req.params.userId,
    type: 'project_invite',
    title: 'You have been added to a project',
    message: `You have been added to the project: ${project.name}`,
    link: `/projects/${project._id}`,
    relatedDocument: {
      kind: 'Project',
      item: project._id,
    },
    triggeredBy: req.user.id,
  });

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.to(req.params.userId).emit('notification:new');
  io.to(req.params.projectId).emit('project:updated', { project });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Remove project member
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private
exports.removeProjectMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user is a member
  const memberIndex = project.members.findIndex(
    (member) => member.user.toString() === req.params.userId
  );

  if (memberIndex === -1) {
    return next(
      new ErrorResponse(
        `User ${req.params.userId} is not a member of this project`,
        400
      )
    );
  }

  // Remove member
  project.members.splice(memberIndex, 1);
  await project.save();

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.to(req.params.projectId).emit('project:updated', { project });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update member role
// @route   PUT /api/projects/:projectId/members/:userId
// @access  Private
exports.updateMemberRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Find the member and update their role
  const member = project.members.find(
    (member) => member.user.toString() === req.params.userId
  );

  if (!member) {
    return next(
      new ErrorResponse(
        `User ${req.params.userId} is not a member of this project`,
        400
      )
    );
  }

  member.role = role;
  await project.save();

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.to(req.params.projectId).emit('project:updated', { project });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Get project members
// @route   GET /api/projects/:projectId/members
// @access  Private
exports.getProjectMembers = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId).populate({
    path: 'members.user',
    select: 'name email avatar',
  });

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    count: project.members.length,
    data: project.members,
  });
});

// @desc    Get project statistics
// @route   GET /api/projects/:id/stats
// @access  Private
exports.getProjectStats = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  const stats = await Task.aggregate([
    {
      $match: { project: project._id },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Format the stats
  const formattedStats = {
    totalTasks: 0,
    byStatus: {},
  };

  stats.forEach((stat) => {
    formattedStats.byStatus[stat._id] = stat.count;
    formattedStats.totalTasks += stat.count;
  });

  res.status(200).json({
    success: true,
    data: formattedStats,
  });
});
