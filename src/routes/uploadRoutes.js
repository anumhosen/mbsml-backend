const express = require('express');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');

const router = express.Router();

// Protected route – only authenticated users can upload
router.post('/', auth, upload.single('file'), uploadFile);

module.exports = router;
