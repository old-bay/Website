const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// GET /api/admin/polls
router.get('/', requireAdmin(2), async (req, res) => {
  const questions = await db.query('SELECT * FROM poll_questions ORDER BY QID DESC');
  res.json(questions);
});

// POST /api/admin/polls/question - Create question
router.post('/question', requireAdmin(2), async (req, res) => {
  const { question } = req.body;
  await db.execute('INSERT INTO poll_questions (question, isOpen, isActive) VALUES (?, 1, 0)', [question]);
  res.json({ success: true });
});

// POST /api/admin/polls/option - Add option to question
router.post('/option', requireAdmin(2), async (req, res) => {
  const { qid, option } = req.body;
  await db.execute('INSERT INTO poll_options (QID, `option`) VALUES (?, ?)', [qid, option]);
  res.json({ success: true });
});

// POST /api/admin/polls/set-active - Set active question
router.post('/set-active', requireAdmin(2), async (req, res) => {
  const { qid } = req.body;
  await db.execute('UPDATE poll_questions SET isActive = 0 WHERE 1');
  await db.execute('UPDATE poll_questions SET isActive = 1 WHERE QID = ?', [qid]);
  res.json({ success: true });
});

// GET /api/admin/polls/:qid/results - View poll results
router.get('/:qid/results', requireAdmin(2), async (req, res) => {
  const options = await db.query(
    `SELECT po.optionID, po.option, COUNT(pv.UID) AS votes
     FROM poll_options po LEFT JOIN poll_votes pv ON po.optionID = pv.optionID
     WHERE po.QID = ? GROUP BY po.optionID`,
    [req.params.qid]
  );
  res.json(options);
});

module.exports = router;
