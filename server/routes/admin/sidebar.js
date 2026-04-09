const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

// Slide options map
const slideOptions = {
  hvz101: 'https://docs.google.com/presentation/d/1R4RiQqsqLRPEX4hbTqFmzREKSyLFVEHc6DGRNb9tF3Y/edit',
  hvz102: 'https://docs.google.com/presentation/d/1nCIUvMxb6sW5OZ0TJDVhVnOe5KyQSWzKz_Q5Kf1rjmA/edit',
  hvz202: 'https://docs.google.com/presentation/d/17EZ5k52b9MN0kXs1ZqB7oTjMbXnPh0rEDuLnXhg5G9Y/edit',
  underConstruction: 'https://docs.google.com/presentation/d/1JGf2f1cC5t2Dqe5xFM3r1mN5PwCPpMo5Bz0m1yVj_4k/edit',
  endOfSemester: 'https://docs.google.com/presentation/d/1_3x5XqHpLR_eH2gYGl9T_bT8LFQcQj7VCpPCh2PXkJc/edit',
  fiveNight: 'https://docs.google.com/presentation/d/1Hn1Z3X5VYx8rl5x0sQqLzq_XF0VL6RhqVb_1cKMt5Bs/edit'
};

// POST /api/admin/sidebar/slides - Update slide settings
router.post('/slides', requireAdmin(2), async (req, res) => {
  const { slot, slideKey, customUrl, startSlide } = req.body;
  const slotMap = { first: 'mondayMission', second: 'thursdayMission', third: 'pointSlide' };
  const name = slotMap[slot];
  if (!name) return res.status(400).json({ error: 'Invalid slot' });

  const url = customUrl || slideOptions[slideKey] || '';
  await db.execute('UPDATE mission_slides SET url = ?, startingSlideNumber = ? WHERE name = ?',
    [url, startSlide || '', name]);
  res.json({ success: true });
});

// POST /api/admin/sidebar/headings - Update slide headings
router.post('/headings', requireAdmin(2), async (req, res) => {
  const { mainHeading, firstSlides, secondSlides, thirdSlides } = req.body;
  if (mainHeading !== undefined) await db.execute("UPDATE mission_slide_headings SET headingName = ? WHERE headingTitle = 'mainHeading'", [mainHeading]);
  if (firstSlides !== undefined) await db.execute("UPDATE mission_slide_headings SET headingName = ? WHERE headingTitle = 'firstSlides'", [firstSlides]);
  if (secondSlides !== undefined) await db.execute("UPDATE mission_slide_headings SET headingName = ? WHERE headingTitle = 'secondSlides'", [secondSlides]);
  if (thirdSlides !== undefined) {
    const val = thirdSlides === 'IGNORE' ? null : thirdSlides;
    await db.execute("UPDATE mission_slide_headings SET headingName = ? WHERE headingTitle = 'thirdSlides'", [val]);
  }
  res.json({ success: true });
});

module.exports = router;
