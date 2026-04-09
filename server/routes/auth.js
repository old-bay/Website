const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { generateRandomID, KILL_CHARS } = require('../services/ids');
const { getNextHighestID } = require('../services/ids');
const { getCurrentLongGame } = require('../services/gameState');
const { updateAchieves } = require('../services/achievements');
const { sendMail } = require('../services/email');

// GET /api/auth/me - Get current user session info
router.get('/me', async (req, res) => {
  if (!req.session.uid) return res.json({ loggedIn: false });
  const user = await db.queryOne(
    'SELECT UID, fname, lname, uname, isAdmin, isLongGameAuthed, isBetaTester FROM users WHERE UID = ?',
    [req.session.uid]
  );
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ loggedIn: false });
  }
  const curGame = await getCurrentLongGame();
  let longPlayer = null;
  if (curGame) {
    longPlayer = await db.queryOne(
      'SELECT * FROM long_players WHERE gameID = ? AND playerID = ?',
      [curGame.gameID, req.session.uid]
    );
  }
  res.json({
    loggedIn: true,
    uid: user.UID,
    fname: user.fname,
    lname: user.lname,
    uname: user.uname,
    isAdmin: user.isAdmin,
    isLongGameAuthed: user.isLongGameAuthed,
    isBetaTester: user.isBetaTester,
    hasActiveLongGame: !!curGame,
    isRegisteredForLongGame: !!longPlayer
  });
});

// GET /api/auth/salt - Get a session salt for login
router.get('/salt', (req, res) => {
  const salt = crypto.randomUUID();
  req.session.salt = salt;
  res.json({ salt });
});

// POST /api/auth/login - Authenticate user
router.post('/login', async (req, res) => {
  const { username, hash } = req.body;
  if (!username || !hash || !req.session.salt) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const alphaNum = /[^A-Za-z0-9_ -]/g;
  const hexOnly = /[^a-f0-9]/g;
  const cleanUser = username.replace(alphaNum, '');
  const cleanHash = hash.replace(hexOnly, '');

  const row = await db.queryOne('SELECT passwd, UID, isAdmin, isLongGameAuthed, isBetaTester FROM users WHERE uname = ?', [cleanUser]);
  if (!row) {
    delete req.session.salt;
    return res.status(401).json({ error: 'Invalid login attempt.' });
  }

  const expected = crypto.createHash('sha256').update(req.session.salt + row.passwd).digest('hex');
  if (cleanHash !== expected) {
    delete req.session.salt;
    return res.status(401).json({ error: 'Invalid login attempt.' });
  }

  req.session.uid = row.UID;
  req.session.isAdmin = row.isAdmin;
  req.session.isLongGameAuthed = row.isLongGameAuthed;
  req.session.isBetaTester = row.isBetaTester;
  delete req.session.salt;

  res.json({ success: true, uid: row.UID, isAdmin: row.isAdmin });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fname, lname, email, username, password, tos } = req.body;
  const alpha = /[^A-Za-z]/g;
  const alphaNum = /[^A-Za-z0-9_ -]/g;

  const cleanFname = (fname || '').replace(alpha, '');
  const cleanLname = (lname || '').replace(alpha, '');
  const cleanUser = (username || '').replace(alphaNum, '');
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanFname || !cleanLname || !cleanEmail || !cleanUser || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!tos) {
    return res.status(400).json({ error: 'You must agree to the Terms of Service.' });
  }

  // Check uniqueness
  const uCheck = await db.queryOne('SELECT COUNT(*) AS cnt FROM users WHERE uname = ?', [cleanUser]);
  if (uCheck.cnt > 0) return res.status(400).json({ error: 'Username already taken.' });
  const eCheck = await db.queryOne('SELECT COUNT(*) AS cnt FROM users WHERE email = ?', [cleanEmail]);
  if (eCheck.cnt > 0) return res.status(400).json({ error: 'Email already registered.' });

  const uid = await getNextHighestID('users', 'UID', 'US');
  const hashedPass = crypto.createHash('sha256').update(password).digest('hex');
  const publicQR = await generateRandomID('users', 'publicQR', 'QR', KILL_CHARS);

  await db.execute(
    'INSERT INTO users (UID, fname, lname, uname, passwd, email, publicQR) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uid, cleanFname, cleanLname, cleanUser, hashedPass, cleanEmail, publicQR]
  );

  try { await updateAchieves(uid, null, 'registered'); } catch (e) { /* non-critical */ }

  req.session.uid = uid;
  req.session.isAdmin = 0;
  res.json({ success: true, uid });
});

// POST /api/auth/recover - Request password reset
router.post('/recover', async (req, res) => {
  const { username, email } = req.body;
  let user;
  if (username) {
    user = await db.queryOne('SELECT email, uname FROM users WHERE uname = ?', [username]);
  } else if (email) {
    user = await db.queryOne('SELECT email, uname FROM users WHERE email = ?', [email]);
  }
  if (!user) return res.status(404).json({ error: 'Account not found.' });

  const code = 'PW' + Array.from({ length: 5 }, () => KILL_CHARS[Math.floor(Math.random() * KILL_CHARS.length)]).join('');
  await db.execute('UPDATE users SET pwResetCode = ?, pwResetTime = CURRENT_TIMESTAMP WHERE email = ?', [code, user.email]);

  const link = `${req.protocol}://${req.get('host')}/password-recovery?code=${code}`;
  await sendMail(user.email, 'UMBC HvZ Password Recovery',
    `<p>A password reset was requested for username <strong>${user.uname}</strong>.</p>` +
    `<p>Your reset code is: <strong>${code}</strong></p>` +
    `<p>Or click: <a href="${link}">${link}</a></p>` +
    `<p>This code expires in 15 minutes.</p>`
  );
  res.json({ success: true, message: 'Recovery email sent.' });
});

// POST /api/auth/reset - Reset password with code
router.post('/reset', async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) return res.status(400).json({ error: 'Code and password required.' });

  const row = await db.queryOne(
    'SELECT uname, TIMESTAMPDIFF(MINUTE, pwResetTime, NOW()) AS minutes FROM users WHERE pwResetCode = ?',
    [code]
  );
  if (!row) return res.status(400).json({ error: 'Invalid reset code.' });
  if (row.minutes > 15) return res.status(400).json({ error: 'Reset code expired.' });

  const hashedPass = crypto.createHash('sha256').update(password).digest('hex');
  await db.execute('UPDATE users SET passwd = ?, pwResetCode = NULL, pwResetTime = NULL WHERE pwResetCode = ?',
    [hashedPass, code]);
  res.json({ success: true });
});

module.exports = router;
