const db = require('../db');

async function getCurrentLongGame() {
  return db.queryOne('SELECT * FROM long_games WHERE CURRENT_TIMESTAMP < endDate AND CURRENT_TIMESTAMP > startDate LIMIT 1');
}

async function getNextLongGame() {
  return db.queryOne('SELECT * FROM long_games WHERE CURRENT_TIMESTAMP < endDate ORDER BY endDate DESC LIMIT 1');
}

async function getCurrentSemester() {
  return db.queryOne('SELECT * FROM semesters WHERE CURRENT_TIMESTAMP < endDate AND CURRENT_TIMESTAMP > startDate LIMIT 1');
}

async function getLastSemester() {
  return db.queryOne('SELECT * FROM semesters WHERE CURRENT_TIMESTAMP > endDate ORDER BY endDate DESC LIMIT 1');
}

async function getSettings() {
  const rows = await db.query('SELECT `key`, `value` FROM settings');
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

async function setSetting(key, value) {
  await db.execute('UPDATE settings SET `value` = ? WHERE `key` = ?', [value, key]);
  return getSettings();
}

function denumerate(enumName, number) {
  const maps = {
    waiverStatus: { 0: 'NOT CLEARED', 1: 'Cleared' },
    gameState: { '-3': 'Weeklong Player', '-2': 'OZ', '-1': 'Zombie', 0: 'Visitor', 1: 'Human', 2: 'Disguised OZ', 3: 'Medkit', 4: 'Moderator' },
    adminLevel: { 0: 'Non-Administrator', 1: 'Technical Subofficer', 2: 'Officer', 3: 'Web Committee' },
    meetingType: { 0: 'Mission', 1: 'Admin', 2: 'Other', 3: 'Nominal' },
    meetingWinner: { 0: 'Other', 1: 'Human', 2: 'Zombie' },
    weeklongModerator: { 0: 'Non-Administrator', 1: 'Secondary Moderator', 2: 'Officer/Primary Moderator', 3: 'Web Committee' }
  };
  const map = maps[enumName];
  if (!map) return null;
  return map[String(number)] || `UNABLE TO DENUMERATE VALUE ${number}`;
}

function getUID(playerID) {
  let emailVersion = playerID;
  if (!emailVersion.includes('@')) emailVersion += '@umbc.edu';
  return db.queryOne('SELECT * FROM users WHERE uname = ? OR email = ?', [playerID, emailVersion]);
}

function canVote(uid) {
  return db.queryOne('SELECT * FROM users WHERE UID = ?', [uid]).then(row => {
    if (!row) return false;
    return (row.appearancesThisTerm + row.appearancesLastTerm) >= 5;
  });
}

function secondsToHumanReadable(seconds) {
  let val = seconds;
  if (val < 60) {
    val = Math.floor(val);
    return val === 1 ? 'just a second ago' : `${val} seconds ago`;
  }
  val /= 60;
  if (val < 60) {
    val = Math.floor(val);
    return val === 1 ? 'a minute ago' : `${val} minutes ago`;
  }
  val /= 60;
  if (val < 24) {
    val = Math.floor(val);
    return val === 1 ? 'an hour ago' : `${val} hours ago`;
  }
  val /= 24;
  if (val < 30) {
    val = Math.floor(val);
    return val === 1 ? 'a day ago' : `${val} days ago`;
  }
  val /= 30;
  if (val < 12) {
    val = Math.floor(val);
    return val === 1 ? 'about a month ago' : `about ${val} months ago`;
  }
  val = Math.floor(val / 12);
  return val === 1 ? 'about a year ago' : `about ${val} years ago`;
}

module.exports = {
  getCurrentLongGame, getNextLongGame, getCurrentSemester, getLastSemester,
  getSettings, setSetting, denumerate, getUID, canVote, secondsToHumanReadable
};
