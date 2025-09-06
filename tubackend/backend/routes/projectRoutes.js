const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
  getProjectMembers,
  getProjectStats,
} = require('../controllers/projectController');

const { protect, checkProjectMembership, checkProjectAdmin } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(checkProjectMembership, getProject)
  .put(checkProjectAdmin, updateProject)
  .delete(checkProjectAdmin, deleteProject);

// Project member routes
router
  .route('/:projectId/members')
  .get(checkProjectMembership, getProjectMembers);

router
  .route('/:projectId/members/:userId')
  .post(checkProjectAdmin, addProjectMember)
  .put(checkProjectAdmin, updateMemberRole)
  .delete(checkProjectAdmin, removeProjectMember);

// Project statistics
router.get('/:id/stats', checkProjectMembership, getProjectStats);

module.exports = router;
