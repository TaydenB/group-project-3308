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
  return res.redirect('/profile/account');
});

// -----------------------------
// Account DISPLAY page (no form)
// -----------------------------
router.get('/profile/account', async (req, res) => {
  const db = req.app.get('db');
  const user = req.session.user;

  try {
    const row = await db.oneOrNone(
      'SELECT first_name, last_name, email FROM users WHERE username = $1',
      [user.username]
    );

    const first_name = row?.first_name || '';
    const last_name = row?.last_name || '';
    const email = row?.email || '';

    const full_name =
      (first_name || last_name)
        ? `${first_name} ${last_name}`.trim()
        : null;

    res.render('pages/profile.hbs', {
      active: { account: true },
      username: user.username,
      first_name,
      last_name,
      full_name,
      email,
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Error loading profile');
  }
});

// -----------------------------
// Account EDIT page (GET form)
// -----------------------------
router.get('/profile/account/edit', async (req, res) => {
  const db = req.app.get('db');
  const user = req.session.user;

  try {
    const row = await db.oneOrNone(
      'SELECT first_name, last_name, email FROM users WHERE username = $1',
      [user.username]
    );

    const first_name = row?.first_name || '';
    const last_name = row?.last_name || '';
    const email = row?.email || '';

    res.render('pages/profileEdit.hbs', {
      active: { account: true, edit: true },
      username: user.username,
      first_name,
      last_name,
      email,
      // no message/error on initial load
    });
  } catch (err) {
    console.error('Error loading profile edit page:', err);
    res.status(500).send('Error loading edit page');
  }
});

// -----------------------------
// Account EDIT page (POST update)
// -----------------------------
router.post('/profile/account/edit', async (req, res) => {
  const db = req.app.get('db');
  const user = req.session.user;
  const { first_name, last_name, email } = req.body;

  try {
    await db.none(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3 
       WHERE username = $4`,
      [first_name || null, last_name || null, email || null, user.username]
    );

    // Keep session in sync so changes show up immediately
    user.first_name = first_name || null;
    user.last_name = last_name || null;
    user.email = email || null;
    req.session.user = user;

    // Re-query to get clean values (optional, but ensures consistency)
    const row = await db.oneOrNone(
      'SELECT first_name, last_name, email FROM users WHERE username = $1',
      [user.username]
    );

    const updatedFirst = row?.first_name || '';
    const updatedLast = row?.last_name || '';
    const updatedEmail = row?.email || '';

    res.render('pages/profileEdit.hbs', {
      active: { account: true, edit: true },
      username: user.username,
      first_name: updatedFirst,
      last_name: updatedLast,
      email: updatedEmail,
      message: 'Account information updated successfully!',
      error: false,
    });
  } catch (err) {
    console.error('Error updating profile:', err);

    res.status(500).render('pages/profileEdit.hbs', {
      active: { account: true, edit: true },
      username: user.username,
      first_name,
      last_name,
      email,
      message: 'Error updating account information. Please try again.',
      error: true,
    });
  }
});

// -----------------------------
// /profile/stats 
// -----------------------------
router.get('/profile/stats', (req, res) => {
  const user = req.session.user;

  res.render('pages/profile.hbs', {
    active: { stats: true },
    username: user.username,
    stats: {
      plays: 0,
      wins: 0,
      avgGuesses: 0,
      avgTime: '--',
      challengePlays: 0,
      challengeWins: 0,
    },
  });
});

module.exports = router;
