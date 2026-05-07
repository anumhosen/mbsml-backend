const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true },
    title: String,
    content: { type: String, default: '' },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Content', contentSchema);
