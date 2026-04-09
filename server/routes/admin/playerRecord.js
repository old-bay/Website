const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// POST /api/admin/player-record/vaccine
router.post('/vaccine', requireAdmin(2), async (req, res) => {
  const { username, status } = req.body;
  await db.execute('UPDATE users SET vaccineStatus = ? WHERE uname = ?', [parseInt(status), username]);
  res.json({ success: true });
});

// POST /api/admin/player-record/waiver
router.post('/waiver', requireAdmin(2), async (req, res) => {
  const { username, status } = req.body;
  await db.execute('UPDATE users SET hasTurnedInWaiver = ? WHERE uname = ?', [parseInt(status), username]);
  res.json({ success: true });
});

module.exports = router;
