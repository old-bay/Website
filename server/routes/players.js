const express = require('express');
const router = express.Router();
const db = require('../db');
const { getCurrentLongGame, denumerate } = require('../services/gameState');

// GET /api/players - Get player list
router.get('/', async (req, res) => {
  const order = req.query.order || 'name';
  const curGame = await getCurrentLongGame();

  let orderClause;
  switch (order) {
    case 'kills': orderClause = 'u.lifetimeKills DESC'; break;
    case 'survived': orderClause = 'lp.longestDaySurvived DESC'; break;
    case 'creation': orderClause = 'u.UID ASC'; break;
    default: orderClause = 'u.fname ASC, u.lname ASC';
  }

  let players;
  if (curGame) {
    players = await db.query(
      `SELECT u.UID, u.fname, u.lname, u.uname, u.lifetimeKills,
              lp.state, lp.kills, lp.longestDaySurvived,
              pp.picture,
              a.name AS favAchieveName, a.image AS favAchieveImage
       FROM users u
       LEFT JOIN long_players lp ON u.UID = lp.playerID AND lp.gameID = ?
       LEFT JOIN profilePictures pp ON u.UID = pp.UID
       LEFT JOIN userAchieveLink_new ual ON u.UID = ual.UID AND ual.isFavorite = 1
       LEFT JOIN achievements_new a ON ual.AID = a.AID
       WHERE lp.playerID IS NOT NULL
       ORDER BY ${orderClause}`,
      [curGame.gameID]
    );

    // Counts
    const humanCount = await db.queryOne('SELECT COUNT(*) AS cnt FROM long_players WHERE state > 0 AND gameID = ?', [curGame.gameID]);
    const zombieCount = await db.queryOne('SELECT COUNT(*) AS cnt FROM long_players WHERE state < 0 AND gameID = ? AND playerID NOT LIKE ?', [curGame.gameID, 'OZ%']);

    res.json({
      activeLongGame: { title: curGame.title },
      humanCount: humanCount.cnt,
      zombieCount: zombieCount.cnt,
      players: players.map(p => ({
        uid: p.UID,
        fname: p.fname,
        lname: p.lname,
        uname: p.uname,
        state: denumerate('gameState', p.state),
        stateNum: p.state,
        kills: p.kills,
        lifetimeKills: p.lifetimeKills,
        longestDaySurvived: p.longestDaySurvived,
        picture: p.picture || 'anon.jpg',
        favAchieveName: p.favAchieveName,
        favAchieveImage: p.favAchieveImage
      }))
    });
  } else {
    players = await db.query(
      `SELECT u.UID, u.fname, u.lname, u.uname, u.lifetimeKills,
              pp.picture,
              a.name AS favAchieveName, a.image AS favAchieveImage
       FROM users u
       LEFT JOIN profilePictures pp ON u.UID = pp.UID
       LEFT JOIN userAchieveLink_new ual ON u.UID = ual.UID AND ual.isFavorite = 1
       LEFT JOIN achievements_new a ON ual.AID = a.AID
       ORDER BY ${orderClause}`
    );

    res.json({
      activeLongGame: null,
      players: players.map(p => ({
        uid: p.UID,
        fname: p.fname,
        lname: p.lname,
        uname: p.uname,
        lifetimeKills: p.lifetimeKills,
        picture: p.picture || 'anon.jpg',
        favAchieveName: p.favAchieveName,
        favAchieveImage: p.favAchieveImage
      }))
    });
  }
});

module.exports = router;
