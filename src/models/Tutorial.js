const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    youtubeId: { type: String, required: true },
    playlist: String,
    tags: [String],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
tutorialSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Tutorial', tutorialSchema);
