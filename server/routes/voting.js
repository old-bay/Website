const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getSettings, canVote } = require('../services/gameState');

// GET /api/voting - Get voting data
router.get('/', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const settings = await getSettings();
  const isVotable = await canVote(uid);

  if (settings.lockVoting === 'lock') {
    return res.json({ status: 'locked', canVote: isVotable });
  }

  // Get candidates with bios
  const candidates = await db.query('SELECT * FROM election_candidates ORDER BY position, name');

  // Get positions with voting options
  const positions = await db.query(
    'SELECT position, voteFor AS name FROM election_votes GROUP BY position, voteFor ORDER BY position ASC'
  );

  // Get current user votes
  const myVotes = await db.query(
    'SELECT position, voteFor FROM election_votes WHERE uid = ?', [uid]
  );

  // Build results if admin
  let results = null;
  if (req.session.isAdmin >= 2) {
    results = await buildVotingResults(settings);
  }

  res.json({
    status: settings.showVotingLink || 'closed',
    locked: settings.lockVoting === 'lock',
    canVote: isVotable,
    writeInThreshold: parseInt(settings.writeInThreshold) || 0,
    candidates,
    positions: groupPositions(positions),
    myVotes: myVotes.reduce((acc, v) => { acc[v.position] = v.voteFor; return acc; }, {}),
    results
  });
});

// POST /api/voting/vote - Cast votes
router.post('/vote', requireLogin, async (req, res) => {
  const uid = req.session.uid;
  const settings = await getSettings();

  if (settings.lockVoting === 'lock') return res.status(403).json({ error: 'Voting is locked' });
  if (!(await canVote(uid))) return res.status(403).json({ error: 'You are not eligible to vote' });

  const { votes } = req.body; // { position: candidate }
  if (!votes || typeof votes !== 'object') return res.status(400).json({ error: 'Invalid votes' });

  for (const [position, candidate] of Object.entries(votes)) {
    // Remove existing vote for this position
    await db.execute('DELETE FROM election_votes WHERE uid = ? AND position = ?', [uid, position]);
    // Insert new vote
    if (candidate) {
      await db.execute('INSERT INTO election_votes (uid, position, voteFor) VALUES (?, ?, ?)',
        [uid, position, candidate]);
    }
  }

  res.json({ success: true });
});

function groupPositions(rows) {
  const map = {};
  for (const r of rows) {
    if (!map[r.position]) map[r.position] = [];
    map[r.position].push(r.name);
  }
  return map;
}

async function buildVotingResults(settings) {
  const nullUID = settings.nullUID || '';
  const positions = await db.query('SELECT position FROM election_votes GROUP BY position ORDER BY position ASC');
  const results = {};

  for (const p of positions) {
    const pos = p.position;
    const candidates = await db.query(
      'SELECT voteFor, COUNT(*) AS cnt FROM election_votes WHERE position = ? GROUP BY voteFor',
      [pos]
    );
    results[pos] = candidates.map(c => ({
      name: c.voteFor,
      votes: c.cnt - (candidates.some(x => x.voteFor === c.voteFor) ? 1 : 0) // Subtract dummy vote
    }));
  }

  const voters = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM (SELECT uid FROM election_votes WHERE uid != ? AND uid != '' GROUP BY uid) AS v",
    [nullUID]
  );

  return { positions: results, totalVoters: voters ? voters.cnt : 0 };
}

module.exports = router;
