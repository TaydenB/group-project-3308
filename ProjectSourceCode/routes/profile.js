const express = require('express');
const router = express.Router();

// Authentication Middleware: Only logged-in users can access profile pages
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

// Default: /profile → /profile/account
router.get('/profile', (req, res) => {
  res.redirect('/profile/account');
});

// Account Tab
router.get('/profile/account', (req, res) => {
  const user = req.session.user;
  res.render('pages/profile', {
    active: { profile: true, account: true },
    username: user?.username || 'demoUser',
    name: user?.name || 'Demo Name',
    email: user?.email || 'demo@example.com',
  });
});

// Stats Tab
router.get('/profile/stats', (req, res) => {
  const user = req.session.user;
  res.render('pages/profile', {
    active: { profile: true, stats: true },
    username: user?.username || 'demoUser',
    stats: {
      plays: 20, wins: 10, avgGuesses: 4.8, avgTime: '132s',
      challengePlays: 9, challengeWins: 6
    }
  });
});