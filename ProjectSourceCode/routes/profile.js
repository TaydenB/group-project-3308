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
       WHERE username = $4`,
      [first_name || null, last_name || null, email || null, user.username]
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

async function getAllFriends(db, username) {
    const recievedFriendsQuery = `SELECT u.username, u.first_name, u.last_name FROM friends f 
    JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'accepted'`;
    const sentFriendsQuery = `SELECT u.username, u.first_name, u.last_name FROM friends f 
    JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'accepted'`;

    // Get friends who initially sent the friend request, then get friends who initially recieved the request, then combine
    const received = await db.any(recievedFriendsQuery, [username]);
    const sent = await db.any(sentFriendsQuery, [username]);
    const friends = [...received, ...sent];
    return friends;
}

router.get('/profile/display/:username', async (req, res) => {
  const db = req.app.get('db');
  const username = req.params.username;
  
  try {
    const user = await db.oneOrNone(`SELECT username, first_name, last_name, email FROM users WHERE username = $1`, [username]);
    if(user){
      const full_name = 
      (user.first_name || user.last_name)
        ? `${user.first_name} ${user.last_name}`.trim()
        : null;

      const friends = await getAllFriends(db, username);

      return res.status(200).render('pages/otherProfile', {
        username: user.username,
        full_name: full_name,
        email: user.email,
        friends: friends
      });
    }
    return res.status(400).render('pages/noOtherProfile', { message: "User: '" + username + "' does not exist", error: true });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Error displaying profile');
  }
});

module.exports = router;