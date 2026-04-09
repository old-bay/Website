const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// GET /api/games - Get long game list
router.get('/', requireLogin, async (req, res) => {
  const isAdmin = req.session.isAdmin >= 1;
  const isBeta = req.session.isBetaTester >= 1;
  if (!isAdmin && !isBeta) return res.status(403).json({ error: 'Access denied' });

  const games = await db.query('SELECT * FROM long_games WHERE 1 ORDER BY startDate DESC');
  res.json(games);
});

// GET /api/games/:id/log - Get game log for a specific game
router.get('/:id/log', requireLogin, async (req, res) => {
  const isAdmin = req.session.isAdmin >= 1;
  const isBeta = req.session.isBetaTester >= 1;
  if (!isAdmin && !isBeta) return res.status(403).json({ error: 'Access denied' });

  const gameID = req.params.id;
  const players = await db.query(
    `SELECT lp.*, u.fname, u.lname, u.uname
     FROM long_players lp
     LEFT JOIN users u ON lp.playerID = u.UID
     WHERE lp.gameID = ? ORDER BY lp.deathTime ASC`,
    [gameID]
  );
  res.json(players);
});

module.exports = router;
