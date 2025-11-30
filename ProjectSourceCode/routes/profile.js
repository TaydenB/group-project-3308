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
router.get('/profile/stats', async (req, res) => {
  const db = req.app.get('db');
  const user = req.session.user;

  if (!user) return res.redirect('/login');

  const query = `
    SELECT daily_plays, daily_wins, daily_total_guesses,
           challenge_plays, challenge_wins
    FROM users
    WHERE username = $1
  `;

  const data = await db.one(query, [user.username]);

  const avg_guesses =
    data.daily_plays > 0
      ? (data.daily_total_guesses / data.daily_plays).toFixed(2)
      : 0;

  return res.render('pages/profile.hbs', {
    active: { stats: true },
    username: user.username,
    stats: {
      plays: data.daily_plays,
      wins: data.daily_wins,
      avgGuesses: avg_guesses,
      avgTime: "--",
      challengePlays: data.challenge_plays,
      challengeWins: data.challenge_wins
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

    // get friends
    if(user){
      const full_name = 
      (user.first_name || user.last_name)
        ? `${user.first_name} ${user.last_name}`.trim()
        : null;

      const friends = await getAllFriends(db, username);

        // Get stats
        const statsQuery = `
        SELECT daily_plays, daily_wins, daily_total_guesses,
              challenge_plays, challenge_wins
        FROM users
        WHERE username = $1
      `;

      const data = await db.one(statsQuery, [username]);

      const avg_guesses =
        data.daily_plays > 0
          ? (data.daily_total_guesses / data.daily_plays).toFixed(2)
          : 0;

      return res.status(200).render('pages/otherProfile', {
        username: user.username,
        full_name: full_name,
        email: user.email,
        friends: friends,
        stats: {
          plays: data.daily_plays,
          wins: data.daily_wins,
          avgGuesses: avg_guesses,
          avgTime: "--",
          challengePlays: data.challenge_plays,
          challengeWins: data.challenge_wins
        }
      });
    }
    return res.status(400).render('pages/noOtherProfile', { message: "User: '" + username + "' does not exist", error: true });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Error displaying profile');
  }
});

module.exports = router;
