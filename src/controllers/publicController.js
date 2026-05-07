const Content = require('../models/Content');
const Tutorial = require('../models/Tutorial');
const Software = require('../models/Software');
const Publication = require('../models/Publication');
const Person = require('../models/Person');

exports.getPageContent = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const content = await Content.findOne({ pageKey });

    if (!content) {
      return res.json({ content: '# Content coming soon', title: pageKey });
    }

    res.json({ content: content.content, title: content.title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTutorials = async (req, res) => {
  try {
    const { search, tag, playlist } = req.query;
    const filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (tag) filter.tags = tag;
    if (playlist) filter.playlist = playlist;

    const tutorials = await Tutorial.find(filter).sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeaturedTutorials = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const tutorials = await Tutorial.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));
    res.json(tutorials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTutorialById = async (req, res) => {
  try {
    const tutorial = await Tutorial.findOne({ _id: req.params.id, isActive: true });
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });
    res.json(tutorial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSoftware = async (req, res) => {
  try {
    const software = await Software.find({ isActive: true }).sort({ name: 1 });
    res.json(software);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublications = async (req, res) => {
  try {
    const publications = await Publication.find().sort({ year: -1 });
    res.json(publications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPeople = async (req, res) => {
  try {
    const people = await Person.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(people);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
