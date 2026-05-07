const express = require('express');
const {
  getPageContent,
  getTutorials,
  getFeaturedTutorials,
  getTutorialById,
  getSoftware,
  getPublications,
  getPeople,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/content/:pageKey', getPageContent);
router.get('/tutorials', getTutorials);
router.get('/tutorials/featured', getFeaturedTutorials);
router.get('/tutorials/:id', getTutorialById);
router.get('/software', getSoftware);
router.get('/publications', getPublications);
router.get('/people', getPeople);

module.exports = router;
