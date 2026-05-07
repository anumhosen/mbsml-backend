const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');

// Helper to build nested comment tree from flat list
const buildCommentTree = (comments) => {
  const commentMap = new Map();
  const roots = [];

  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
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
    const PostModel = require('../models/Post');
    const post = await PostModel.findOne({ slug: postSlug });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get all comments for this post, sorted by newest first
    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .lean();

    // Apply pagination to root comments only (simplified: we get all, then paginate roots)
    let roots = comments.filter((c) => !c.parentComment);
    const total = roots.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRoots = roots.slice(start, start + parseInt(limit));

    // Get only the comments that are in paginatedRoots or are replies to them
    const rootIds = paginatedRoots.map((r) => r._id);
    const relevantComments = comments.filter(
      (c) => rootIds.includes(c._id) || (c.parentComment && rootIds.includes(c.parentComment)),
    );

    const nested = buildCommentTree(relevantComments);

    res.json({
      comments: nested,
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
    const { postId, content, parentId } = req.body;

    // Verify post exists
    const PostModel = require('../models/Post');
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      parentComment: parentId || null,
      content,
    });
    await comment.save();

    // Increment post's commentsCount
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

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
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Authorization: author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Recursively delete all replies (optional: you can also just mark as deleted)
    // For simplicity, we'll delete all child comments
    const deleteReplies = async (parentId) => {
      const replies = await Comment.find({ parentComment: parentId });
      for (const reply of replies) {
        await deleteReplies(reply._id);
        await reply.deleteOne();
      }
    };
    await deleteReplies(comment._id);
    await comment.deleteOne();

    // Decrement post's commentsCount by the number of deleted comments (including replies)
    // For accuracy, recalc or just decrement 1; we'll leave to a periodic sync.
    // Simple: decrement 1 for this comment only.
    const PostModel = require('../models/Post');
    await PostModel.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle like on comment
exports.likeComment = async (req, res) => {
  try {
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
