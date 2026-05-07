const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { serializeUser, serializePost, serializeComment } = require('../utils/serializers');

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(serializeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(posts.map(serializePost));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserComments = async (req, res) => {
  try {
    const comments = await Comment.find({ author: req.user._id })
      .populate('post', 'title slug')
      .sort({ createdAt: -1 });
    res.json(comments.map(serializeComment));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserLikedPosts = async (req, res) => {
  try {
    const likes = await Like.find({ user: req.user._id, targetType: 'Post' }).select('targetId');
    const postIds = likes.map((like) => like.targetId);
    const posts = await Post.find({ _id: { $in: postIds }, status: 'published' })
      .populate('author', 'name')
      .sort({ publishedAt: -1 });

    res.json(posts.map(serializePost));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUserPost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
