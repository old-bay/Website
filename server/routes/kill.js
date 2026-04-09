const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getCurrentLongGame } = require('../services/gameState');
const { updateAchieves } = require('../services/achievements');
const { sendMail } = require('../services/email');

// POST /api/kill - Log a kill
router.post('/', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const { killCode, location } = req.body;
  if (!killCode) return res.status(400).json({ error: 'Kill code required' });

  const curGame = await getCurrentLongGame();
  if (!curGame) return res.status(400).json({ error: 'No active long game' });
  const gameID = curGame.gameID;

  // Check killer state
  const me = await db.queryOne('SELECT state FROM long_players WHERE playerID = ? AND gameID = ?', [uid, gameID]);
  if (!me) return res.status(400).json({ error: 'You are not registered for this game' });
  if (me.state <= 0 && me.state !== -2) return res.status(400).json({ error: 'You cannot log kills in your current state' });

  const qr = killCode.trim();

  // Check if this is the player's own kill code
  const selfCheck = await db.queryOne(
    'SELECT COUNT(*) AS cnt FROM long_players WHERE (mainKill = ? OR feedKill1 = ? OR feedKill2 = ?) AND playerID = ? AND gameID = ?',
    [qr, qr, qr, uid, gameID]
  );
  if (selfCheck.cnt > 0) {
    await sendMail('umbchvzofficers@gmail.com', 'Self Kill Code Alert',
      `Player ${uid} attempted to log their own kill code (${qr}).`);
    return res.status(400).json({ error: 'You cannot log your own kill code.' });
  }

  // Find victim by kill code
  const victim = await db.queryOne(
    `SELECT playerID, state, mainKill, feedKill1, feedKill2 FROM long_players
     WHERE (mainKill = ? OR feedKill1 = ? OR feedKill2 = ?) AND gameID = ?`,
    [qr, qr, qr, gameID]
  );
  if (!victim) return res.status(400).json({ error: 'Invalid kill code' });

  // Check victim state
  if (victim.state === 2) {
    return res.status(400).json({ error: 'This player is a disguised OZ and cannot be killed.' });
  }
  if (victim.state <= 0) {
    return res.status(400).json({ error: 'This player is already dead.' });
  }
  if (victim.state === 3) {
    // Medkit: give hours but no kill credit
    return res.json({ success: true, message: 'Medkit code logged.' });
  }

  // Determine kill type
  let killField;
  if (qr === victim.mainKill) killField = 'mainKill';
  else if (qr === victim.feedKill1) killField = 'feedKill1';
  else killField = 'feedKill2';

  const victimUID = victim.playerID;

  // Kill the victim
  const loc = (location || '').substring(0, 200);
  await db.execute('UPDATE long_players SET state = -1, deathTime = CURRENT_TIMESTAMP, killLocation = ? WHERE playerID = ? AND gameID = ?',
    [loc, victimUID, gameID]);

  // Calculate days survived
  const startDate = await db.queryOne('SELECT startDate FROM long_games WHERE gameID = ?', [gameID]);
  if (startDate) {
    const now = new Date();
    const start = new Date(startDate.startDate);
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    await db.execute('UPDATE long_players SET longestDaySurvived = ? WHERE playerID = ? AND gameID = ? AND longestDaySurvived < ?',
      [days, victimUID, gameID, days]);
  }

  // Determine who gets the kill credit
  let killerUID = uid;
  // If killer is OZ (state 2), use OZ dummy
  if (me.state === 2) {
    const dummyID = 'OZ' + uid.substring(2);
    const dummy = await db.queryOne('SELECT COUNT(*) AS cnt FROM long_players WHERE playerID = ? AND gameID = ?', [dummyID, gameID]);
    if (dummy.cnt > 0) killerUID = dummyID;
  }

  // Update kill count
  await db.execute('UPDATE long_players SET kills = kills + 1 WHERE playerID = ? AND gameID = ?', [killerUID, gameID]);
  await db.execute('UPDATE users SET lifetimeKills = lifetimeKills + 1 WHERE UID = ?', [uid]);

  // Get victim name for response
  const victimInfo = await db.queryOne('SELECT fname, lname FROM users WHERE UID = ?', [victimUID]);
  const victimName = victimInfo ? `${victimInfo.fname} ${victimInfo.lname}` : victimUID;

  // Update achievements
  try {
    await updateAchieves(uid, gameID, 'madeKill');
    await updateAchieves(victimUID, gameID, 'killed');
  } catch (e) { /* non-critical */ }

  res.json({ success: true, message: `Kill logged: ${victimName} has been tagged.` });
});

module.exports = router;
