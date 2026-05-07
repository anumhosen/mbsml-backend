// Admin controller
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Content = require('../models/Content');
const Tutorial = require('../models/Tutorial');
const Software = require('../models/Software');
const Publication = require('../models/Publication');
const Settings = require('../models/Settings');

// ---------- User Management ----------
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Post Management ----------
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const post = await Post.findByIdAndUpdate(id, { status }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePostAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Comment Management ----------
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('author', 'name')
      .populate('post', 'title')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCommentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Static Content Management ----------
exports.getStaticContent = async (req, res) => {
  try {
    const { pageKey } = req.params;
    let content = await Content.findOne({ pageKey });
    if (!content) {
      // Create default if not exists
      content = await Content.create({ pageKey, content: `# ${pageKey}\n\nContent coming soon.` });
    }
    res.json({ content: content.content, title: content.title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStaticContent = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { content, title } = req.body;
    const updated = await Content.findOneAndUpdate(
      { pageKey },
      { content, title, lastEditedBy: req.user._id, $inc: { version: 1 } },
      { upsert: true, new: true },
    );
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Tutorial Management ----------
exports.getTutorials = async (req, res) => {
  try {
    const tutorials = await Tutorial.find().sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTutorial = async (req, res) => {
  try {
    const tutorial = new Tutorial({ ...req.body, createdBy: req.user._id });
    await tutorial.save();
    res.status(201).json(tutorial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorial = await Tutorial.findByIdAndUpdate(id, req.body, { new: true });
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });
    res.json(tutorial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    await Tutorial.findByIdAndDelete(id);
    res.json({ message: 'Tutorial deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Software Management ----------
exports.getSoftware = async (req, res) => {
  try {
    const software = await Software.find();
    res.json(software);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSoftware = async (req, res) => {
  try {
    const item = new Software(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Software.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Software not found' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    await Software.findByIdAndDelete(id);
    res.json({ message: 'Software deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Publication Management ----------
exports.getPublications = async (req, res) => {
  try {
    const pubs = await Publication.find().sort({ year: -1 });
    res.json(pubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPublication = async (req, res) => {
  try {
    const pub = new Publication(req.body);
    await pub.save();
    res.status(201).json(pub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const pub = await Publication.findByIdAndUpdate(id, req.body, { new: true });
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    res.json(pub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    await Publication.findByIdAndDelete(id);
    res.json({ message: 'Publication deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- Site Settings ----------
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
