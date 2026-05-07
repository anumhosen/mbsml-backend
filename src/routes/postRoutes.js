const express = require('express');
const {
  getPosts,
  getFeaturedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  likePost,
} = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/featured', getFeaturedPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

// Protected routes
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);

module.exports = router;
