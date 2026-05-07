const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [String],
  journal: String,
  year: Number,
  doi: String,
  abstract: String,
  pdfUrl: String,
});

module.exports = mongoose.model('Publication', publicationSchema);
