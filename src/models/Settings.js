const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'MBSML Lab' },
  contactEmail: String,
  twitter: String,
  github: String,
  footerText: String,
});

module.exports = mongoose.model('Settings', settingsSchema);
