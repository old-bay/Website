const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { secondsToHumanReadable } = require('../services/gameState');

// GET /api/news - Get blog posts
router.get('/', async (req, res) => {
  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || 5;
  const posts = await db.query(
    `SELECT p.postID, p.title, p.author, p.posted, p.content,
            u.fname AS authorName
     FROM blog_posts p
     LEFT JOIN users u ON p.author = u.UID
     ORDER BY p.posted DESC LIMIT ? OFFSET ?`,
    [limit, start]
  );

  const total = await db.queryOne('SELECT COUNT(*) AS cnt FROM blog_posts');

  res.json({
    posts: posts.map(p => {
      const elapsed = (Date.now() - new Date(p.posted).getTime()) / 1000;
      return {
        id: p.postID,
        title: p.title,
        author: p.authorName || p.author,
        posted: p.posted,
        postedAgo: secondsToHumanReadable(elapsed),
        content: p.content
      };
    }),
    total: total.cnt
  });
});

// DELETE /api/news/:id - Delete a blog post (admin only)
router.delete('/:id', requireAdmin(2), async (req, res) => {
  await db.execute('DELETE FROM blog_posts WHERE postID = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
