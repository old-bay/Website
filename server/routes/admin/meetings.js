const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');
const { getUID, getCurrentLongGame, denumerate } = require('../../services/gameState');
const { updateAttendance } = require('../../services/attendance');
const { updateAchieves } = require('../../services/achievements');

// GET /api/admin/meetings - Get meeting data
router.get('/', requireAdmin(1), async (req, res) => {
  const unresolved = await db.query('SELECT * FROM meeting_list WHERE isResolved = 0 ORDER BY creationDate DESC');
  const all = await db.query('SELECT * FROM meeting_list ORDER BY creationDate DESC');
  const curGame = await getCurrentLongGame();
  res.json({ unresolved, all, hasLongGame: !!curGame });
});

// GET /api/admin/meetings/:id/stats - Meeting attendance stats
router.get('/:id/stats', requireAdmin(1), async (req, res) => {
  const id = req.params.id;
  const players = await db.query(
    `SELECT ml.UID, ml.startState, u.fname, u.lname, u.uname
     FROM meeting_log ml LEFT JOIN users u ON ml.UID = u.UID
     WHERE ml.meetingID = ? ORDER BY ml.startState DESC`,
    [id]
  );
  const counts = {
    human: players.filter(p => p.startState === 1).length,
    zombie: players.filter(p => p.startState < 0 || p.startState === 2).length,
    moderator: players.filter(p => p.startState === 4).length,
    other: players.filter(p => p.startState === 0).length
  };
  res.json({ players, counts, total: players.length });
});

// POST /api/admin/meetings/signin - Sign player into meeting
router.post('/signin', requireAdmin(1), async (req, res) => {
  const { meetingSelect, playerID, state } = req.body;
  const user = await getUID(playerID);
  if (!user) return res.status(400).json({ error: 'Player not found' });

  const uid = user.UID;
  const stateNum = parseInt(state) || 0;

  // Check not already signed in
  const existing = await db.queryOne('SELECT COUNT(*) AS cnt FROM meeting_log WHERE meetingID = ? AND UID = ?', [meetingSelect, uid]);
  if (existing.cnt > 0) return res.status(400).json({ error: 'Player already signed in' });

  await db.execute('INSERT INTO meeting_log (meetingID, UID, startState) VALUES (?, ?, ?)', [meetingSelect, uid, stateNum]);

  // Update long game missions played if applicable
  const curGame = await getCurrentLongGame();
  if (curGame) {
    await db.execute('UPDATE long_players SET missionsPlayed = missionsPlayed + 1 WHERE playerID = ? AND gameID = ?', [uid, curGame.gameID]);
  }

  const waiverStatus = denumerate('waiverStatus', user.hasTurnedInWaiver);

  res.json({
    success: true,
    player: { fname: user.fname, lname: user.lname, uname: user.uname },
    waiverStatus
  });
});

// POST /api/admin/meetings/create - Create new meeting
router.post('/create', requireAdmin(1), async (req, res) => {
  const { meetingName, meetingType } = req.body;
  const typeMap = { admin: 1, mission: 0, other: 2, nominal: 3 };
  const typeNum = typeMap[meetingType] || 0;

  const prefix = typeNum === 0 ? '[Mission] ' : typeNum === 1 ? '[Community Meeting] ' : '';
  const fullName = prefix + meetingName;

  const meetingID = await require('../../services/ids').getNextHighestID('meeting_list', 'meetingID', 'MT');
  await db.execute(
    'INSERT INTO meeting_list (meetingID, meetingName, creationDate, meetingType) VALUES (?, ?, CURRENT_TIMESTAMP, ?)',
    [meetingID, fullName, typeNum]
  );

  const curGame = await getCurrentLongGame();
  if (curGame) {
    await db.execute('INSERT INTO long_meetings (gameID, meetingID) VALUES (?, ?)', [curGame.gameID, meetingID]);
  }

  res.json({ success: true, meetingID, meetingName: fullName });
});

// POST /api/admin/meetings/resolve - Resolve a meeting
router.post('/resolve', requireAdmin(1), async (req, res) => {
  const { meetingSelect, winner } = req.body;
  const winnerNum = parseInt(winner) || 0;

  const meeting = await db.queryOne('SELECT * FROM meeting_list WHERE meetingID = ?', [meetingSelect]);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  // Get all attendees
  const attendees = await db.query('SELECT * FROM meeting_log WHERE meetingID = ?', [meetingSelect]);

  for (const att of attendees) {
    const uid = att.UID;
    const st = att.startState;

    // Update total appearances
    await db.execute('UPDATE users SET appearancesTotal = appearancesTotal + 1, appearancesThisTerm = appearancesThisTerm + 1 WHERE UID = ?', [uid]);

    // Track sides
    if (st === 1) {
      await db.execute('UPDATE users SET humanStartsTotal = humanStartsTotal + 1, humanStartsThisTerm = humanStartsThisTerm + 1 WHERE UID = ?', [uid]);
    } else if (st < 0 || st === 2) {
      await db.execute('UPDATE users SET zombieStartsTotal = zombieStartsTotal + 1, zombieStartsThisTerm = zombieStartsThisTerm + 1 WHERE UID = ?', [uid]);
    } else if (st === 4) {
      await db.execute('UPDATE users SET gamesModdedTotal = gamesModdedTotal + 1, gamesModdedThisTerm = gamesModdedThisTerm + 1 WHERE UID = ?', [uid]);
    }

    if (meeting.meetingType === 1) {
      await db.execute('UPDATE users SET adminMeetingsTotal = adminMeetingsTotal + 1, adminMeetingsThisTerm = adminMeetingsThisTerm + 1 WHERE UID = ?', [uid]);
    }

    // Attendance achievements
    const user = await db.queryOne('SELECT appearancesTotal FROM users WHERE UID = ?', [uid]);
    if (user) {
      const total = user.appearancesTotal;
      if (total >= 5) try { await updateAchieves(uid, null, 'attendance0'); } catch (e) {}
      if (total >= 25) try { await updateAchieves(uid, null, 'attendance1'); } catch (e) {}
      if (total >= 50) try { await updateAchieves(uid, null, 'attendance2'); } catch (e) {}
      if (total >= 100) try { await updateAchieves(uid, null, 'attendance3'); } catch (e) {}
      if (total >= 250) try { await updateAchieves(uid, null, 'attendance4'); } catch (e) {}
    }
  }

  await db.execute('UPDATE meeting_list SET isResolved = 1, winner = ? WHERE meetingID = ?', [winnerNum, meetingSelect]);

  res.json({ success: true, attendeeCount: attendees.length });
});

module.exports = router;
