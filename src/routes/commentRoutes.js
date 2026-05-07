const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
// TODO: add comment endpoints
router.get('/posts/:postSlug/comments', (req, res) => res.json({ comments: [] }));
router.post('/', auth, (req, res) => res.json({}));
router.delete('/:id', auth, (req, res) => res.json({}));
router.post('/:id/like', auth, (req, res) => res.json({}));
module.exports = router;
