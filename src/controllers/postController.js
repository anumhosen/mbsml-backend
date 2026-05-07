const mongoose = require('mongoose');
const Post = require('../models/Post');
const Like = require('../models/Like');
const { serializePost } = require('../utils/serializers');

// Helper to generate slug from title (if not provided)
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Get posts with pagination, search, filters, sorting (only published)
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tag, sort = 'latest' } = req.query;
    const filter = { status: 'published' };

    if (search) {
      filter.$text = { $search: search };
    }
    if (tag && tag !== '') {
      filter.tags = tag;
    }

    let query = Post.find(filter).populate('author', 'name avatar');

    // Sorting
    switch (sort) {
      case 'latest':
        query = query.sort({ publishedAt: -1 });
        break;
      case 'oldest':
        query = query.sort({ publishedAt: 1 });
        break;
      case 'popular':
        query = query.sort({ likesCount: -1, commentsCount: -1 });
        break;
      default:
        query = query.sort({ publishedAt: -1 });
    }

    // Pagination
    const total = await Post.countDocuments(filter);
    const posts = await query.skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));

    // Get all unique tags from published posts
    const allTags = await Post.distinct('tags', { status: 'published' });

    res.json({
      posts: posts.map(serializePost),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      tags: allTags,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured posts (latest 3)
exports.getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .populate('author', 'name avatar');
    res.json(posts.map(serializePost));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const canViewDraft =
      req.user &&
      (req.user.role === 'admin' || post.author?._id?.toString() === req.user._id.toString());

    if (post.status !== 'published' && !canViewDraft) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(serializePost(post));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, excerpt, featuredImage, tags, status } = req.body;
    const slug = generateSlug(title);

    const existing = await Post.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'A post with similar title already exists' });
    }

    const post = new Post({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200).replace(/\n/g, ' '),
      featuredImage,
      author: req.user._id,
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
    });

    await post.save();
    res.status(201).json(serializePost(post));
  } catch (error) {
    console.error('Create post error details:', error); // This will show the actual error
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization: author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, content, excerpt, featuredImage, tags, status } = req.body;

    if (title && title !== post.title) {
      const newSlug = generateSlug(title);
      const existing = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (existing) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
      post.slug = newSlug;
      post.title = title;
    }

    post.content = content || post.content;
    post.excerpt = excerpt || content?.substring(0, 200).replace(/\n/g, ' ') || post.excerpt;
    post.featuredImage = featuredImage || post.featuredImage;
    post.tags = tags || post.tags;

    if (status && status !== post.status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await post.save();
    res.json(serializePost(post));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle like on post
exports.likePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = await Like.findOne({
      user: req.user._id,
      targetId: post._id,
      targetType: 'Post',
    });

    if (existingLike) {
      // Unlike
      await existingLike.deleteOne();
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
      res.json({ liked: false, likesCount: post.likesCount });
    } else {
      // Like
      await Like.create({ user: req.user._id, targetId: post._id, targetType: 'Post' });
      post.likesCount += 1;
      await post.save();
      res.json({ liked: true, likesCount: post.likesCount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
