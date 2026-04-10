# UMBC HvZ Website — Bare-Metal Setup Guide

Step-by-step instructions for deploying this Node.js site on a fresh Linux server,
with security hardening built in from the start.

---

## 1. System Requirements

| Component   | Minimum                          | Recommended              |
|-------------|----------------------------------|--------------------------|
| OS          | Ubuntu 20.04 / Debian 11         | Ubuntu 22.04 LTS         |
| Runtime     | Node.js 18                       | Node.js 20 LTS           |
| Database    | MySQL 5.7 / MariaDB 10.3         | MySQL 8.0 / MariaDB 10.6 |
| RAM         | 512 MB                           | 1 GB+                    |

---

## 2. Install System Packages

```bash
sudo apt update && sudo apt upgrade -y

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL (or MariaDB — pick one)
sudo apt install -y mysql-server
# OR: sudo apt install -y mariadb-server

# Nginx reverse proxy
sudo apt install -y nginx

# Mail transport (optional — for password recovery emails)
sudo apt install -y msmtp msmtp-mta

# Security utilities
sudo apt install -y ufw fail2ban unattended-upgrades git

# Verify Node.js version (should be 18+)
node --version
```

---

## 3. OS and Network Hardening

### Automatic security updates

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Firewall

Only expose SSH, HTTP, and HTTPS. The Node.js port (3000) is internal only.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirects to HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

### SSH hardening

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers yourusername
```

```bash
sudo systemctl restart sshd
```

> **Before applying `PasswordAuthentication no`**, make sure your SSH public key
> is already in `~/.ssh/authorized_keys`, or you will lock yourself out.

### fail2ban (brute-force protection)

```bash
sudo systemctl enable --now fail2ban
# Verify it's watching SSH:
sudo fail2ban-client status sshd
```

---

## 4. Create a Dedicated Service User

The app runs as an unprivileged system account with no login shell.

```bash
sudo useradd --system --shell /usr/sbin/nologin --home /var/www/hvz hvz
```

---

## 5. Deploy the Code

```bash
sudo mkdir -p /var/www/hvz
sudo git clone https://github.com/old-bay/Website.git /var/www/hvz
cd /var/www/hvz

# Install Node.js dependencies (includes helmet, express-rate-limit)
npm install
```

---

## 6. Set Up MySQL

### Secure the installation

```bash
sudo mysql_secure_installation
```

Follow the prompts: set a root password, remove anonymous users, disallow remote
root login, remove the test database.

### Create the database and application user

```bash
sudo mysql
```

Inside the MySQL shell:

```sql
CREATE DATABASE hvz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Minimal privileges — no DROP, CREATE, or ALTER at runtime
CREATE USER 'hvzUser'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON hvz.* TO 'hvzUser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Verify MySQL only listens on localhost (this is the default, but confirm):

```bash
grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
# Should show: bind-address = 127.0.0.1
```

---

## 7. Create Database Tables

Save the following as `/tmp/schema.sql`, then run it:

```bash
sudo mysql hvz < /tmp/schema.sql
```

```sql
-- ==========================================================
-- UMBC HvZ Database Schema
-- ==========================================================

CREATE TABLE settings (
    `key`   VARCHAR(100) PRIMARY KEY,
    `value` TEXT
);

INSERT INTO settings (`key`, `value`) VALUES
    ('showVotingLink', 'closed'),
    ('lockVoting', 'lock'),
    ('writeInThreshold', '3'),
    ('showVotesThreshold', '5'),
    ('nullUID', 'NULLUID'),
    ('TOS', 'Terms of Service text goes here.');

CREATE TABLE semesters (
    semesterID  INT AUTO_INCREMENT PRIMARY KEY,
    startDate   DATETIME NOT NULL,
    endDate     DATETIME NOT NULL
);

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

CREATE TABLE profilePictures (
    UID     VARCHAR(7) PRIMARY KEY,
    picture VARCHAR(255),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

CREATE TABLE meeting_list (
    meetingID       VARCHAR(7) PRIMARY KEY,
    meetingName     VARCHAR(200),
    meetingType     INT DEFAULT 0,
    winner          INT DEFAULT 0,
    isResolved      INT DEFAULT 0,
    isPreGame       INT DEFAULT 0,
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meeting_log (
    UID             VARCHAR(7),
    meetingID       VARCHAR(7),
    startState      INT DEFAULT 0,
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UID, meetingID),
    FOREIGN KEY (UID) REFERENCES users(UID),
    FOREIGN KEY (meetingID) REFERENCES meeting_list(meetingID)
);

CREATE TABLE long_games (
    gameID      VARCHAR(7) PRIMARY KEY,
    title       VARCHAR(200),
    startDate   DATETIME,
    endDate     DATETIME
);

CREATE TABLE long_meetings (
    gameID      VARCHAR(7),
    meetingID   VARCHAR(7),
    PRIMARY KEY (gameID, meetingID)
);

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

CREATE TABLE long_points (
    pointID     INT AUTO_INCREMENT PRIMARY KEY,
    gameID      VARCHAR(7),
    playerID    VARCHAR(7),
    pointsGiven INT DEFAULT 0,
    reason      VARCHAR(200),
    FOREIGN KEY (gameID) REFERENCES long_games(gameID)
);

CREATE TABLE blog_posts (
    postID      INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(300),
    content     TEXT,
    author      VARCHAR(100),
    posted      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faq (
    faqID   INT AUTO_INCREMENT PRIMARY KEY,
    number  INT,
    title   VARCHAR(300),
    answer  TEXT
);

CREATE TABLE achievementFaq (
    number  INT PRIMARY KEY,
    title   VARCHAR(300),
    answer  TEXT
);

CREATE TABLE achievements_new (
    AID            INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(200),
    description    TEXT,
    class          CHAR(1),
    alignment      CHAR(1),
    image          VARCHAR(255),
    isHidden       INT DEFAULT 0,
    `key`          VARCHAR(100),
    isAuto         INT DEFAULT 0,
    updateFunction VARCHAR(200)
);

CREATE TABLE userAchieveLink_new (
    AID         INT,
    UID         VARCHAR(7),
    isFavorite  INT DEFAULT 0,
    awardDate   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (AID, UID),
    FOREIGN KEY (AID) REFERENCES achievements_new(AID),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

CREATE TABLE election_candidates (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    position VARCHAR(100),
    name     VARCHAR(200),
    bio      TEXT
);

CREATE TABLE election_votes (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    uid      VARCHAR(7),
    position VARCHAR(100),
    voteFor  VARCHAR(200)
);

CREATE TABLE mission_slides (
    name                VARCHAR(100) PRIMARY KEY,
    url                 VARCHAR(500),
    startingSlideNumber VARCHAR(20) DEFAULT '0'
);

CREATE TABLE mission_slide_headings (
    headingTitle VARCHAR(100) PRIMARY KEY,
    headingName  VARCHAR(200)
);

INSERT INTO mission_slide_headings (headingTitle, headingName) VALUES
    ('mainHeading', 'This Week''s Missions'),
    ('firstSlides', 'Monday Mission'),
    ('secondSlides', 'Thursday Mission'),
    ('thirdSlides', NULL);

INSERT INTO mission_slides (name, url) VALUES
    ('mondayMission',   'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('thursdayMission', 'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('pointSlide',      'https://docs.google.com/presentation/d/PLACEHOLDER/');

CREATE TABLE equipment (
    EID         INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(200),
    loanedTo    VARCHAR(7)
);

CREATE TABLE poll_questions (
    QID      INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT,
    isOpen   INT DEFAULT 1,
    isActive INT DEFAULT 0
);

CREATE TABLE poll_options (
    optionID INT AUTO_INCREMENT PRIMARY KEY,
    QID      INT,
    `option` VARCHAR(200),
    FOREIGN KEY (QID) REFERENCES poll_questions(QID)
);

CREATE TABLE poll_votes (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    QID      INT,
    UID      VARCHAR(7),
    optionID INT
);

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

## 8. Create the Configuration File

The app reads `config.txt` from the project root. This file is gitignored and
must be created manually on the server.

```bash
nano /var/www/hvz/config.txt
```

```
# UMBC HvZ site configuration
debug=0
mysql_user=hvzUser
mysql_pass=CHANGE_ME_STRONG_PASSWORD
mysql_db=hvz
session_secret=CHANGE_ME_RANDOM_SECRET_STRING
```

Generate a strong `session_secret`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Key              | Description                                              |
|------------------|----------------------------------------------------------|
| `debug`          | `0` = connect to localhost MySQL; `1` = remote host     |
| `mysql_user`     | MySQL username from step 6                               |
| `mysql_pass`     | MySQL password from step 6                               |
| `mysql_db`       | MySQL database name from step 6                          |
| `session_secret` | Random string for signing session cookies (keep secret)  |

---

## 9. Set File Permissions

```bash
cd /var/www/hvz

# Create directories the app needs
mkdir -p images/profilePictures logs

# Give ownership to the service user
sudo chown -R hvz:hvz /var/www/hvz

# Restrict everything by default
sudo chmod -R 750 /var/www/hvz

# Config readable only by the service user
sudo chmod 600 /var/www/hvz/config.txt

# Upload and log directories need write access
sudo chmod 770 /var/www/hvz/images/profilePictures
sudo chmod 770 /var/www/hvz/logs
```

---

## 10. Create the First Admin Account

There is no install wizard. Insert the first admin directly into MySQL.

Generate the password hash (the DB stores `SHA256(plaintext)`):

```bash
PASS_HASH=$(echo -n "YOUR_PASSWORD" | sha256sum | awk '{print $1}')
echo "Hash: $PASS_HASH"
```

```sql
USE hvz;

INSERT INTO users (UID, fname, lname, uname, email, passwd, isAdmin, isLongGameAuthed)
VALUES ('US0000-', 'Admin', 'User', 'admin', 'admin@yourdomain.com',
        'PASTE_HASH_HERE', 3, 3);
```

> **Auth flow:** The client sends `SHA256(salt + SHA256(password))`. The DB stores
> `SHA256(password)`. The server computes `SHA256(salt + storedHash)` and compares.
> Only store the single SHA256 hash in `passwd`.

---

## 11. Configure Email (Optional)

Password recovery emails require msmtp. Create `/etc/msmtprc`:

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

For Gmail, use an [App Password](https://myaccount.google.com/apppasswords),
not your account password.

---

## 12. systemd Service

Create `/etc/systemd/system/hvz.service`:

```ini
[Unit]
Description=UMBC HvZ Website
After=network.target mysql.service

[Service]
Type=simple
User=hvz
WorkingDirectory=/var/www/hvz
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

# Security restrictions
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/var/www/hvz/images/profilePictures /var/www/hvz/logs

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hvz
sudo systemctl status hvz
```

---

## 13. Nginx Configuration

The app binds to `127.0.0.1:3000` and is only reachable via nginx. The config
below includes TLS, security headers, rate limiting, and file blocking.

First, add the rate-limit zone to `/etc/nginx/nginx.conf` inside the `http {}` block:

```nginx
# In /etc/nginx/nginx.conf, inside http { ... }
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Then create `/etc/nginx/sites-available/hvz`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # TLS — certbot fills in the cert paths (step 14)
    # ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    server_tokens off;
    add_header X-Content-Type-Options   "nosniff" always;
    add_header X-Frame-Options          "SAMEORIGIN" always;
    add_header X-XSS-Protection         "1; mode=block" always;
    add_header Referrer-Policy          "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://docs.google.com https://www.youtube.com; img-src 'self' data:;" always;

    # Upload size limit (profile pictures)
    client_max_body_size 5M;

    # Block sensitive files
    location = /config.txt        { return 403; }
    location = /package.json      { return 403; }
    location = /package-lock.json { return 403; }
    location ^~ /server/          { return 403; }
    location ^~ /node_modules/    { return 403; }
    location ~ /\.                { deny all; }   # dotfiles

    # Rate-limit login/register/recover to 5 req/min per IP
    location ~ ^/api/auth/(login|register|recover|reset) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hvz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
```

---

## 14. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot automatically edits the nginx config to fill in the cert paths and
schedules automatic renewal. Verify renewal works:

```bash
sudo certbot renew --dry-run
```

After certbot runs, restart nginx:

```bash
sudo systemctl reload nginx
```

---

## 15. Seed Initial Data

```sql
USE hvz;

-- Create the current semester
INSERT INTO semesters (startDate, endDate) VALUES
    ('2026-01-20 00:00:00', '2026-05-15 23:59:59');

-- Sample FAQ entry
INSERT INTO faq (number, title, answer) VALUES
    (1, 'What is Humans vs. Zombies?',
     'HvZ is a recreational game combining Nerf wars, manhunt, tag, and capture the flag.');

-- Sample blog post
INSERT INTO blog_posts (title, content, author, posted) VALUES
    ('Welcome!', 'Welcome to the new UMBC HvZ website.', 'US0000-', NOW());
```

---

## 16. Verify the Installation

| Check | URL / Command | Expected result |
|-------|---------------|-----------------|
| Home page | `https://yourdomain.com/` | Loads with news and sidebar |
| Rules | `https://yourdomain.com/rules` | Static rules page |
| FAQ | `https://yourdomain.com/about` | FAQ entries from DB |
| News | `https://yourdomain.com/news` | Blog posts from DB |
| Login | Sidebar login form | "Welcome, Admin!" on success |
| Admin panel | `https://yourdomain.com/admin` | All management links visible |
| Config blocked | `https://yourdomain.com/config.txt` | **403 Forbidden** |
| HTTP redirects | `http://yourdomain.com/` | **301 → HTTPS** |
| Cookie flags | Browser devtools → Application → Cookies | `HttpOnly`, `Secure`, `SameSite=Lax` |
| App log | `sudo journalctl -u hvz -f` | No errors at startup |
| Firewall | `sudo ufw status` | Only 22, 80, 443 open |
| Port binding | `ss -tlnp \| grep 3000` | Bound to `127.0.0.1` only |

---

## 17. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Site unreachable | Node.js not running | `sudo systemctl status hvz` |
| 502 Bad Gateway | Node crashed or wrong port | `sudo journalctl -u hvz -n 50` |
| DB connection refused | Wrong credentials or MySQL down | Check `config.txt`; `sudo systemctl status mysql` |
| Login fails | Wrong session secret or hashing issue | Ensure `session_secret` is set in `config.txt` |
| Session not persisting | Cookie not set | Confirm `NODE_ENV=production` in systemd unit |
| Sidebar shows "Unknown elections" | Missing `settings` rows | Run the `INSERT INTO settings` from step 7 |
| Achievement images broken | Missing directory | Verify `images/achievements/` exists |
| Profile picture upload fails | Permissions | `sudo chmod 770 /var/www/hvz/images/profilePictures` |
| Email not sending | msmtp not configured | Check `/etc/msmtprc` and `sudo tail /var/log/msmtp.log` |
| Rate limit firing for admins | Expected behaviour | Auth endpoints allow 20 req/15min per IP (app) + 5 req/min (nginx) |

---

## 18. Maintenance

### Update the site

```bash
cd /var/www/hvz
sudo -u hvz git pull
sudo -u hvz npm install
sudo systemctl restart hvz
```

### View live logs

```bash
sudo journalctl -u hvz -f
```

### Check fail2ban status

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Renew TLS certificate (automatic, but manual test)

```bash
sudo certbot renew --dry-run
```

---

## File Map

```
/var/www/hvz/
├── config.txt              ← YOU CREATE THIS (step 8, gitignored)
├── package.json            ← Node.js dependencies
├── server/                 ← Express.js backend
│   ├── index.js            ← App entry point (helmet, rate limiting, session)
│   ├── config.js           ← config.txt loader
│   ├── db.js               ← mysql2 connection pool
│   ├── middleware/
│   │   └── auth.js         ← requireLogin / requireAdmin middleware
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
│   │   ├── sidebar.js      ← Sidebar slides and polls
│   │   └── admin/          ← Admin API routes (13 files)
│   └── services/           ← Business logic
│       ├── achievements.js ← Achievement award/update system
│       ├── attendance.js   ← Attendance statistics
│       ├── ids.js          ← UID/kill code generation
│       ├── email.js        ← Email via nodemailer + msmtp
│       ├── gameState.js    ← Game/semester queries
│       └── cron.js         ← Hourly scheduled tasks
├── public/                 ← Static HTML/JS frontend
│   ├── js/
│   │   ├── api.js          ← Fetch wrapper and auth helpers
│   │   └── components.js   ← Dynamic nav, sidebar, footer
│   └── admin/              ← Admin panel HTML pages
├── css/style.css           ← Stylesheet
├── js/main.js              ← Mobile nav, accordion, filters
├── images/
│   └── profilePictures/    ← User uploads (writable by hvz user)
└── maps/                   ← Campus maps
```
