const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');

const normalizeComment = (comment) => ({
  ...comment,
  id: comment._id.toString(),
  parentComment: comment.parentComment?.toString() || null,
  author: comment.author
    ? {
        ...comment.author,
        id: comment.author._id?.toString(),
      }
    : null,
  replies: [],
});

// Helper to build nested comment tree from flat list
const buildCommentTree = (comments) => {
  const commentMap = new Map();
  const roots = [];

  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), normalizeComment(comment));
  });

  comments.forEach((comment) => {
    const commentObj = commentMap.get(comment._id.toString());
    if (comment.parentComment) {
      const parent = commentMap.get(comment.parentComment.toString());
      if (parent) parent.replies.push(commentObj);
    } else {
      roots.push(commentObj);
    }
  });

  return roots;
};

// Get all comments for a post (nested, paginated)
exports.getComments = async (req, res) => {
  try {
    const { postSlug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // First find the post by slug
    const post = await Post.findOne({ slug: postSlug });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get all comments for this post, sorted by newest first
    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .lean();

    const tree = buildCommentTree(comments);
    const total = tree.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRoots = tree.slice(start, start + parseInt(limit));

    res.json({
      comments: paginatedRoots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a comment (or reply)
exports.addComment = async (req, res) => {
  try {
    const { postSlug } = req.params;
    const { content, parentId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: 'Invalid parent comment id' });
    }

    const post = await Post.findOne({ slug: postSlug });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      post: post._id,
      author: req.user._id,
      parentComment: parentId || null,
      content,
    });
    await comment.save();

    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    // Populate author info
    await comment.populate('author', 'name avatar');

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete comment (author or admin)
exports.deleteComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Authorization: author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let deletedCount = 1;
    const deleteReplies = async (parentId) => {
      const replies = await Comment.find({ parentComment: parentId });
      for (const reply of replies) {
        await deleteReplies(reply._id);
        await reply.deleteOne();
        deletedCount += 1;
      }
    };
    await deleteReplies(comment._id);
    await comment.deleteOne();

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -deletedCount },
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle like on comment
exports.likeComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingLike = await Like.findOne({
      user: req.user._id,
      targetId: comment._id,
      targetType: 'Comment',
    });

    if (existingLike) {
      await existingLike.deleteOne();
      comment.likesCount = Math.max(0, comment.likesCount - 1);
      await comment.save();
      res.json({ liked: false, likesCount: comment.likesCount });
    } else {
      await Like.create({ user: req.user._id, targetId: comment._id, targetType: 'Comment' });
      comment.likesCount += 1;
      await comment.save();
      res.json({ liked: true, likesCount: comment.likesCount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
