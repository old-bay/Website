const db = require('../db');
const { sendMail } = require('./email');

async function hasAchieve(aid, uid) {
  const row = await db.queryOne('SELECT COUNT(*) AS cnt FROM userAchieveLink_new WHERE AID = ? AND UID = ?', [aid, uid]);
  return row.cnt === 1;
}

async function giveAchieve(aid, uid) {
  if (await hasAchieve(aid, uid)) return 0;
  await db.execute('INSERT INTO userAchieveLink_new (AID, UID) VALUES (?, ?)', [aid, uid]);
  const achieve = await db.queryOne('SELECT name FROM achievements_new WHERE AID = ?', [aid]);
  const user = await db.queryOne('SELECT email FROM users WHERE UID = ?', [uid]);
  if (achieve && user) {
    sendMail(user.email, `Achievement "${achieve.name}" Awarded`,
      `Congratulations! You have been awarded the achievement ${achieve.name}! ` +
      `To set this as your displayed achievement, go to your profile page.`);
  }
  return 1;
}

async function quietGiveAchieve(aid, uid) {
  if (!(await hasAchieve(aid, uid))) {
    await db.execute('INSERT INTO userAchieveLink_new (AID, UID) VALUES (?, ?)', [aid, uid]);
  }
}

async function takeAchieve(aid, uid) {
  if (await hasAchieve(aid, uid)) {
    await db.execute('DELETE FROM userAchieveLink_new WHERE UID = ? AND AID = ?', [uid, aid]);
  }
}

async function getAidByKey(key) {
  const row = await db.queryOne('SELECT AID FROM achievements_new WHERE `key` = ?', [key]);
  return row ? row.AID : null;
}

// Achievement event handlers mapped by key
const handlers = {
  async specialMission(uid, event) {
    if (event !== 'specialMission') return;
    const aid = await getAidByKey('holidayCheer');
    if (aid) await giveAchieve(aid, uid);
  },
  async zbashMission(uid, event) {
    if (event !== 'zbashMission') return;
    const aid = await getAidByKey('2Spooky');
    if (aid) await giveAchieve(aid, uid);
  },
  async holidayMission(uid, event) {
    if (event !== 'holidayMission') return;
    const aid = await getAidByKey('holidayCheer');
    if (aid) await giveAchieve(aid, uid);
  },
  async patientZero(uid, event) {
    if (event !== 'patientZero') return;
    const aid = await getAidByKey('patientZero');
    if (aid) await giveAchieve(aid, uid);
  },
  async membership(uid, event) {
    if (event !== 'attendance0') return;
    const aid = await getAidByKey('membership');
    if (aid) await giveAchieve(aid, uid);
  },
  async experienced(uid, event) {
    if (event !== 'attendance1') return;
    const aid = await getAidByKey('experienced');
    if (aid) await giveAchieve(aid, uid);
  },
  async warVet(uid, event) {
    if (event !== 'attendance2') return;
    const aid = await getAidByKey('warVet');
    if (aid) await giveAchieve(aid, uid);
  },
  async warExpert(uid, event) {
    if (event !== 'attendance3') return;
    const aid = await getAidByKey('warExpert');
    if (aid) await giveAchieve(aid, uid);
  },
  async warMaster(uid, event) {
    if (event !== 'attendance4') return;
    const aid = await getAidByKey('warMaster');
    if (aid) await giveAchieve(aid, uid);
  },
  async idRatherDie(uid, event) {
    if (event !== 'attendanceZ1') return;
    const aid = await getAidByKey('idRatherDie');
    if (aid) await giveAchieve(aid, uid);
  },
  async liveLaughStun(uid, event) {
    if (event !== 'attendanceH1') return;
    const aid = await getAidByKey('liveLaughStun');
    if (aid) await giveAchieve(aid, uid);
  },
  async moderationMachine(uid, event) {
    if (event !== 'attendanceM1') return;
    const aid = await getAidByKey('moderationMachine');
    if (aid) await giveAchieve(aid, uid);
  },
  async communityConcious(uid, event) {
    if (event !== 'attendanceC1') return;
    const aid = await getAidByKey('communityConcious');
    if (aid) await giveAchieve(aid, uid);
  },
  async growingHorde(uid, event) {
    if (event !== 'madeKill' && event !== 'all') return;
    const aid = await getAidByKey('growingHorde');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const p = await db.queryOne('SELECT kills FROM long_players WHERE playerID = ? AND gameID = ?', [uid, game.gameID]);
    if (p && p.kills >= 1) await giveAchieve(aid, uid);
  },
  async expertHunter(uid, event) {
    if (event !== 'madeKill' && event !== 'all') return;
    const aid = await getAidByKey('expertHunter');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const p = await db.queryOne('SELECT kills FROM long_players WHERE playerID = ? AND gameID = ?', [uid, game.gameID]);
    if (p && p.kills >= 3) await giveAchieve(aid, uid);
  },
  async angelOfDeath(uid, event) {
    if (event !== 'madeKill' && event !== 'all') return;
    const aid = await getAidByKey('angelOfDeath');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const p = await db.queryOne('SELECT kills FROM long_players WHERE playerID = ? AND gameID = ?', [uid, game.gameID]);
    if (p && p.kills >= 10) await giveAchieve(aid, uid);
  },
  async noCigar(uid, event) {
    if (event !== 'killed' && event !== 'all') return;
    const aid = await getAidByKey('noCigar');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const start = await db.queryOne('SELECT startDate FROM long_games WHERE gameID = ?', [game.gameID]);
    if (!start) return;
    const now = await db.queryOne('SELECT CURRENT_TIMESTAMP AS now');
    const diff = Math.abs(new Date(now.now) - new Date(start.startDate)) / 1000;
    if (diff >= 345600 && diff <= 432000) await giveAchieve(aid, uid);
  },
  async reportForDuty(uid, event) {
    if (event !== 'registered') return;
    const aid = await getAidByKey('reportForDuty');
    if (aid) await quietGiveAchieve(aid, uid);
  },
  async firstBlood(uid, event) {
    if (event !== 'killed' && event !== 'all') return;
    const aid = await getAidByKey('firstBlood');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const dead = await db.queryOne('SELECT COUNT(*) AS cnt FROM long_players WHERE state = -1 AND gameID = ?', [game.gameID]);
    if (dead.cnt === 1) await giveAchieve(aid, uid);
  },
  async alphaPred(uid, event) {
    if (event !== 'gameEnd') return;
    const aid = await getAidByKey('alphaPred');
    if (!aid) return;
    const game = await db.queryOne('SELECT MAX(gameID) AS gameID FROM long_games');
    if (!game.gameID) return;
    const max = await db.queryOne('SELECT MAX(kills) AS kills FROM long_players WHERE gameID = ?', [game.gameID]);
    if (!max || max.kills < 3) return;
    const rows = await db.query('SELECT playerID FROM long_players WHERE kills = ? AND gameID = ?', [max.kills, game.gameID]);
    for (const row of rows) await giveAchieve(aid, row.playerID);
  },
  async actuallyOZ(uid, event) {
    if (event !== 'madeOZ') return;
    const aid = await getAidByKey('actuallyOZ');
    if (aid) await quietGiveAchieve(aid, uid);
  },
  async playingTheLongGame(uid, event) {
    if (event !== 'longRegister') return;
    const aid = await getAidByKey('playingLongGame');
    if (aid) await giveAchieve(aid, uid);
  }
};

// Run all auto-update achievement checks for a given event
async function updateAchieves(uid, gameID, event) {
  // Get all auto-achievements from DB and run their handlers
  const rows = await db.query('SELECT updateFunction FROM achievements_new WHERE isAuto = 1');
  for (const row of rows) {
    // The updateFunction column stores something like "functionName('[[UID]]', '[[EVENT]]')"
    // Extract the function name
    const match = row.updateFunction.match(/^(\w+)\s*\(/);
    if (match && handlers[match[1]]) {
      try {
        await handlers[match[1]](uid, event);
      } catch (e) {
        console.error(`Achievement handler ${match[1]} error:`, e);
      }
    }
  }
}

async function updateState(uid, gameID) {
  const row = await db.queryOne(
    'SELECT state, cachedDeathTime, CURRENT_TIMESTAMP AS now FROM long_players WHERE playerID = ? AND gameID = ?',
    [uid, gameID]
  );
  if (!row) return null;
  if (row.state !== 0 && row.state !== 3 && row.cachedDeathTime && row.cachedDeathTime !== '0000-00-00 00:00:00') {
    if (new Date(row.cachedDeathTime) < new Date(row.now)) {
      await db.execute('UPDATE long_players SET state = 0 WHERE playerID = ? AND gameID = ?', [uid, gameID]);
      return 0;
    }
  }
  return row.state;
}

module.exports = {
  hasAchieve, giveAchieve, quietGiveAchieve, takeAchieve,
  updateAchieves, updateState, getAidByKey
};
