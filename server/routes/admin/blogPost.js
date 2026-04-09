const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// POST /api/admin/blog - Create blog post
router.post('/', requireAdmin(2), async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const author = req.session.uid;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await db.execute(
    'INSERT INTO blog_posts (title, author, posted, content) VALUES (?, ?, ?, ?)',
    [title, author, timestamp, content]
  );
  res.json({ success: true });
});

module.exports = router;
