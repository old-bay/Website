const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin, requireLongGameAuth } = require('../../middleware/auth');
const { getUID, getCurrentLongGame } = require('../../services/gameState');
const { generateRandomID, getNextHighestID, KILL_CHARS } = require('../../services/ids');
const { updateAchieves } = require('../../services/achievements');

// GET /api/admin/long-game - Get long game data
router.get('/', requireLongGameAuth(1), async (req, res) => {
  const games = await db.query('SELECT * FROM long_games WHERE CURRENT_TIMESTAMP < endDate ORDER BY startDate DESC');
  const curGame = await getCurrentLongGame();
  res.json({ games, current: curGame, authLevel: req.session.isLongGameAuthed || 0 });
});

// POST /api/admin/long-game/register - Register player for long game
router.post('/register', requireLongGameAuth(1), async (req, res) => {
  const { longGameSelect, playerID, waiverStatus } = req.body;
  const user = await getUID(playerID);
  if (!user) return res.status(400).json({ error: 'Player not found' });

  const uid = user.UID;
  const gameID = longGameSelect;

  // Check not already registered
  const existing = await db.queryOne('SELECT COUNT(*) AS cnt FROM long_players WHERE playerID = ? AND gameID = ?', [uid, gameID]);
  if (existing.cnt > 0) return res.status(400).json({ error: 'Player already registered' });

  const mainKill = await generateRandomID(['long_players'], ['mainKill', 'feedKill1', 'feedKill2'], 'MK', KILL_CHARS);
  const feedKill1 = await generateRandomID(['long_players'], ['mainKill', 'feedKill1', 'feedKill2'], 'FK', KILL_CHARS);
  const feedKill2 = await generateRandomID(['long_players'], ['mainKill', 'feedKill1', 'feedKill2'], 'FK', KILL_CHARS);

  await db.execute(
    'INSERT INTO long_players (gameID, playerID, mainKill, feedKill1, feedKill2) VALUES (?, ?, ?, ?, ?)',
    [gameID, uid, mainKill, feedKill1, feedKill2]
  );

  if (waiverStatus === 'turnedIn') {
    await db.execute('UPDATE users SET hasTurnedInWaiver = 1 WHERE UID = ?', [uid]);
  }

  try { await updateAchieves(uid, null, 'longRegister'); } catch (e) {}

  res.json({ success: true, player: { fname: user.fname, lname: user.lname, uname: user.uname } });
});

// POST /api/admin/long-game/create - Create new long game
router.post('/create', requireLongGameAuth(2), async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const gameID = await getNextHighestID('long_games', 'gameID', 'LG');
  await db.execute(
    'INSERT INTO long_games (title, gameID, startDate, endDate) VALUES (?, ?, ?, ?)',
    [title, gameID, startDate, endDate]
  );
  res.json({ success: true, gameID });
});

// POST /api/admin/long-game/close - Close long game
router.post('/close', requireLongGameAuth(2), async (req, res) => {
  const { longGameSelect } = req.body;
  await db.execute("UPDATE users SET attendedPregame = '0' WHERE 1");
  try { await updateAchieves(null, null, 'gameEnd'); } catch (e) {}
  await db.execute('UPDATE long_games SET endDate = CURRENT_TIMESTAMP WHERE gameID = ?', [longGameSelect]);
  res.json({ success: true });
});

// GET /api/admin/long-game/mailing/:gameID/:filter - Generate mailing list
router.get('/mailing/:gameID/:filter', requireLongGameAuth(1), async (req, res) => {
  const { gameID, filter } = req.params;
  let whereClause = '';
  if (filter === 'human') whereClause = 'AND lp.state > 0';
  else if (filter === 'zombie') whereClause = 'AND lp.state < 0';

  const players = await db.query(
    `SELECT u.fname, u.lname, u.email, u.uname, lp.mainKill, lp.state
     FROM long_players lp JOIN users u ON lp.playerID = u.UID
     WHERE lp.gameID = ? AND lp.playerID NOT LIKE 'OZ%' ${whereClause}
     ORDER BY u.lname`,
    [gameID]
  );
  res.json(players);
});

module.exports = router;
