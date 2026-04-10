# Local Development Setup

How to get a working copy of the site running on your own machine, seeded with
data exported from the live database.

---

## Prerequisites

| Tool    | Version | Install |
|---------|---------|---------|
| Node.js | 18+     | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| MySQL   | 5.7+    | `sudo apt install mysql-server` / `brew install mysql` / [MySQL Installer (Windows)](https://dev.mysql.com/downloads/installer/) |
| Git     | any     | `sudo apt install git` / `brew install git` |

---

## 1. Clone the repository

```bash
git clone https://github.com/old-bay/Website.git
cd Website
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create a local MySQL database

Start MySQL and open a shell:

```bash
# Linux
sudo systemctl start mysql
sudo mysql

# macOS (Homebrew)
brew services start mysql
mysql -u root

# Windows — open MySQL Command Line Client from the Start menu
```

Inside the MySQL shell:

```sql
CREATE DATABASE hvz_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'hvzdev'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON hvz_dev.* TO 'hvzdev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> Using `ALL PRIVILEGES` is fine for local dev. The production guide (SETUP.md)
> uses minimal grants.

---

## 4. Create the tables

The full schema is in SETUP.md under "Create Database Tables". Copy the SQL block
from that section into a file and run it:

```bash
mysql -u hvzdev -pdevpassword hvz_dev < /path/to/schema.sql
```

Or paste it directly into a MySQL shell connected to `hvz_dev`.

---

## 5. Create your config file

Create `config.txt` in the project root (this file is gitignored):

```
debug=0
mysql_user=hvzdev
mysql_pass=devpassword
mysql_db=hvz_dev
session_secret=local-dev-secret-anything-works
```

| Key              | Value for local dev |
|------------------|---------------------|
| `debug`          | `0` (connects to localhost) |
| `mysql_user`     | The user from step 3 |
| `mysql_pass`     | The password from step 3 |
| `mysql_db`       | `hvz_dev` |
| `session_secret` | Any string — doesn't matter locally |

---

## 6. Export data from the live database

On the **production server** (or any machine with access to the live DB), export
each table as a CSV file. You have several options:

### Option A: MySQL command line

```bash
# SSH into the production server, then for each table:
mysql -u hvzUser -p hvz -e "
  SELECT * FROM users
" | sed 's/\t/","/g; s/^/"/; s/$/"/' > users.csv
```

Or use `INTO OUTFILE` (requires MySQL file permissions):

```sql
SELECT * FROM users
INTO OUTFILE '/tmp/users.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Option B: mysqldump with CSV format

```bash
mysqldump --tab=/tmp/hvz-export \
  --fields-terminated-by=',' \
  --fields-enclosed-by='"' \
  --lines-terminated-by='\n' \
  -u hvzUser -p hvz
```

This creates one `.sql` (schema) and one `.txt` (data) file per table. Rename
the `.txt` files to `.csv`.

### Option C: MySQL Workbench / phpMyAdmin

1. Open the table
2. Export as CSV
3. Make sure "Include column headers" is checked

### Required format

Each CSV file must:

- Be named exactly like its table: `users.csv`, `blog_posts.csv`,
  `achievements_new.csv`, etc.
- Have a **header row** with column names as the first line
- Use commas as delimiters and double-quotes around fields

Example `settings.csv`:

```csv
"key","value"
"showVotingLink","closed"
"lockVoting","lock"
"TOS","Terms of Service text goes here."
```

### Tables to export

Export whichever tables you need. The seed script handles partial sets — you
don't have to export every table. At minimum, export these for a functional site:

| Table | Why |
|-------|-----|
| `settings` | Site configuration (required for the app to work) |
| `users` | User accounts and stats |
| `semesters` | Current semester (attendance tracking) |
| `achievements_new` | Achievement definitions |
| `faq` | FAQ page content |
| `blog_posts` | News page content |
| `mission_slides` | Sidebar slides |
| `mission_slide_headings` | Sidebar headings |

Full list of all tables:

```
settings                 semesters               users
profilePictures          meeting_list            meeting_log
long_games               long_meetings           long_players
long_points              blog_posts              faq
achievementFaq           achievements_new        userAchieveLink_new
election_candidates      election_votes          mission_slides
mission_slide_headings   equipment               poll_questions
poll_options             poll_votes
```

---

## 7. Seed your local database

Place the CSV files in a `seed-data/` folder at the project root (this directory
is gitignored):

```
Website/
├── seed-data/
│   ├── settings.csv
│   ├── users.csv
│   ├── semesters.csv
│   ├── achievements_new.csv
│   ├── blog_posts.csv
│   ├── faq.csv
│   ├── mission_slides.csv
│   ├── mission_slide_headings.csv
│   └── ...any other tables
├── config.txt
├── package.json
└── ...
```

Run the seed script:

```bash
npm run seed
```

Or specify a different directory:

```bash
node scripts/seed-from-csv.js /path/to/csv-folder
```

You should see output like:

```
Seeding 8 table(s) from ./seed-data

  settings: 6 rows
  semesters: 1 rows
  users: 142 rows
  achievements_new: 28 rows
  blog_posts: 15 rows
  faq: 7 rows
  mission_slides: 3 rows
  mission_slide_headings: 4 rows

Done.
```

> You can re-run `npm run seed` any time to reset the database to the CSV state.
> It truncates each table before loading.

---

## 8. Start the dev server

```bash
npm run dev
```

This starts Express on `http://localhost:3000` with automatic restart on file
changes (Node.js `--watch` mode).

Open `http://localhost:3000` in your browser.

---

## 9. Log in

Use any account from the `users` table. Remember the auth flow:

- The DB stores `SHA256(plaintext_password)`
- The client hashes the password before sending

If you need a fresh admin account and don't know any existing passwords, insert
one directly:

```bash
# Generate a SHA256 hash
echo -n "devpassword123" | sha256sum | awk '{print $1}'
```

```sql
USE hvz_dev;

-- Update an existing user to admin with a known password
UPDATE users
SET passwd = 'PASTE_HASH_HERE', isAdmin = 3, isLongGameAuthed = 3
WHERE uname = 'someuser';

-- Or insert a new admin account
INSERT INTO users (UID, fname, lname, uname, email, passwd, isAdmin, isLongGameAuthed)
VALUES ('US9999-', 'Dev', 'Admin', 'devadmin', 'dev@localhost',
        'PASTE_HASH_HERE', 3, 3);
```

---

## Common tasks

### Reset the database

```bash
npm run seed
```

### Add a new CSV export

Drop the file into `seed-data/` and re-run `npm run seed`. The script auto-detects
all `.csv` files in the directory.

### Run in production mode locally (test secure cookies, etc.)

```bash
NODE_ENV=production node server/index.js
```

> Secure cookies require HTTPS. For local testing, use `NODE_ENV=development`
> (the default) or the `npm run dev` script.

### Check what port the app is on

The default is 3000. Override with:

```bash
PORT=8080 npm run dev
```

---

## Project structure

```
server/                  Backend (Express.js)
  index.js               Entry point — middleware, routes, cron
  config.js              Reads config.txt
  db.js                  MySQL connection pool (mysql2)
  middleware/auth.js      Session-based auth checks
  routes/                API endpoints (10 public + 13 admin)
  services/              Business logic (achievements, attendance, IDs, email)

public/                  Frontend (static HTML + client-side JS)
  js/api.js              Fetch wrapper, auth helpers
  js/components.js       Dynamic nav, sidebar, footer
  admin/                 Admin panel pages

css/style.css            Stylesheet
js/main.js               Mobile nav, accordion, achievement filters
images/                  Logos, backgrounds, achievement icons
maps/                    Campus maps
scripts/                 Dev utilities
  seed-from-csv.js       CSV database seeder
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Error: Cannot find module 'express'` | Run `npm install` |
| `Access denied for user` | Check `config.txt` credentials match step 3 |
| `ER_NOT_SUPPORTED_AUTH_MODE` | Use `mysql_native_password`: `ALTER USER 'hvzdev'@'localhost' IDENTIFIED WITH mysql_native_password BY 'devpassword';` |
| Seed script says "No matching CSV files" | Check files are in `seed-data/`, named like `users.csv`, and end with `.csv` |
| Seed script `LOAD DATA LOCAL INFILE` error | Your MySQL may have local infile disabled. Run `SET GLOBAL local_infile = 1;` in MySQL, and add `local_infile=1` under `[mysqld]` in your MySQL config |
| Page loads but sidebar/nav missing | Check browser console for JS errors. Ensure `css/style.css` and `js/main.js` exist |
| Login does nothing | Check browser console. Ensure `settings` table is seeded (the app needs it) |
| Port 3000 already in use | `PORT=3001 npm run dev` or kill the other process |
