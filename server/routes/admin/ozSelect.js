const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireLongGameAuth } = require('../../middleware/auth');
const { getCurrentLongGame } = require('../../services/gameState');
const { updateAchieves } = require('../../services/achievements');

// GET /api/admin/oz - Get OZ pool
router.get('/', requireLongGameAuth(1), async (req, res) => {
  const curGame = await getCurrentLongGame();
  if (!curGame) return res.json({ players: [] });

  const players = await db.query(
    `SELECT u.UID, u.fname, u.lname, u.ozParagraph, u.timesAsOZ,
            u.humanStartsTotal, u.zombieStartsTotal, u.gamesModdedTotal,
            lp.state
     FROM users u JOIN long_players lp ON u.UID = lp.playerID
     WHERE u.ozOptIn = 1 AND lp.gameID = ?
     ORDER BY lp.playerID`,
    [curGame.gameID]
  );

  res.json({ players, gameID: curGame.gameID, authLevel: req.session.isLongGameAuthed || 0 });
});

// POST /api/admin/oz/select - Make player OZ
router.post('/select', requireLongGameAuth(2), async (req, res) => {
  const { uid } = req.body;
  const curGame = await getCurrentLongGame();
  if (!curGame) return res.status(400).json({ error: 'No active long game' });

  const gameID = curGame.gameID;

  // Mark player as disguised OZ (state 2)
  await db.execute('UPDATE long_players SET state = 2 WHERE playerID = ? AND gameID = ?', [uid, gameID]);

  // Create dummy OZ account
  const dummyID = 'OZ' + uid.substring(2);
  await db.execute('DELETE FROM long_players WHERE playerID = ? AND gameID = ?', [dummyID, gameID]);
  await db.execute(
    "INSERT INTO long_players (gameID, playerID, mainKill, feedKill1, feedKill2, state) VALUES (?, ?, '', '', '', -2)",
    [gameID, dummyID]
  );

  await db.execute('UPDATE users SET timesAsOZ = timesAsOZ + 1 WHERE UID = ?', [uid]);

  try { await updateAchieves(uid, null, 'madeOZ'); } catch (e) {}

  res.json({ success: true });
});

module.exports = router;
