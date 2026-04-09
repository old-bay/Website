const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin, requireLongGameAuth } = require('../../middleware/auth');
const { getCurrentLongGame } = require('../../services/gameState');

// GET /api/admin/points - Get points data
router.get('/', async (req, res) => {
  if (!req.session.uid) return res.status(401).json({ error: 'Not logged in' });
  if ((req.session.isAdmin || 0) < 2 && (req.session.isLongGameAuthed || 0) < 1) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const curGame = await getCurrentLongGame();
  if (!curGame) return res.json({ error: 'No active long game' });

  const gameID = curGame.gameID;

  // Player list with points
  const players = await db.query(
    `SELECT lp.playerID, u.fname, u.lname, lp.state,
            COALESCE(SUM(pt.pointsGiven), 0) AS points
     FROM long_players lp
     JOIN users u ON lp.playerID = u.UID
     LEFT JOIN long_points pt ON lp.playerID = pt.playerID AND pt.gameID = lp.gameID
     WHERE lp.gameID = ? AND lp.playerID NOT LIKE 'OZ%'
     GROUP BY lp.playerID
     ORDER BY u.lname`,
    [gameID]
  );

  // Points log
  const log = await db.query(
    `SELECT pt.pointsGiven, pt.reason, u.fname, u.lname
     FROM long_points pt
     LEFT JOIN users u ON pt.playerID = u.UID
     WHERE pt.gameID = ?
     ORDER BY pt.pointID DESC`,
    [gameID]
  );

  // Totals
  const humanPts = await db.queryOne(
    `SELECT COALESCE(SUM(pt.pointsGiven), 0) AS total
     FROM long_points pt JOIN long_players lp ON pt.playerID = lp.playerID AND pt.gameID = lp.gameID
     WHERE pt.gameID = ? AND lp.state > 0`,
    [gameID]
  );
  const zombiePts = await db.queryOne(
    `SELECT COALESCE(SUM(pt.pointsGiven), 0) AS total
     FROM long_points pt JOIN long_players lp ON pt.playerID = lp.playerID AND pt.gameID = lp.gameID
     WHERE pt.gameID = ? AND lp.state < 0`,
    [gameID]
  );

  res.json({
    gameID,
    players,
    log,
    humanPoints: humanPts.total,
    zombiePoints: zombiePts.total,
    authLevel: req.session.isLongGameAuthed || 0
  });
});

// POST /api/admin/points - Award points
router.post('/', requireLongGameAuth(2), async (req, res) => {
  const { playerIDs, points, reason } = req.body;
  if (!playerIDs || !Array.isArray(playerIDs) || !points || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const curGame = await getCurrentLongGame();
  if (!curGame) return res.status(400).json({ error: 'No active long game' });

  for (const pid of playerIDs) {
    await db.execute(
      'INSERT INTO long_points (gameID, playerID, pointsGiven, reason) VALUES (?, ?, ?, ?)',
      [curGame.gameID, pid, parseInt(points), reason]
    );
  }

  res.json({ success: true, awarded: playerIDs.length });
});

module.exports = router;
