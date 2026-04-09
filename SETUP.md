# UMBC HvZ Website — Bare-Metal Setup Guide

Step-by-step instructions for deploying this site on a fresh Linux server.

---

## 1. System Requirements

| Component       | Minimum            | Recommended            |
|-----------------|--------------------|------------------------|
| OS              | Ubuntu 20.04 / Debian 11 / CentOS 8 | Ubuntu 22.04 LTS |
| Web Server      | Apache 2.4         | Apache 2.4             |
| PHP             | 7.4                | 8.1                    |
| Database        | MySQL 5.7 / MariaDB 10.3 | MySQL 8.0 / MariaDB 10.6 |
| RAM             | 512 MB             | 1 GB+                  |

> **Note:** The codebase uses legacy `mysql_*` function names, but `includes/util.php`
> contains a compatibility shim (lines 764–818) that maps them to `mysqli` internally.
> The code runs on PHP 7+ and 8.x without modification.

---

## 2. Install System Packages

### Ubuntu / Debian

```bash
sudo apt update && sudo apt upgrade -y

# Apache
sudo apt install -y apache2

# PHP and required extensions
sudo apt install -y php php-mysql php-gd php-xml php-mbstring php-curl php-zip libapache2-mod-php

# MySQL (or MariaDB — pick one)
sudo apt install -y mysql-server
# OR: sudo apt install -y mariadb-server

# Mail (optional — for password recovery emails)
sudo apt install -y msmtp msmtp-mta

# Utilities
sudo apt install -y git unzip
```

### CentOS / RHEL

```bash
sudo dnf install -y httpd php php-mysqlnd php-gd php-xml php-mbstring php-curl php-zip
sudo dnf install -y mysql-server   # or mariadb-server
sudo systemctl enable --now httpd mysqld
```

---

## 3. Enable Required Apache Modules

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

The site relies on `.htaccess` files, so `mod_rewrite` and `AllowOverride All` are
mandatory.

---

## 4. Deploy the Code

```bash
# Clone the repository
cd /var/www
sudo git clone https://github.com/old-bay/Website.git html
# Or if deploying to a subdirectory:
# sudo git clone https://github.com/old-bay/Website.git /var/www/html/hvz

sudo chown -R www-data:www-data /var/www/html
```

---

## 5. Apache Virtual Host Configuration

Create `/etc/apache2/sites-available/hvz.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP settings
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/hvz-error.log
    CustomLog ${APACHE_LOG_DIR}/hvz-access.log combined
</VirtualHost>
```

Enable it:

```bash
sudo a2ensite hvz.conf
sudo a2dissite 000-default.conf   # disable default if desired
sudo systemctl reload apache2
```

---

## 6. Set Up MySQL Database and User

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

## 7. Create Database Tables

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
    UID                     VARCHAR(7) PRIMARY KEY,     -- e.g. US0000-
    fname                   VARCHAR(100) NOT NULL,
    lname                   VARCHAR(100) NOT NULL,
    uname                   VARCHAR(100) NOT NULL UNIQUE,
    email                   VARCHAR(200) NOT NULL UNIQUE,
    passwd                  VARCHAR(128) NOT NULL,       -- SHA256 hash
    isAdmin                 INT DEFAULT 0,               -- 0=none, 1=subofficer, 2=officer, 3=webcom
    isLongGameAuthed        INT DEFAULT 0,
    isBetaTester            INT DEFAULT 0,
    canChangeName           INT DEFAULT 1,
    ozOptIn                 INT DEFAULT 0,
    ozParagraph             TEXT,
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
    creationDate            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile pictures (separate table for upload tracking)
CREATE TABLE profilePictures (
    UID     VARCHAR(7) PRIMARY KEY,
    picture VARCHAR(255),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

-- Meeting/event definitions
CREATE TABLE meeting_list (
    meetingID       VARCHAR(7) PRIMARY KEY,   -- e.g. ME0000-
    meetingName     VARCHAR(200),
    meetingType     INT DEFAULT 0,             -- 0=mission, 1=admin/community, 2=other, 3=nominal
    meetingWinner   INT DEFAULT 0,             -- 0=other, 1=human, 2=zombie
    isResolved      INT DEFAULT 0,
    isPreGame       INT DEFAULT 0,
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting attendance log
CREATE TABLE meeting_log (
    UID             VARCHAR(7),
    meetingID       VARCHAR(7),
    startState      INT DEFAULT 0,   -- 1=human, -1/-2=zombie/OZ, 4=moderator
    creationDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UID, meetingID),
    FOREIGN KEY (UID) REFERENCES users(UID),
    FOREIGN KEY (meetingID) REFERENCES meeting_list(meetingID)
);

-- Unregistered player attendance
CREATE TABLE meeting_unregistered_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    meetingID   VARCHAR(7),
    playerName  VARCHAR(200),
    FOREIGN KEY (meetingID) REFERENCES meeting_list(meetingID)
);

-- Long (weeklong) game definitions
CREATE TABLE long_games (
    gameID      VARCHAR(7) PRIMARY KEY,
    title       VARCHAR(200),
    startDate   DATETIME,
    endDate     DATETIME
);

-- Long game player state
CREATE TABLE long_players (
    playerID            VARCHAR(7),
    gameID              VARCHAR(7),
    state               INT DEFAULT 1,   -- see denumerate('gameState') in util.php
    kills               INT DEFAULT 0,
    daysSurvived        INT DEFAULT 0,
    deathTime           DATETIME DEFAULT '0000-00-00 00:00:00',
    mainKill            VARCHAR(7),      -- e.g. MK3Q9WE
    feedKill1           VARCHAR(7),
    feedKill2           VARCHAR(7),
    longestDaySurvived  INT DEFAULT 0,
    isOnHitlist         INT DEFAULT 0,
    isPrinted           INT DEFAULT 0,
    PRIMARY KEY (playerID, gameID),
    FOREIGN KEY (gameID) REFERENCES long_games(gameID)
);

-- Long game pre-registration
CREATE TABLE long_preregister (
    UID     VARCHAR(7),
    gameID  VARCHAR(7),
    mainKill VARCHAR(7),
    PRIMARY KEY (UID, gameID)
);

-- Long game point tracking
CREATE TABLE long_points (
    id          INT AUTO_INCREMENT PRIMARY KEY,
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
    postDate    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ entries (loaded on about.php)
CREATE TABLE faq (
    number  INT PRIMARY KEY,
    title   VARCHAR(300),
    answer  TEXT
);

-- Achievement FAQ (loaded on achievementsFaq.php)
CREATE TABLE achievementFaq (
    number  INT PRIMARY KEY,
    title   VARCHAR(300),
    answer  TEXT
);

-- Achievement definitions (current system)
CREATE TABLE achievements_new (
    AID         INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200),
    description TEXT,
    class       CHAR(1),        -- e=basic, m=recruit, h=veteran, l=legendary, r=retired
    alignment   CHAR(1),        -- h=human, z=zombie, n=neutral, m=moderator
    image       VARCHAR(255),
    isHidden    INT DEFAULT 0,
    `key`       VARCHAR(100),
    isAuto      INT DEFAULT 0,
    updateFunction VARCHAR(200)
);

-- Player <-> achievement links (current system)
CREATE TABLE userAchieveLink_new (
    AID         INT,
    UID         VARCHAR(7),
    isFavorite  INT DEFAULT 0,
    awardDate   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (AID, UID),
    FOREIGN KEY (AID) REFERENCES achievements_new(AID),
    FOREIGN KEY (UID) REFERENCES users(UID)
);

-- Election: positions to vote on
CREATE TABLE officer_positions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    position    VARCHAR(100) NOT NULL
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

-- Seed default slide entries
INSERT INTO mission_slides (name, url) VALUES
    ('mondayMission', 'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('thursdayMission', 'https://docs.google.com/presentation/d/PLACEHOLDER/'),
    ('pointSlide', 'https://docs.google.com/presentation/d/PLACEHOLDER/');

-- Equipment tracking (disabled in admin panel but table exists)
CREATE TABLE equipment (
    EID         INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(200),
    loanedTo    VARCHAR(7)
);

-- Polls (disabled but referenced)
CREATE TABLE poll_questions (
    QID         INT AUTO_INCREMENT PRIMARY KEY,
    question    TEXT
);

CREATE TABLE poll_options (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    QID     INT,
    label   VARCHAR(200),
    FOREIGN KEY (QID) REFERENCES poll_questions(QID)
);

CREATE TABLE poll_votes (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    QID     INT,
    uid     VARCHAR(7),
    choice  INT
);

-- Custom MySQL function used by playerList queries
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

The site reads `/var/www/html/config.txt` at runtime. This file is gitignored
and blocked by `.htaccess`.

```bash
sudo nano /var/www/html/config.txt
```

Contents:

```
# UMBC HvZ site configuration
debug=0
folder=/
mysql_user=hvzUser
mysql_pass=CHANGE_ME_STRONG_PASSWORD
mysql_db=hvz
```

| Key          | Description                                                          |
|--------------|----------------------------------------------------------------------|
| `debug`      | `0` = connect to `localhost`; `1` = connect to `umbchvz.com` (dev)  |
| `folder`     | Web root path. Use `/` if deployed at DocumentRoot.                  |
| `mysql_user` | MySQL username created in step 6                                     |
| `mysql_pass` | MySQL password created in step 6                                     |
| `mysql_db`   | MySQL database name created in step 6                                |

---

## 9. Create Required Directories and Set Permissions

```bash
cd /var/www/html

# Create directories the app expects
sudo mkdir -p images/profilePictures
sudo mkdir -p logs

# Set ownership to the web server user
sudo chown -R www-data:www-data /var/www/html

# Secure config and scripts
sudo chmod 640 config.txt
sudo chmod -R 750 scripts/
sudo chmod -R 750 includes/

# Writable directories for uploads and logs
sudo chmod 770 images/profilePictures
sudo chmod 770 logs
```

---

## 10. Verify .htaccess Protection

The root `.htaccess` already contains:

```apache
<Files config.txt>
  order deny,allow
  deny from all
</Files>
<Files .*>
  order deny,allow
  deny from all
</Files>
ErrorDocument 403 /maintenance.php
```

The `includes/.htaccess` denies all PHP execution:

```
deny from all
```

Verify these are working:

```bash
# These should all return 403:
curl -s -o /dev/null -w "%{http_code}" http://localhost/config.txt
curl -s -o /dev/null -w "%{http_code}" http://localhost/.htaccess
curl -s -o /dev/null -w "%{http_code}" http://localhost/includes/util.php
```

---

## 11. Create the First Admin Account

There is no install wizard. Insert the first admin user directly into MySQL.
The password hash is SHA256(SHA256(plaintext)):

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

> **Important:** The login flow works as: client sends `SHA256(salt + SHA256(password))`.
> The database stores `SHA256(password)`. The server computes `SHA256(salt + storedHash)`
> and compares. So only store the single SHA256 hash in the `passwd` column.

---

## 12. Configure Email (Optional)

Password recovery requires a working mail system. Install and configure `msmtp`:

```bash
sudo apt install -y msmtp msmtp-mta
```

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

The site uses PHP's `mail()` function, which `.mailrc` redirects to msmtp.
Copy the `.mailrc` to the web server user's home:

```bash
sudo cp /var/www/html/.mailrc /var/www/
sudo chown www-data:www-data /var/www/.mailrc
```

---

## 13. Set Up Cron Jobs (Optional)

The site has an hourly cron script for automated tasks (zombie starvation timers,
daily points, etc.). Most of it is currently commented out but the framework is there.

```bash
sudo crontab -u www-data -e
```

Add:

```cron
0 * * * * /usr/bin/php /var/www/html/scripts/hourlyCron.php >> /var/www/html/logs/cron.log 2>&1
```

---

## 14. Enable HTTPS (Recommended)

Passwords are hashed client-side with SHA256, but all traffic should still use TLS:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

---

## 15. PHP Configuration Tuning

Edit `/etc/php/8.1/apache2/php.ini` (adjust path for your PHP version):

```ini
; Required
session.save_path = "/var/lib/php/sessions"
file_uploads = On
upload_max_filesize = 5M        ; for profile pictures
post_max_size = 8M
max_execution_time = 60

; Recommended
display_errors = Off             ; production
log_errors = On
error_log = /var/log/php_errors.log
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

---

## 16. Seed Some Initial Data

After the database and admin account are set up, seed some useful starting data:

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
INSERT INTO blog_posts (title, content, author) VALUES
    ('Welcome!', 'Welcome to the new UMBC HvZ website.', 'Admin');
```

---

## 17. Verify the Installation

Open your browser and check these pages in order:

| Step | URL                          | Expected result                          |
|------|------------------------------|------------------------------------------|
| 1    | `http://yourdomain.com/`     | Redirects to `home.php`                  |
| 2    | `http://yourdomain.com/home.php` | Home page with sidebar, logo, no errors |
| 3    | `http://yourdomain.com/rules.html` | Static rules page (no PHP needed)      |
| 4    | `http://yourdomain.com/about.php` | FAQ page showing entries from DB        |
| 5    | `http://yourdomain.com/news.php`  | News page showing blog posts from DB   |
| 6    | Log in with the admin account | Sidebar shows "Hello Admin!", admin links |
| 7    | `http://yourdomain.com/admin/` | Admin panel with all management links   |
| 8    | `http://yourdomain.com/config.txt` | **403 Forbidden** (must be blocked)  |

---

## 18. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page / 500 error | PHP error hidden | Check `/var/log/apache2/hvz-error.log` and `/var/log/php_errors.log` |
| "Couldn't open configuration file" | Missing `config.txt` | Create it per step 8 |
| Database connection refused | Wrong credentials or MySQL not running | Verify `config.txt` values; run `sudo systemctl status mysql` |
| `.htaccess` not working | `AllowOverride` not set | Ensure `AllowOverride All` in Apache vhost config |
| Login doesn't work | Salt/session issue | Try submitting twice (known quirk); check `session.save_path` is writable |
| Sidebar shows "Unknown status of elections" | Missing `settings` rows | Run the `INSERT INTO settings` from step 7 |
| Achievement images broken | Wrong path | Verify `images/achievements/` directory exists with image files |
| Profile picture upload fails | Permissions | `sudo chown www-data:www-data images/profilePictures && chmod 770 images/profilePictures` |

---

## File Map (Quick Reference)

```
/var/www/html/
├── config.txt              ← YOU CREATE THIS (step 8)
├── .htaccess               ← security rules (already in repo)
├── index.php               ← redirects to home.php
├── home.php                ← landing page (DB: sidebar, login)
├── rules.html              ← static rules page
├── about.php               ← FAQ (DB: faq table)
├── news.php                ← blog posts (DB: blog_posts)
├── achievements.php        ← achievements (DB: achievements_new)
├── contact.html            ← static officer list
├── myProfile.php           ← player profile (DB: users, long_players)
├── playerList.php          ← player roster (DB: users, long_players)
├── kill.php                ← kill logging (DB: long_players)
├── register.php            ← account creation (DB: users)
├── voting.php              ← elections (DB: election_*)
├── passwordRecovery.php    ← account recovery (DB: users)
├── missionTools.php        ← mission creation guide
├── css/style.css           ← modern responsive stylesheet
├── js/main.js              ← mobile nav, FAQ accordion, filters
├── images/                 ← logos, backgrounds, achievement icons
├── includes/               ← PHP includes (blocked by .htaccess)
│   ├── util.php            ← core functions + mysqli compat shim
│   ├── loginForm.php       ← sidebar login widget
│   ├── loginUpdate.php     ← authentication handler
│   ├── htmlHeader.php      ← JS for time display + SHA256 login
│   ├── saltGen.php         ← session salt generation
│   └── ...
├── pageIncludes/           ← per-page PHP logic
├── admin/                  ← admin panel (officer-only)
├── api/                    ← JSON endpoints
├── scripts/                ← cron jobs (blocked by .htaccess)
└── tcpdf/                  ← PDF library (bundled)
```
