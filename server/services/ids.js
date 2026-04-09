const db = require('../db');

const KILL_CHARS = '3479QWERTYPAFHJKLXCNM';

// Generate a random 7-char ID with prefix, checking for uniqueness across tables
async function generateRandomID(tables, columns, prefix, characters) {
  if (!Array.isArray(tables)) tables = [tables];
  if (!Array.isArray(columns)) columns = [columns];

  while (true) {
    let str = prefix;
    while (str.length < 7) {
      str += characters[Math.floor(Math.random() * characters.length)];
    }

    let exists = false;
    for (const table of tables) {
      const whereParts = columns.map(col => `\`${col}\` = ?`);
      const params = columns.map(() => str);
      const row = await db.queryOne(
        `SELECT COUNT(*) AS cnt FROM \`${table}\` WHERE ${whereParts.join(' OR ')}`,
        params
      );
      if (row.cnt > 0) { exists = true; break; }
    }
    if (!exists) return str;
  }
}

// Generate a sequential ID (base-37: -, 0-9, a-z)
async function getNextHighestID(table, column, prefix) {
  const chars = ['-'];
  for (let i = 0; i <= 9; i++) chars.push(String(i));
  for (let i = 0; i < 26; i++) chars.push(String.fromCharCode(97 + i));

  const row = await db.queryOne(`SELECT MAX(\`${column}\`) AS maxId FROM \`${table}\``);
  if (!row.maxId) {
    return prefix + '0000-';
  }

  const id = row.maxId.slice(2).split('');
  let pos = 4;
  while (pos > -1) {
    const idx = chars.indexOf(id[pos]);
    if (idx < 36) {
      id[pos] = chars[idx + 1];
      break;
    } else {
      id[pos] = chars[0];
      pos--;
    }
  }
  return prefix + id.join('');
}

module.exports = { generateRandomID, getNextHighestID, KILL_CHARS };
