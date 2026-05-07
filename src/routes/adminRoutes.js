const express = require('express');
const { auth, isAdmin } = require('../middleware/auth');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getAllPosts,
  updatePostStatus,
  deletePostAdmin,
  getAllComments,
  deleteCommentAdmin,
  getStaticContent,
  updateStaticContent,
  getTutorials,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  getSoftware,
  createSoftware,
  updateSoftware,
  deleteSoftware,
  getPublications,
  createPublication,
  updatePublication,
  deletePublication,
  getSettings,
  updateSettings,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth, isAdmin);

// User management
router.get('/users', getUsers);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

// Post management
router.get('/posts', getAllPosts);
router.put('/posts/:id', updatePostStatus);
router.delete('/posts/:id', deletePostAdmin);

// Comment management
router.get('/comments', getAllComments);
router.delete('/comments/:id', deleteCommentAdmin);

// Static content
router.get('/content/:pageKey', getStaticContent);
router.put('/content/:pageKey', updateStaticContent);

// Tutorials
router.get('/tutorials', getTutorials);
router.post('/tutorials', createTutorial);
router.put('/tutorials/:id', updateTutorial);
router.delete('/tutorials/:id', deleteTutorial);

// Software
router.get('/software', getSoftware);
router.post('/software', createSoftware);
router.put('/software/:id', updateSoftware);
router.delete('/software/:id', deleteSoftware);

// Publications
router.get('/publications', getPublications);
router.post('/publications', createPublication);
router.put('/publications/:id', updatePublication);
router.delete('/publications/:id', deletePublication);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
