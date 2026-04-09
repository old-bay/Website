const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.debug === 'true' ? 'umbchvz.com' : 'localhost',
  user: config.mysql_user,
  password: config.mysql_pass,
  database: config.mysql_db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// Helper: execute query, return all rows
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Helper: execute query, return first row or null
async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Helper: execute INSERT/UPDATE/DELETE, return result info
async function execute(sql, params) {
  const [result] = await pool.execute(sql, params);
  return result;
}

// Get raw pool for transactions
function getPool() {
  return pool;
}

module.exports = { query, queryOne, execute, getPool };
