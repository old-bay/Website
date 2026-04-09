const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getCurrentLongGame, canVote, denumerate } = require('../services/gameState');
const { generateRandomID, KILL_CHARS } = require('../services/ids');
const { updateAchieves } = require('../services/achievements');

const upload = multer({
  dest: path.join(__dirname, '..', '..', 'images', 'profilePictures'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// GET /api/profile - Get current user's profile data
router.get('/', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const user = await db.queryOne('SELECT * FROM users WHERE UID = ?', [uid]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const curGame = await getCurrentLongGame();
  let longPlayer = null;
  if (curGame) {
    longPlayer = await db.queryOne('SELECT * FROM long_players WHERE gameID = ? AND playerID = ?', [curGame.gameID, uid]);
  }

  const votable = await canVote(uid);
  const waiverStatus = denumerate('waiverStatus', user.hasTurnedInWaiver);

  // Achievements
  const achievements = await db.query(
    `SELECT a.AID, a.name, a.description, a.class, a.alignment, a.image, l.isFavorite
     FROM userAchieveLink_new l JOIN achievements_new a ON l.AID = a.AID WHERE l.UID = ? ORDER BY a.class`,
    [uid]
  );

  res.json({
    fname: user.fname,
    lname: user.lname,
    uname: user.uname,
    email: user.email,
    isAdmin: user.isAdmin,
    isBetaTester: user.isBetaTester,
    ozOptIn: user.ozOptIn,
    ozParagraph: user.ozParagraph,
    canChangeName: user.canChangeName,
    canVote: votable,
    waiverStatus,
    stats: {
      appearancesThisTerm: user.appearancesThisTerm,
      appearancesLastTerm: user.appearancesLastTerm,
      appearancesTotal: user.appearancesTotal,
      zombieStartsThisTerm: user.zombieStartsThisTerm,
      zombieStartsTotal: user.zombieStartsTotal,
      humanStartsThisTerm: user.humanStartsThisTerm,
      humanStartsTotal: user.humanStartsTotal,
      gamesModdedThisTerm: user.gamesModdedThisTerm,
      gamesModdedTotal: user.gamesModdedTotal,
      adminMeetingsThisTerm: user.adminMeetingsThisTerm,
      adminMeetingsTotal: user.adminMeetingsTotal
    },
    longGame: curGame ? { title: curGame.title, gameID: curGame.gameID } : null,
    longPlayer: longPlayer ? { mainKill: longPlayer.mainKill, state: longPlayer.state } : null,
    achievements
  });
});

// POST /api/profile/oz - Update OZ preferences
router.post('/oz', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const { ozOpt, ozText } = req.body;
  const optIn = ozOpt === 'in' ? 1 : 0;
  const paragraph = (ozText || '').replace(/'/g, "\\'");
  await db.execute('UPDATE users SET ozOptIn = ?, ozParagraph = ? WHERE UID = ?', [optIn, paragraph, uid]);
  res.json({ success: true });
});

// POST /api/profile/idied - Report self as dead
router.post('/idied', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const curGame = await getCurrentLongGame();
  if (!curGame) return res.status(400).json({ error: 'No active long game' });

  const lp = await db.queryOne('SELECT * FROM long_players WHERE gameID = ? AND playerID = ?', [curGame.gameID, uid]);
  if (!lp || lp.state <= 0) return res.status(400).json({ error: 'Cannot use iDied' });

  if (lp.state === 2) {
    // OZ revealing: transfer kills from dummy to real account
    const dummyID = 'OZ' + uid.substring(2);
    const dummy = await db.queryOne('SELECT * FROM long_players WHERE gameID = ? AND playerID = ?', [curGame.gameID, dummyID]);
    if (dummy && dummy.kills > 0) {
      await db.execute('UPDATE long_players SET kills = kills + ? WHERE playerID = ? AND gameID = ?', [dummy.kills, uid, curGame.gameID]);
      await db.execute('UPDATE users SET lifetimeKills = lifetimeKills + ? WHERE UID = ?', [dummy.kills, uid]);
    }
    await db.execute('UPDATE long_players SET state = -2 WHERE playerID = ? AND gameID = ?', [uid, curGame.gameID]);
  } else {
    await db.execute('UPDATE long_players SET state = -1 WHERE playerID = ? AND gameID = ?', [uid, curGame.gameID]);
  }
  res.json({ success: true });
});

// POST /api/profile/beta - Update beta preference
router.post('/beta', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const optIn = req.body.betaOpt === 'in' ? 1 : 0;
  await db.execute('UPDATE users SET isBetaTester = ? WHERE UID = ?', [optIn, uid]);
  req.session.isBetaTester = optIn;
  res.json({ success: true });
});

// POST /api/profile/names - Update name/username
router.post('/names', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const user = await db.queryOne('SELECT canChangeName FROM users WHERE UID = ?', [uid]);
  if (!user || user.canChangeName === 0) return res.status(403).json({ error: 'Name change not allowed' });

  const alpha = /[^A-Za-z]/g;
  const alphaNum = /[^A-Za-z0-9_ -]/g;
  const updates = [];
  const params = [];

  if (req.body.new_uname) {
    const val = req.body.new_uname.replace(alphaNum, '');
    if (val) { updates.push('uname = ?'); params.push(val); }
  }
  if (req.body.new_fname) {
    const val = req.body.new_fname.replace(alpha, '');
    if (val) { updates.push('fname = ?'); params.push(val); }
  }
  if (req.body.new_lname) {
    const val = req.body.new_lname.replace(alpha, '');
    if (val) { updates.push('lname = ?'); params.push(val); }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No changes' });
  params.push(uid);
  await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE UID = ?`, params);
  res.json({ success: true });
});

// POST /api/profile/picture - Upload profile picture
router.post('/picture', requireLogin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const uid = req.session.uid;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = uid + ext;
  const destPath = path.join(__dirname, '..', '..', 'images', 'profilePictures', filename);

  // Remove old picture
  const old = await db.queryOne('SELECT picture FROM profilePictures WHERE UID = ?', [uid]);
  if (old) {
    const oldPath = path.join(__dirname, '..', '..', 'images', 'profilePictures', old.picture);
    try { fs.unlinkSync(oldPath); } catch (e) { /* ok */ }
    await db.execute('DELETE FROM profilePictures WHERE UID = ?', [uid]);
  }

  fs.renameSync(req.file.path, destPath);
  await db.execute('INSERT INTO profilePictures (UID, picture) VALUES (?, ?)', [uid, filename]);
  res.json({ success: true, picture: filename });
});

// POST /api/profile/favorite-achievement - Set favorite achievement
router.post('/favorite-achievement', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const { achieveId } = req.body;
  await db.execute('UPDATE userAchieveLink_new SET isFavorite = 0 WHERE UID = ? AND isFavorite = 1', [uid]);
  if (achieveId) {
    await db.execute('UPDATE userAchieveLink_new SET isFavorite = 1 WHERE UID = ? AND AID = ?', [uid, achieveId]);
  }
  res.json({ success: true });
});

module.exports = router;
