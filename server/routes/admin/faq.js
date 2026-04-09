const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// GET /api/admin/faq
router.get('/', requireAdmin(2), async (req, res) => {
  const faqs = await db.query('SELECT * FROM faq ORDER BY number ASC');
  res.json(faqs);
});

// POST /api/admin/faq - Create/update FAQ
router.post('/', requireAdmin(2), async (req, res) => {
  const { number, title, answer, id } = req.body;
  if (id) {
    await db.execute('UPDATE faq SET number = ?, title = ?, answer = ? WHERE faqID = ?', [number, title, answer, id]);
  } else {
    await db.execute('INSERT INTO faq (number, title, answer) VALUES (?, ?, ?)', [number, title, answer]);
  }
  res.json({ success: true });
});

// DELETE /api/admin/faq/:id
router.delete('/:id', requireAdmin(2), async (req, res) => {
  await db.execute('DELETE FROM faq WHERE faqID = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
