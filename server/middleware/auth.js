// Authentication middleware

// Require any logged-in user
function requireLogin(req, res, next) {
  if (!req.session.uid) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// Require minimum admin level
function requireAdmin(level) {
  return (req, res, next) => {
    if (!req.session.uid) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    if ((req.session.isAdmin || 0) < level) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Require minimum long-game auth level
function requireLongGameAuth(level) {
  return (req, res, next) => {
    if (!req.session.uid) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    if ((req.session.isLongGameAuthed || 0) < level) {
      return res.status(403).json({ error: 'Insufficient long game permissions' });
    }
    next();
  };
}

module.exports = { requireLogin, requireAdmin, requireLongGameAuth };
