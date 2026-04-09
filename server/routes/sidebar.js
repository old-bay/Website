const express = require('express');
const router = express.Router();
const db = require('../db');
const { getSettings } = require('../services/gameState');

// GET /api/sidebar - Get sidebar data (voting link, slides)
router.get('/', async (req, res) => {
  const settings = await getSettings();

  // Voting link status
  const voteLink = settings.showVotingLink || 'closed';

  // Mission slides
  const mainHeading = await db.queryOne("SELECT headingName FROM mission_slide_headings WHERE headingTitle = 'mainHeading'");
  const firstHeading = await db.queryOne("SELECT headingName FROM mission_slide_headings WHERE headingTitle = 'firstSlides'");
  const secondHeading = await db.queryOne("SELECT headingName FROM mission_slide_headings WHERE headingTitle = 'secondSlides'");
  const thirdHeading = await db.queryOne("SELECT headingName FROM mission_slide_headings WHERE headingTitle = 'thirdSlides'");

  const mondaySlides = await db.queryOne("SELECT url, startingSlideNumber FROM mission_slides WHERE name = 'mondayMission'");
  const thursdaySlides = await db.queryOne("SELECT url, startingSlideNumber FROM mission_slides WHERE name = 'thursdayMission'");
  const pointSlides = await db.queryOne("SELECT url, startingSlideNumber FROM mission_slides WHERE name = 'pointSlide'");

  const slides = {
    mainHeading: mainHeading ? mainHeading.headingName : 'Mission Slides',
    first: {
      heading: firstHeading ? firstHeading.headingName : '',
      url: mondaySlides ? `${mondaySlides.url}embed?start=false&loop=false&delayms=10000&slide=${mondaySlides.startingSlideNumber}` : ''
    },
    second: {
      heading: secondHeading ? secondHeading.headingName : '',
      url: thursdaySlides ? `${thursdaySlides.url}embed?start=false&loop=false&delayms=10000&slide=${thursdaySlides.startingSlideNumber}` : ''
    }
  };

  if (thirdHeading && thirdHeading.headingName) {
    slides.third = {
      heading: thirdHeading.headingName,
      url: pointSlides ? `${pointSlides.url}embed?start=false&loop=false&delayms=10000&slide=${pointSlides.startingSlideNumber}` : ''
    };
  }

  // Active poll
  let poll = null;
  const activeQ = await db.queryOne("SELECT * FROM poll_questions WHERE isActive = 1 AND isOpen = 1 LIMIT 1");
  if (activeQ) {
    const options = await db.query('SELECT * FROM poll_options WHERE QID = ?', [activeQ.QID]);
    let userVote = null;
    if (req.session && req.session.uid) {
      const v = await db.queryOne('SELECT optionID FROM poll_votes WHERE QID = ? AND UID = ?', [activeQ.QID, req.session.uid]);
      if (v) userVote = v.optionID;
    }
    poll = { question: activeQ.question, qid: activeQ.QID, options, userVote };
  }

  res.json({ voteLink, slides, poll });
});

// POST /api/sidebar/poll-vote - Vote on a poll
router.post('/poll-vote', async (req, res) => {
  if (!req.session.uid) return res.status(401).json({ error: 'Not logged in' });
  const { qid, optionID } = req.body;
  // Remove old vote
  await db.execute('DELETE FROM poll_votes WHERE QID = ? AND UID = ?', [qid, req.session.uid]);
  // Insert new
  await db.execute('INSERT INTO poll_votes (QID, UID, optionID) VALUES (?, ?, ?)', [qid, req.session.uid, optionID]);
  res.json({ success: true });
});

module.exports = router;
