const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// GET /api/admin/semester/voting-members
router.get('/voting-members', requireAdmin(1), async (req, res) => {
  const members = await db.query(
    'SELECT fname, lname, uname, appearancesThisTerm, appearancesLastTerm FROM users WHERE appearancesThisTerm + appearancesLastTerm >= 5 ORDER BY appearancesThisTerm + appearancesLastTerm DESC'
  );
  const count = await db.queryOne(
    'SELECT COUNT(*) AS cnt FROM users WHERE appearancesThisTerm + appearancesLastTerm >= 5'
  );
  res.json({ members, count: count.cnt });
});

// POST /api/admin/semester/end-year
router.post('/end-year', requireAdmin(2), async (req, res) => {
  await db.execute("UPDATE users SET appearancesLastTerm = appearancesThisTerm WHERE 1");
  await db.execute("UPDATE users SET appearancesThisTerm = '0' WHERE 1");
  await db.execute("UPDATE users SET zombieStartsThisTerm = '0' WHERE 1");
  await db.execute("UPDATE users SET humanStartsThisTerm = '0' WHERE 1");
  await db.execute("UPDATE users SET gamesModdedThisTerm = '0' WHERE 1");
  await db.execute("UPDATE users SET adminMeetingsThisTerm = '0' WHERE 1");
  await db.execute("UPDATE users SET hasTurnedInWaiver = '0' WHERE 1");
  res.json({ success: true });
});

// POST /api/admin/semester/end-semester
router.post('/end-semester', requireAdmin(2), async (req, res) => {
  await db.execute("UPDATE users SET appearancesLastTerm = appearancesThisTerm WHERE 1");
  await db.execute("UPDATE users SET appearancesThisTerm = 0 WHERE 1");
  await db.execute("UPDATE users SET zombieStartsThisTerm = 0 WHERE 1");
  await db.execute("UPDATE users SET humanStartsThisTerm = 0 WHERE 1");
  await db.execute("UPDATE users SET gamesModdedThisTerm = 0 WHERE 1");
  await db.execute("UPDATE users SET adminMeetingsThisTerm = 0 WHERE 1");
  res.json({ success: true });
});

module.exports = router;
