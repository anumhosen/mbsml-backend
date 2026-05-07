const express = require('express');
const { auth } = require('../middleware/auth');
const {
  updateProfile,
  changePassword,
  getUserPosts,
  getUserComments,
  getUserLikedPosts,
  deleteUserPost,
} = require('../controllers/userController');

const router = express.Router();

router.use(auth);

router.put('/me', updateProfile);
router.post('/me/change-password', changePassword);
router.get('/me/posts', getUserPosts);
router.get('/me/comments', getUserComments);
router.get('/me/likes', getUserLikedPosts);
router.delete('/me/posts/:id', deleteUserPost);

module.exports = router;
