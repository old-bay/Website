#!/usr/bin/env node

// Seed a local MySQL database from CSV files exported from the live server.
//
// Usage:
//   node scripts/seed-from-csv.js [csv-directory]
//
// csv-directory defaults to ./seed-data
//
// Each CSV file must be named exactly like the table it corresponds to,
// e.g. users.csv, blog_posts.csv, achievements_new.csv.
//
// Export from the live database with:
//   mysqldump --tab=/tmp/hvz-export --fields-terminated-by=',' \
//     --fields-enclosed-by='"' --lines-terminated-by='\n' hvz
// Or use phpMyAdmin / MySQL Workbench "Export as CSV" per table.
//
// The script:
//   1. Reads config.txt for DB credentials (same as the app)
//   2. Disables foreign key checks
//   3. Truncates each table that has a matching CSV
//   4. Loads the CSV using LOAD DATA LOCAL INFILE
//   5. Re-enables foreign key checks

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const CONFIG_PATH = path.join(__dirname, '..', 'config.txt');
const DEFAULT_CSV_DIR = path.join(__dirname, '..', 'seed-data');

// Tables in safe insertion order (respects foreign keys)
const TABLE_ORDER = [
  'settings',
  'semesters',
  'users',
  'profilePictures',
  'meeting_list',
  'meeting_log',
  'long_games',
  'long_meetings',
  'long_players',
  'long_points',
  'blog_posts',
  'faq',
  'achievementFaq',
  'achievements_new',
  'userAchieveLink_new',
  'election_candidates',
  'election_votes',
  'mission_slides',
  'mission_slide_headings',
  'equipment',
  'poll_questions',
  'poll_options',
  'poll_votes',
];

function loadConfig() {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    config[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return config;
}

async function main() {
  const csvDir = process.argv[2] || DEFAULT_CSV_DIR;

  if (!fs.existsSync(csvDir)) {
    console.error(`CSV directory not found: ${csvDir}`);
    console.error('Create it and place your exported CSV files inside.');
    console.error('See DEV.md for instructions.');
    process.exit(1);
  }

  const config = loadConfig();
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: config.mysql_user,
    password: config.mysql_pass,
    database: config.mysql_db,
    charset: 'utf8mb4',
    multipleStatements: true,
    flags: ['LOCAL_FILES'],
  });

  // Find which CSV files are available
  const availableFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
  const availableTables = new Map();
  for (const file of availableFiles) {
    const table = path.basename(file, '.csv');
    availableTables.set(table, path.join(csvDir, file));
  }

  // Filter to known tables in order, then append any extras
  const ordered = TABLE_ORDER.filter(t => availableTables.has(t));
  for (const t of availableTables.keys()) {
    if (!ordered.includes(t)) ordered.push(t);
  }

  if (ordered.length === 0) {
    console.error(`No matching CSV files found in ${csvDir}`);
    console.error('Files should be named like: users.csv, blog_posts.csv, etc.');
    process.exit(1);
  }

  console.log(`Seeding ${ordered.length} table(s) from ${csvDir}\n`);

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of ordered) {
    const csvPath = availableTables.get(table);
    try {
      await conn.query(`TRUNCATE TABLE \`${table}\``);

      // Read CSV header to get column names
      const firstLine = fs.readFileSync(csvPath, 'utf-8').split('\n')[0].trim();
      const columns = firstLine.split(',').map(c =>
        '`' + c.replace(/^"|"$/g, '').trim() + '`'
      ).join(', ');

      await conn.query({
        sql: `LOAD DATA LOCAL INFILE ?
              INTO TABLE \`${table}\`
              FIELDS TERMINATED BY ','
              ENCLOSED BY '"'
              LINES TERMINATED BY '\\n'
              IGNORE 1 LINES
              (${columns})`,
        values: [csvPath],
        infileStreamFactory: () => fs.createReadStream(csvPath),
      });

      const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      console.log(`  ${table}: ${rows[0].cnt} rows`);
    } catch (err) {
      console.error(`  ${table}: FAILED - ${err.message}`);
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('\nDone.');
  await conn.end();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
