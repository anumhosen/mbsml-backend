const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

exports.generateJWT = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
