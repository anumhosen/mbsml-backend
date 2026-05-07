const Post = require('../models/Post');
const Tutorial = require('../models/Tutorial');

/**
 * Search across posts and tutorials
 * GET /api/search?q=query
 */
exports.searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ posts: [], tutorials: [] });
    }

    // Search posts (only published)
    const posts = await Post.find(
      { status: 'published', $text: { $search: q } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .populate('author', 'name')
      .lean();

    // Search tutorials (only active)
    const tutorials = await Tutorial.find(
      { isActive: true, $text: { $search: q } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean();

    res.json({
      posts: posts.map((p) => ({
        id: p._id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        author: p.author?.name,
        publishedAt: p.publishedAt,
      })),
      tutorials: tutorials.map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        youtubeId: t.youtubeId,
        playlist: t.playlist,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
