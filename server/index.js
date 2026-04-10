const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false // managed by nginx; avoid double-setting
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limit auth endpoints to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(session({
  secret: config.session_secret || 'hvz-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // HTTPS-only cookies in production
  }
}));

// Serve static files from public/ and from repo root for images, maps, css, etc.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/maps', express.static(path.join(__dirname, '..', 'maps')));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// --- API Routes ---
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/kill', require('./routes/kill'));
app.use('/api/players', require('./routes/players'));
app.use('/api/news', require('./routes/news'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/voting', require('./routes/voting'));
app.use('/api/faq', require('./routes/faq'));
app.use('/api/games', require('./routes/games'));
app.use('/api/sidebar', require('./routes/sidebar'));

// Admin routes
app.use('/api/admin/meetings', require('./routes/admin/meetings'));
app.use('/api/admin/long-game', require('./routes/admin/longGame'));
app.use('/api/admin/blog', require('./routes/admin/blogPost'));
app.use('/api/admin/achievements', require('./routes/admin/achievements'));
app.use('/api/admin/voting', require('./routes/admin/voting'));
app.use('/api/admin/equipment', require('./routes/admin/equipment'));
app.use('/api/admin/player-record', require('./routes/admin/playerRecord'));
app.use('/api/admin/oz', require('./routes/admin/ozSelect'));
app.use('/api/admin/points', require('./routes/admin/points'));
app.use('/api/admin/polls', require('./routes/admin/polls'));
app.use('/api/admin/faq', require('./routes/admin/faq'));
app.use('/api/admin/sidebar', require('./routes/admin/sidebar'));
app.use('/api/admin/semester', require('./routes/admin/semester'));

// --- HTML page routes (serve static HTML for clean URLs) ---
const pages = {
  '/': 'index.html',
  '/rules': 'rules.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/news': 'news.html',
  '/achievements': 'achievements.html',
  '/profile': 'profile.html',
  '/players': 'players.html',
  '/kill': 'kill.html',
  '/register': 'register.html',
  '/voting': 'voting.html',
  '/password-recovery': 'password-recovery.html',
  '/game-summary': 'game-summary.html',
  '/mission-tools': 'mission-tools.html',
};

for (const [route, file] of Object.entries(pages)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', file));
  });
}

// Admin pages
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html')));
app.get('/admin/:page', (req, res) => {
  const file = path.join(__dirname, '..', 'public', 'admin', req.params.page + '.html');
  res.sendFile(file, err => { if (err) res.status(404).send('Not found'); });
});

// Legacy PHP URL redirects
const legacyRedirects = {
  '/home.php': '/',
  '/index.php': '/',
  '/about.php': '/about',
  '/rules.php': '/rules',
  '/contact.php': '/contact',
  '/news.php': '/news',
  '/achievements.php': '/achievements',
  '/myProfile.php': '/profile',
  '/playerList.php': '/players',
  '/kill.php': '/kill',
  '/register.php': '/register',
  '/voting.php': '/voting',
  '/passwordRecovery.php': '/password-recovery',
  '/gameSummary.php': '/game-summary',
  '/missionTools.php': '/mission-tools',
};
for (const [old, dest] of Object.entries(legacyRedirects)) {
  app.get(old, (req, res) => res.redirect(301, dest));
}

// --- Hourly cron (currently mostly inactive, placeholder for future use) ---
cron.schedule('0 * * * *', async () => {
  try {
    await require('./services/cron').hourly();
  } catch (e) {
    console.error('Cron error:', e);
  }
});

// --- Start ---
// Trust proxy (nginx) so req.ip, secure cookies, and X-Forwarded-* work correctly
app.set('trust proxy', 1);

// Remove Express version fingerprint
app.disable('x-powered-by');

app.listen(PORT, '127.0.0.1', () => {
  console.log(`UMBC HvZ server running on port ${PORT}`);
});
