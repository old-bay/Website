# UMBC HvZ Website — Bare-Metal Setup Guide

Step-by-step instructions for deploying this Node.js site on a fresh Linux server.

---

## 1. System Requirements

| Component       | Minimum            | Recommended            |
|-----------------|--------------------|------------------------|
| OS              | Ubuntu 20.04 / Debian 11 / CentOS 8 | Ubuntu 22.04 LTS |
| Runtime         | Node.js 18         | Node.js 20 LTS        |
| Database        | MySQL 5.7 / MariaDB 10.3 | MySQL 8.0 / MariaDB 10.6 |
| RAM             | 512 MB             | 1 GB+                  |

---

## 2. Install System Packages

### Ubuntu / Debian

```bash
sudo apt update && sudo apt upgrade -y

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL (or MariaDB — pick one)
sudo apt install -y mysql-server
# OR: sudo apt install -y mariadb-server

# Mail (optional — for password recovery emails)
sudo apt install -y msmtp msmtp-mta

# Utilities
sudo apt install -y git
```

Verify Node.js: `node --version` (should be 18+).

---

## 3. Deploy the Code

```bash
cd /var/www
sudo git clone https://github.com/old-bay/Website.git hvz
cd hvz

# Install Node.js dependencies
npm install
```

---

## 4. Set Up MySQL Database and User

```bash
sudo mysql
```

Inside the MySQL shell:

```sql
-- Create the database
CREATE DATABASE hvz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (choose a strong password)
CREATE USER 'hvzUser'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON hvz.* TO 'hvzUser'@'localhost';
FLUSH PRIVILEGES;
```

---

## 5. Create Database Tables

The repository does not include a SQL dump. Run the following schema, which is
reconstructed from every MySQL query in the codebase.

```bash
sudo mysql hvz < /path/to/schema.sql
```

Save the following as `schema.sql`:

```sql
-- ==========================================================
-- UMBC HvZ Database Schema
-- Reconstructed from PHP source code
-- ==========================================================

-- Site-wide key-value settings
CREATE TABLE settings (
    `key`   VARCHAR(100) PRIMARY KEY,
    `value` TEXT
);

-- Seed required settings
INSERT INTO settings (`key`, `value`) VALUES
    ('showVotingLink', 'closed'),
    ('lockVoting', 'lock'),
    ('writeInThreshold', '3'),
    ('showVotesThreshold', '5'),
    ('nullUID', 'NULLUID'),
    ('TOS', 'Terms of Service text goes here.');

-- Academic semesters (used for attendance tracking)
CREATE TABLE semesters (
    semesterID  INT AUTO_INCREMENT PRIMARY KEY,
    startDate   DATETIME NOT NULL,
    endDate     DATETIME NOT NULL
);

-- Player accounts
CREATE TABLE users (
    UID                     VARCHAR(7) PRIMARY KEY,
    fname                   VARCHAR(100) NOT NULL,
    lname                   VARCHAR(100) NOT NULL,
    uname                   VARCHAR(100) NOT NULL UNIQUE,
    email                   VARCHAR(200) NOT NULL UNIQUE,
    passwd                  VARCHAR(128) NOT NULL,
    isAdmin                 INT DEFAULT 0,
    isLongGameAuthed        INT DEFAULT 0,
    isBetaTester            INT DEFAULT 0,
    canChangeName           INT DEFAULT 1,
    ozOptIn                 INT DEFAULT 0,
    ozParagraph             TEXT,
    timesAsOZ               INT DEFAULT 0,
    hasTurnedInWaiver       INT DEFAULT 0,
    vaccineStatus           INT DEFAULT 0,
    profilePicture          VARCHAR(255) DEFAULT 'anon.jpg',
    publicQR                VARCHAR(20),
    phoneNumber             VARCHAR(20),
    lifetimeKills           INT DEFAULT 0,
    longestDaySurvived      INT DEFAULT 0,
    appearancesTotal        INT DEFAULT 0,
    appearancesThisTerm     INT DEFAULT 0,
    appearancesLastTerm     INT DEFAULT 0,
    zombieStartsTotal       INT DEFAULT 0,
    zombieStartsThisTerm    INT DEFAULT 0,
    humanStartsTotal        INT DEFAULT 0,
    humanStartsThisTerm     INT DEFAULT 0,
    gamesModdedTotal        INT DEFAULT 0,
    gamesModdedThisTerm     INT DEFAULT 0,
    adminMeetingsTotal      INT DEFAULT 0,
    adminMeetingsThisTerm   INT DEFAULT 0,
    attendedPregame         INT DEFAULT 0,
    pwResetCode             VARCHAR(20),
    pwResetTime             DATETIME,
    creationDate            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile pictures
CREATE TABLE profilePictures (
    UID     VARCHAR(7) PRIMARY KEY,
    picture VARCHAR(255),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

-- Meeting definitions
CREATE TABLE meeting_list (
    meetingID       VARCHAR(7) PRIMARY KEY,
    meetingName     VARCHAR(200),
    meetingType     INT DEFAULT 0,
    winner          INT DEFAULT 0,
    isResolved      INT DEFAULT 0,
    isPreGame       INT DEFAULT 0,
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting attendance log
CREATE TABLE meeting_log (
    UID             VARCHAR(7),
    meetingID       VARCHAR(7),
    startState      INT DEFAULT 0,
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UID, meetingID),
    FOREIGN KEY (UID) REFERENCES users(UID),
    FOREIGN KEY (meetingID) REFERENCES meeting_list(meetingID)
);

-- Long (weeklong) game definitions
CREATE TABLE long_games (
    gameID      VARCHAR(7) PRIMARY KEY,
    title       VARCHAR(200),
    startDate   DATETIME,
    endDate     DATETIME
);

-- Long game meetings
CREATE TABLE long_meetings (
    gameID      VARCHAR(7),
    meetingID   VARCHAR(7),
    PRIMARY KEY (gameID, meetingID)
);

-- Long game player state
CREATE TABLE long_players (
    playerID            VARCHAR(7),
    gameID              VARCHAR(7),
    state               INT DEFAULT 1,
    kills               INT DEFAULT 0,
    missionsPlayed      INT DEFAULT 0,
    deathTime           DATETIME DEFAULT NULL,
    killLocation        VARCHAR(200),
    cachedDeathTime     DATETIME DEFAULT NULL,
    mainKill            VARCHAR(7),
    feedKill1           VARCHAR(7),
    feedKill2           VARCHAR(7),
    longestDaySurvived  INT DEFAULT 0,
    isOnHitlist         INT DEFAULT 0,
    isPrinted           INT DEFAULT 0,
    PRIMARY KEY (playerID, gameID),
    FOREIGN KEY (gameID) REFERENCES long_games(gameID)
);

-- Long game point tracking
CREATE TABLE long_points (
    pointID     INT AUTO_INCREMENT PRIMARY KEY,
    gameID      VARCHAR(7),
    playerID    VARCHAR(7),
    pointsGiven INT DEFAULT 0,
    reason      VARCHAR(200),
    FOREIGN KEY (gameID) REFERENCES long_games(gameID)
);

-- Blog / news posts
CREATE TABLE blog_posts (
    postID      INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(300),
    content     TEXT,
    author      VARCHAR(100),
    posted      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FAQ entries
CREATE TABLE faq (
    faqID   INT AUTO_INCREMENT PRIMARY KEY,
    number  INT,
    title   VARCHAR(300),
    answer  TEXT
);

-- Achievement FAQ
CREATE TABLE achievementFaq (
    number  INT PRIMARY KEY,
    title   VARCHAR(300),
    answer  TEXT
);

-- Achievement definitions
CREATE TABLE achievements_new (
    AID         INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200),
    description TEXT,
    class       CHAR(1),
    alignment   CHAR(1),
    image       VARCHAR(255),
    isHidden    INT DEFAULT 0,
    `key`       VARCHAR(100),
    isAuto      INT DEFAULT 0,
    updateFunction VARCHAR(200)
);

-- Player <-> achievement links
CREATE TABLE userAchieveLink_new (
    AID         INT,
    UID         VARCHAR(7),
    isFavorite  INT DEFAULT 0,
    awardDate   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (AID, UID),
    FOREIGN KEY (AID) REFERENCES achievements_new(AID),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

-- Election: candidates
CREATE TABLE election_candidates (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    position    VARCHAR(100),
    name        VARCHAR(200),
    bio         TEXT
);

-- Election: votes
CREATE TABLE election_votes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    uid         VARCHAR(7),
    position    VARCHAR(100),
    voteFor     VARCHAR(200)
);

-- Sidebar mission slides
CREATE TABLE mission_slides (
    name                VARCHAR(100) PRIMARY KEY,
    url                 VARCHAR(500),
    startingSlideNumber VARCHAR(20) DEFAULT '0'
);

-- Sidebar mission slide headings
CREATE TABLE mission_slide_headings (
    headingTitle    VARCHAR(100) PRIMARY KEY,
    headingName     VARCHAR(200)
);

-- Seed default slide headings
INSERT INTO mission_slide_headings (headingTitle, headingName) VALUES
    ('mainHeading', 'This Week''s Missions'),
    ('firstSlides', 'Monday Mission'),
    ('secondSlides', 'Thursday Mission'),
    ('thirdSlides', NULL);

INSERT INTO mission_slides (name, url) VALUES
    ('mondayMission', 'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('thursdayMission', 'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('pointSlide', 'https://docs.google.com/presentation/d/PLACEHOLDER/');

-- Equipment tracking
CREATE TABLE equipment (
    EID         INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(200),
    loanedTo    VARCHAR(7)
);

-- Polls
CREATE TABLE poll_questions (
    QID         INT AUTO_INCREMENT PRIMARY KEY,
    question    TEXT,
    isOpen      INT DEFAULT 1,
    isActive    INT DEFAULT 0
);

CREATE TABLE poll_options (
    optionID    INT AUTO_INCREMENT PRIMARY KEY,
    QID         INT,
    `option`    VARCHAR(200),
    FOREIGN KEY (QID) REFERENCES poll_questions(QID)
);

CREATE TABLE poll_votes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    QID         INT,
    UID         VARCHAR(7),
    optionID    INT
);

-- Custom MySQL function used by some queries
DELIMITER //
CREATE FUNCTION PlayerState(n INT)
    RETURNS VARCHAR(20)
    DETERMINISTIC
    BEGIN
        DECLARE s VARCHAR(20);
        IF n > 0 THEN SET s = 'Human';
        ELSEIF n = 0 THEN SET s = 'Deceased';
        ELSE SET s = 'Zombie';
        END IF;
        RETURN s;
    END //
DELIMITER ;
```

---

## 6. Create the Configuration File

The app reads `config.txt` in the project root. This file is gitignored.

```bash
nano /var/www/hvz/config.txt
```

Contents:

```
# UMBC HvZ site configuration
debug=0
mysql_user=hvzUser
mysql_pass=CHANGE_ME_STRONG_PASSWORD
mysql_db=hvz
session_secret=CHANGE_ME_RANDOM_SECRET_STRING
```

| Key              | Description                                                       |
|------------------|-------------------------------------------------------------------|
| `debug`          | `0` = connect to `localhost`; `1` = connect to `umbchvz.com`     |
| `mysql_user`     | MySQL username created in step 4                                   |
| `mysql_pass`     | MySQL password created in step 4                                   |
| `mysql_db`       | MySQL database name created in step 4                              |
| `session_secret` | Random string for signing session cookies                          |

---

## 7. Set Permissions

```bash
cd /var/www/hvz

# Create directories the app expects
mkdir -p images/profilePictures
mkdir -p logs

# Writable directories for uploads
chmod 770 images/profilePictures
chmod 770 logs

# Protect config
chmod 640 config.txt
```

---

## 8. Create the First Admin Account

There is no install wizard. Insert the first admin user directly into MySQL.
The password is stored as `SHA256(plaintext)`:

```bash
# Generate a password hash (replace YOUR_PASSWORD)
PASS_HASH=$(echo -n "YOUR_PASSWORD" | sha256sum | awk '{print $1}')
echo "Password hash: $PASS_HASH"
```

```sql
USE hvz;

INSERT INTO users (UID, fname, lname, uname, email, passwd, isAdmin, isLongGameAuthed)
VALUES ('US0000-', 'Admin', 'User', 'admin', 'admin@umbc.edu',
        'PASTE_HASH_HERE', 3, 3);
```

> **Important:** The login flow: client sends `SHA256(salt + SHA256(password))`.
> The database stores `SHA256(password)`. The server computes `SHA256(salt + storedHash)`
> and compares. Only store the single SHA256 hash in the `passwd` column.

---

## 9. Configure Email (Optional)

Password recovery requires a working mail system. The app uses `msmtp` via `nodemailer`.

Create `/etc/msmtprc`:

```
defaults
auth           on
tls            on
tls_starttls   on
logfile        /var/log/msmtp.log

account        default
host           smtp.gmail.com
port           587
from           youremail@gmail.com
user           youremail@gmail.com
password       YOUR_APP_PASSWORD
```

```bash
sudo chmod 600 /etc/msmtprc
```

---

## 10. Run the Application

### Development

```bash
cd /var/www/hvz
npm run dev
```

The server starts on port 3000 by default. Set `PORT` environment variable to change.

### Production (with systemd)

Create `/etc/systemd/system/hvz.service`:

```ini
[Unit]
Description=UMBC HvZ Website
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/hvz
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hvz
```

### Reverse Proxy with Nginx (Recommended)

Install nginx and proxy port 3000:

```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/hvz`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Block config.txt from being served
    location = /config.txt { return 403; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hvz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## 11. Enable HTTPS (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 12. Seed Initial Data

```sql
USE hvz;

-- Create the current semester
INSERT INTO semesters (startDate, endDate) VALUES
    ('2026-01-20 00:00:00', '2026-05-15 23:59:59');

-- Add a sample FAQ entry
INSERT INTO faq (number, title, answer) VALUES
    (1, 'What is Humans vs. Zombies?',
     'HvZ is a recreational game combining Nerf wars, manhunt, tag, and capture the flag.');

-- Add a sample blog post
INSERT INTO blog_posts (title, content, author, posted) VALUES
    ('Welcome!', 'Welcome to the new UMBC HvZ website.', 'US0000-', NOW());
```

---

## 13. Verify the Installation

| Step | URL                          | Expected result                          |
|------|------------------------------|------------------------------------------|
| 1    | `http://yourdomain.com/`     | Home page with news, sidebar             |
| 2    | `http://yourdomain.com/rules`| Rules page                               |
| 3    | `http://yourdomain.com/about`| FAQ page showing entries from DB          |
| 4    | `http://yourdomain.com/news` | News page showing blog posts             |
| 5    | Log in via sidebar           | Shows "Welcome, Admin!", profile links   |
| 6    | `http://yourdomain.com/admin`| Admin panel with all management links    |
| 7    | `http://yourdomain.com/config.txt` | **403 Forbidden** (blocked by nginx) |

---

## 14. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Cannot connect to site | Node.js not running | `sudo systemctl status hvz` |
| Database connection refused | Wrong credentials or MySQL not running | Check `config.txt`; run `sudo systemctl status mysql` |
| Login doesn't work | Session or hashing issue | Ensure `session_secret` is set in config.txt |
| Sidebar shows "Unknown elections" | Missing `settings` rows | Run the `INSERT INTO settings` from step 5 |
| Achievement images broken | Wrong path | Verify `images/achievements/` directory exists |
| Profile picture upload fails | Permissions | `chmod 770 images/profilePictures` |
| Email not sending | msmtp not configured | Check `/etc/msmtprc` and `/var/log/msmtp.log` |

---

## File Map

```
/var/www/hvz/
├── config.txt              ← YOU CREATE THIS (step 6)
├── package.json            ← Node.js dependencies
├── server/                 ← Express.js backend
│   ├── index.js            ← Application entry point
│   ├── config.js           ← Configuration loader
│   ├── db.js               ← MySQL connection pool (mysql2)
│   ├── middleware/
│   │   └── auth.js         ← Authentication middleware
│   ├── routes/             ← REST API routes
│   │   ├── auth.js         ← Login, register, password recovery
│   │   ├── profile.js      ← User profile operations
│   │   ├── kill.js         ← Kill logging
│   │   ├── players.js      ← Player list
│   │   ├── news.js         ← Blog posts
│   │   ├── achievements.js ← Achievement database
│   │   ├── voting.js       ← Election system
│   │   ├── faq.js          ← FAQ data
│   │   ├── games.js        ← Game summary data
│   │   ├── sidebar.js      ← Sidebar data (slides, polls)
│   │   └── admin/          ← Admin API routes (13 files)
│   └── services/           ← Business logic
│       ├── achievements.js ← Achievement award/update system
│       ├── attendance.js   ← Attendance statistics
│       ├── ids.js          ← UID/kill code generation
│       ├── email.js        ← Email sending (nodemailer)
│       ├── gameState.js    ← Game/semester queries, helpers
│       └── cron.js         ← Hourly cron tasks
├── public/                 ← Static HTML/JS frontend
│   ├── index.html          ← Home page
│   ├── rules.html          ← Rules
│   ├── about.html          ← FAQ (loads from API)
│   ├── contact.html        ← Officer contacts
│   ├── news.html           ← News (loads from API)
│   ├── achievements.html   ← Achievement database (loads from API)
│   ├── profile.html        ← User profile
│   ├── players.html        ← Player list
│   ├── kill.html           ← Kill logging
│   ├── register.html       ← Account registration
│   ├── voting.html         ← Elections
│   ├── password-recovery.html
│   ├── game-summary.html
│   ├── mission-tools.html
│   ├── js/
│   │   ├── api.js          ← API client helper
│   │   └── components.js   ← Shared UI (nav, sidebar, footer)
│   └── admin/              ← Admin panel HTML pages (14 files)
├── css/style.css           ← Stylesheet
├── js/main.js              ← Mobile nav, accordion, filters
├── images/                 ← Logos, backgrounds, achievement icons
└── maps/                   ← Campus maps
```
