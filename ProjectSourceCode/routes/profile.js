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


// /profile/account
router.get('/profile/account', async (req, res) => {
  const db = req.app.get('db');

  const user = req.session.user;

  try {
    const row = await db.oneOrNone(
      'SELECT first_name, last_name, email FROM users WHERE id = $1',
      [user.id]
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
  } catch (err){
    console.error('Error loading profile:', err);
    res.status(500).send('Error loading profile');
  }
});


router.post('/profile/account', async (req, res) => {
  const db = req.app.get('db');
  const user = req.session.user;
  const { first_name, last_name, email } = req.body;

  try {
    await db.none(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3 
       WHERE id = $4`,
      [first_name || null, last_name || null, email || null, user.id]
    );

    // Keep session in sync so changes show up immediately
    user.first_name = first_name || null;
    user.last_name = last_name || null;
    user.email = email || null;
    req.session.user = user;
    
    res.redirect('/profile/account');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Error updating profile');
  }
});


// /profile/stats — arbitrary for now
router.get('/profile/stats', (req, res) => {
  const db = req.app.get('db');

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