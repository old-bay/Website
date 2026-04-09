const db = require('../db');
const { getCurrentSemester, getLastSemester } = require('./gameState');

async function updateAttendance(uid) {
  const thisSemester = await getCurrentSemester();
  const lastSemester = await getLastSemester();
  if (!thisSemester || !lastSemester) return;

  const tsStart = thisSemester.startDate;
  const lsStart = lastSemester.startDate;
  const lsEnd = lastSemester.endDate;

  const totalCount = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND meetingType != '3'", [uid]);
  const termCount = await db.queryOne(
    'SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND creationDate > ?', [uid, tsStart]);
  const lastTermCount = await db.queryOne(
    'SELECT COUNT(*) AS cnt FROM meeting_log WHERE UID = ? AND creationDate > ? AND creationDate < ?', [uid, lsStart, lsEnd]);
  const humanCount = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log WHERE UID = ? AND startState = '1'", [uid]);
  const zombieCount = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log WHERE UID = ? AND (startState < '0' OR startState = '2')", [uid]);
  const modCount = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log WHERE UID = ? AND startState = '4'", [uid]);
  const adminCount = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND meetingType = '1'", [uid]);
  const adminTerm = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND meetingType = '1' AND creationDate > ?", [uid, tsStart]);

  await db.execute('UPDATE users SET zombieStartsTotal=?, humanStartsTotal=?, gamesModdedTotal=?, adminMeetingsTotal=?, adminMeetingsThisTerm=?, appearancesTotal=?, appearancesThisTerm=?, appearancesLastTerm=? WHERE UID=?',
    [zombieCount.cnt, humanCount.cnt, modCount.cnt, adminCount.cnt, adminTerm.cnt, totalCount.cnt, termCount.cnt, lastTermCount.cnt, uid]);

  // Term-specific side counts
  const hTerm = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND startState = '1' AND creationDate > ? AND isResolved = '1'", [uid, tsStart]);
  const zTerm = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND (startState < '0' OR startState = '2') AND creationDate > ? AND isResolved = '1'", [uid, tsStart]);
  const mTerm = await db.queryOne(
    "SELECT COUNT(*) AS cnt FROM meeting_log NATURAL JOIN meeting_list WHERE UID = ? AND startState = '4' AND creationDate > ? AND isResolved = '1'", [uid, tsStart]);

  await db.execute('UPDATE users SET zombieStartsThisTerm=?, humanStartsThisTerm=?, gamesModdedThisTerm=? WHERE UID=?',
    [zTerm.cnt, hTerm.cnt, mTerm.cnt, uid]);
}

module.exports = { updateAttendance };
