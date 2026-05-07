const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getComments,
  addComment,
  deleteComment,
  likeComment,
} = require('../controllers/commentController');

const router = express.Router();

router.get('/posts/:postSlug/comments', getComments);
router.post('/posts/:postSlug/comments', auth, addComment);
router.delete('/comments/:id', auth, deleteComment);
router.post('/comments/:id/like', auth, likeComment);

module.exports = router;
