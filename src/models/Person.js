const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    email: { type: String, default: '' },
    avatar: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

personSchema.index({ isActive: 1, order: 1, name: 1 });

module.exports = mongoose.model('Person', personSchema);
