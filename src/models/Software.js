const mongoose = require('mongoose');

const softwareSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: String,
  description: String,
  repositoryUrl: String,
  documentationUrl: String,
  citation: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Software', softwareSchema);
