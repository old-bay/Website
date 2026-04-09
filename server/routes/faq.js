const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/faq - Get FAQ entries
router.get('/', async (req, res) => {
  const faqs = await db.query('SELECT * FROM faq ORDER BY number ASC');
  res.json(faqs);
});

// GET /api/faq/achievements - Get achievement FAQs
router.get('/achievements', async (req, res) => {
  const faqs = await db.query('SELECT * FROM achievementFaq ORDER BY number ASC');
  res.json(faqs);
});

module.exports = router;
