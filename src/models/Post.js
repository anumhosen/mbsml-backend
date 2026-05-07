const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true }, // unique index defined separately
    content: { type: String, required: true },
    excerpt: String,
    featuredImage: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    publishedAt: Date,
  },
  { timestamps: true },
);

// Indexes – unique index on slug only once
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Pre-save hook – using async/await (no 'next' parameter needed)
postSchema.pre('save', async function () {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 200).replace(/\n/g, ' ');
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

module.exports = mongoose.model('Post', postSchema);
