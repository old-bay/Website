const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/achievements - Get all achievements
router.get('/', async (req, res) => {
  const active = await db.query(
    "SELECT AID, name, description, class, alignment, image FROM achievements_new WHERE isHidden = 0 AND class != 'r' ORDER BY alignment"
  );
  const retired = await db.query(
    "SELECT AID, name, description, class, alignment, image FROM achievements_new WHERE isHidden = 0 AND class = 'r' ORDER BY alignment"
  );

  const classNames = { e: 'Basic', m: 'Recruit', h: 'Veteran', l: 'Legendary' };
  const alignNames = { h: 'Human', z: 'Zombie', n: 'Neutral', m: 'Moderator' };

  res.json({
    achievements: active.map(a => ({
      id: a.AID, name: a.name, description: a.description,
      className: classNames[a.class] || a.class,
      classCode: a.class,
      alignment: alignNames[a.alignment] || a.alignment,
      alignmentCode: a.alignment,
      image: a.image
    })),
    retired: retired.map(a => ({
      id: a.AID, name: a.name, description: a.description,
      alignment: alignNames[a.alignment] || a.alignment,
      alignmentCode: a.alignment,
      image: a.image
    }))
  });
});

module.exports = router;
