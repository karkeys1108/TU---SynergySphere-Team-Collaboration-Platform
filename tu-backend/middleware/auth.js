const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Set token from cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Check project membership
exports.checkProjectMembership = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  
  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.projectId}`, 404)
    );
  }
  
  // Check if user is project member
  if (!project.isMember(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to access this project', 401)
    );
  }
  
  req.project = project;
  next();
});

// Check project admin access
exports.checkProjectAdmin = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  
  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.projectId}`, 404)
    );
  }
  
  // Check if user is project admin
  if (!project.isAdmin(req.user.id)) {
    return next(
      new ErrorResponse('Not authorized to perform this action', 403)
    );
  }
  
  req.project = project;
  next();
});

// Check task ownership or project membership
exports.checkTaskAccess = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if user is task creator, assigned to task, or project admin
  const isCreator = task.createdBy.toString() === req.user.id;
  const isAssigned = task.assignedTo.some(id => id.toString() === req.user.id);
  
  if (!isCreator && !isAssigned) {
    // Check if user is project admin
    const project = await Project.findById(task.project);
    if (!project.isAdmin(req.user.id)) {
      return next(
        new ErrorResponse('Not authorized to access this task', 403)
      );
    }
  }
  
  req.task = task;
  next();
});
