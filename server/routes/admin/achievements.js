const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');
const { getUID } = require('../../services/gameState');
const { giveAchieve, getAidByKey } = require('../../services/achievements');

// GET /api/admin/achievements - Get achievement list for admin
router.get('/', requireAdmin(1), async (req, res) => {
  const achievements = await db.query('SELECT AID, name, `key` FROM achievements_new ORDER BY name');
  res.json(achievements);
});

// POST /api/admin/achievements/award - Award achievement to individual
router.post('/award', requireAdmin(1), async (req, res) => {
  const { username, achieveKey } = req.body;
  const user = await getUID(username);
  if (!user) return res.status(400).json({ error: 'Player not found' });

  const achieve = await db.queryOne('SELECT AID FROM achievements_new WHERE `key` = ?', [achieveKey]);
  if (!achieve) return res.status(400).json({ error: 'Achievement not found' });

  const result = await giveAchieve(achieve.AID, user.UID);
  res.json({ success: true, awarded: result === 1, player: user.uname });
});

// POST /api/admin/achievements/award-group - Award achievement to group (webcom only)
router.post('/award-group', requireAdmin(3), async (req, res) => {
  const { whereClause, achieveKey } = req.body;

  // Basic SQL injection protection
  if (!whereClause || whereClause.includes(';') || whereClause.startsWith('--')) {
    return res.status(400).json({ error: 'Invalid WHERE clause' });
  }

  const achieve = await db.queryOne('SELECT AID FROM achievements_new WHERE `key` = ?', [achieveKey]);
  if (!achieve) return res.status(400).json({ error: 'Achievement not found' });

  // Use parameterized approach where possible, but the WHERE clause is admin-defined
  const users = await db.query(`SELECT uname, UID FROM users WHERE ${whereClause}`);
  let awarded = 0;
  for (const user of users) {
    const r = await giveAchieve(achieve.AID, user.UID);
    if (r === 1) awarded++;
  }

  res.json({ success: true, awarded, total: users.length });
});

module.exports = router;
