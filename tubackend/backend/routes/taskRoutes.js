const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  updateTaskStatus,
  addTaskComment,
  getTaskComments,
  searchTasks,
} = require('../controllers/taskController');

const { protect, checkProjectMembership, checkTaskAccess } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(checkProjectMembership, getTasks)
  .post(checkProjectMembership, createTask);

// Task search
router.get('/search', searchTasks);

router
  .route('/:id')
  .get(checkTaskAccess, getTask)
  .put(checkTaskAccess, updateTask)
  .delete(checkTaskAccess, deleteTask);

// Task assignment routes
router
  .route('/:id/assign')
  .post(checkProjectMembership, assignTask);

router
  .route('/:id/unassign')
  .post(checkProjectMembership, unassignTask);

// Task status update
router.put('/:id/status', checkTaskAccess, updateTaskStatus);

// Task comments
router
  .route('/:id/comments')
  .get(checkTaskAccess, getTaskComments)
  .post(checkTaskAccess, addTaskComment);

module.exports = router;
