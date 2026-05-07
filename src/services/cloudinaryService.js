const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder (e.g., 'avatars', 'posts')
 * @returns {Promise<string>} - Secure URL of uploaded image
 */
const getExtension = (mimetype, originalname = '') => {
  const fromName = path.extname(originalname);
  if (fromName) return fromName;
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/gif') return '.gif';
  return '.jpg';
};

const uploadLocalImage = async (buffer, { folder, mimetype, originalname, req }) => {
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', safeFolder);
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${getExtension(
    mimetype,
    originalname,
  )}`;
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl =
    process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${safeFolder}/${filename}`;
};

exports.uploadImage = (buffer, options = {}) => {
  const folder = options.folder || 'mbsml';
  const hasCloudinaryConfig =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!hasCloudinaryConfig) {
    return uploadLocalImage(buffer, { ...options, folder });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      } else {
        resolve(result.secure_url);
      }
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
