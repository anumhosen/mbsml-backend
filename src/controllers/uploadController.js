// Upload controller
const { uploadImage } = require('../services/cloudinaryService');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const folder = req.body.folder || 'mbsml';
    const url = await uploadImage(req.file.buffer, {
      folder,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      req,
    });
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};
