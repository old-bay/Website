const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');
const { getUID } = require('../../services/gameState');

// POST /api/admin/equipment/return
router.post('/return', requireAdmin(2), async (req, res) => {
  const { equipmentID } = req.body;
  const equip = await db.queryOne(
    `SELECT e.EID, CONCAT(u.fname, ' ', u.lname) AS name, e.loanedTo
     FROM equipment e LEFT JOIN users u ON e.loanedTo = u.UID WHERE e.EID = ?`,
    [equipmentID]
  );
  if (!equip) return res.status(404).json({ error: 'Equipment not found' });

  await db.execute("UPDATE equipment SET loanedTo = 'IHAVEIT' WHERE EID = ?", [equipmentID]);
  res.json({ success: true, previousOwner: equip.name });
});

// GET /api/admin/equipment/status/:id
router.get('/status/:id', requireAdmin(2), async (req, res) => {
  const equip = await db.queryOne(
    `SELECT e.EID, CONCAT(u.fname, ' ', u.lname) AS name, e.loanedTo
     FROM equipment e LEFT JOIN users u ON e.loanedTo = u.UID WHERE e.EID = ?`,
    [req.params.id]
  );
  if (!equip) return res.status(404).json({ error: 'Equipment not found' });
  res.json(equip);
});

// GET /api/admin/equipment/player/:playerID
router.get('/player/:playerID', requireAdmin(2), async (req, res) => {
  const user = await getUID(req.params.playerID);
  if (!user) return res.status(404).json({ error: 'Player not found' });
  const items = await db.query('SELECT EID FROM equipment WHERE loanedTo = ?', [user.UID]);
  res.json({ player: user.uname, items });
});

module.exports = router;
