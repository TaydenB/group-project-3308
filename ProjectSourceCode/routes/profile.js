const express = require('express');
const router = express.Router();

// Authentication middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

// Default: /profile -> account tab
router.get('/profile', (req, res) => {
  const user = req.session.user;
  res.render('pages/profile.hbs', {
    active: { account: true },
    username: user.username
  });
});

// /profile/account
router.get('/profile/account', (req, res) => {
  const user = req.session.user;

  res.render('pages/profile.hbs', {
    active: { account: true },
    username: user.username,
    email: user.email || 'N/A',
    first_name: user.first_name || '',
    last_name: user.last_name || ''
  });
});

// /profile/stats — arbitrary for now
router.get('/profile/stats', (req, res) => {
  const user = req.session.user;

  res.render('pages/profile.hbs', {
    active: { stats: true },
    username: user.username,
    stats: {
      plays: 0,
      wins: 0,
      avgGuesses: 0,
      avgTime: '--'
    }
  });
});

module.exports = router;