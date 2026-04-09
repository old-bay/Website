const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');
const { getSettings, setSetting } = require('../../services/gameState');
const { sendMail } = require('../../services/email');

// POST /api/admin/voting/insert-bio
router.post('/insert-bio', requireAdmin(2), async (req, res) => {
  const { position, name, bio } = req.body;
  if (!position || !name || !bio) return res.status(400).json({ error: 'All fields required' });
  await db.execute('INSERT INTO election_candidates (position, name, bio) VALUES (?, ?, ?)', [position, name, bio]);
  res.json({ success: true });
});

// POST /api/admin/voting/insert-option
router.post('/insert-option', requireAdmin(2), async (req, res) => {
  const { position, candidate } = req.body;
  const settings = await getSettings();
  const nullUID = settings.nullUID || '';
  await db.execute('INSERT INTO election_votes (uid, position, voteFor) VALUES (?, ?, ?)', [nullUID, position, candidate]);
  res.json({ success: true });
});

// POST /api/admin/voting/settings
router.post('/settings', requireAdmin(2), async (req, res) => {
  const { writeInThreshold, showVotingLink, lockVoting } = req.body;
  if (writeInThreshold !== undefined) await setSetting('writeInThreshold', writeInThreshold);
  if (showVotingLink !== undefined) await setSetting('showVotingLink', showVotingLink);
  if (lockVoting !== undefined) await setSetting('lockVoting', lockVoting);
  res.json({ success: true });
});

// POST /api/admin/voting/clear-bios
router.post('/clear-bios', requireAdmin(2), async (req, res) => {
  await db.execute('DELETE FROM election_candidates');
  res.json({ success: true });
});

// POST /api/admin/voting/clear-votes
router.post('/clear-votes', requireAdmin(2), async (req, res) => {
  await db.execute('DELETE FROM election_votes');
  res.json({ success: true });
});

// POST /api/admin/voting/clear-election
router.post('/clear-election', requireAdmin(2), async (req, res) => {
  await setSetting('lockVoting', 'lock');
  await setSetting('showVotingLink', 'closed');
  await db.execute('DELETE FROM election_votes');
  await db.execute('DELETE FROM election_candidates');
  res.json({ success: true });
});

// POST /api/admin/voting/send-results
router.post('/send-results', requireAdmin(2), async (req, res) => {
  // Build results text
  const settings = await getSettings();
  const nullUID = settings.nullUID || '';
  const positions = await db.query('SELECT position FROM election_votes GROUP BY position ORDER BY position ASC');
  let body = '<h2>Election Results</h2>';

  for (const p of positions) {
    body += `<h3>${p.position}</h3><ul>`;
    const candidates = await db.query(
      'SELECT voteFor, COUNT(*) AS cnt FROM election_votes WHERE position = ? GROUP BY voteFor',
      [p.position]
    );
    for (const c of candidates) {
      body += `<li>${c.voteFor}: ${c.cnt - 1} votes</li>`;
    }
    body += '</ul>';
  }

  await sendMail('umbchvzofficers@gmail.com', 'UMBC HvZ Election Results', body);
  res.json({ success: true });
});

module.exports = router;
