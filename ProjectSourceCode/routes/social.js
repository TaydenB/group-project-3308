const express = require('express'); // To build an application server or API
const router = express.Router();

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

router.get('/profile/social', async (req, res) => {
  const db = req.app.get('db');
  const recievedFriendsQuery = `SELECT u.username FROM friends f 
  JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'accepted'`;
  const sentFriendsQuery = `SELECT u.username FROM friends f 
  JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'accepted'`;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: []
    }
  try {
        // Get friends who initially sent the friend request, then get friends who initially recieved the request, then combine
        const recievedFreinds = await db.any(recievedFriendsQuery, [req.session.user.username]);
        const sentFriends = await db.any(sentFriendsQuery, [req.session.user.username]);
        const friends = [...recievedFreinds, ...sentFriends];

        console.log(friends, recievedFreinds, sentFriends);
        socialObj.friends = friends;
        res.status(200).render('pages/social.hbs', socialObj);
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error loading friends');
    }

});

router.get('/profile/social/requests', async (req, res) => {
  const db = req.app.get('db');
  const query = `SELECT u.username FROM friends f 
  JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'pending'`;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: []
    }
  try {
    const friends = await db.any(query, [req.session.user.username]);
    console.log(friends);
    socialObj.friends = friends;
        res.status(200).render('pages/friendRequests.hbs', socialObj);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Error loading friend requests');
  }

});
router.post("/profile/social/requests/decline", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.friend_username;
  const userUsername = req.session.user.username;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: [],
        error: false
    }
  try {

    const query = `DELETE FROM friends WHERE user_username = $1 AND friend_username = $2;`
    await db.none(query, [friendUsername, userUsername]);

    // Update requests html
    const queryFriendRequests = `SELECT u.username FROM friends f 
    JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'pending'`;
    const friends = await db.any(queryFriendRequests, [userUsername]);

    socialObj.friends = friends;
    socialObj["message"] = "Request Declined";

    return res.status(201).render("pages/friendRequests.hbs", socialObj);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Error declining friend requests');
  }
});
router.post("/profile/social/requests/accept", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.friend_username;
  const userUsername = req.session.user.username;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: [],
        error: false
    }
  try {

    const query = `UPDATE friends SET status = 'accepted' WHERE user_username = $1 AND friend_username = $2;`
    await db.none(query, [friendUsername, userUsername]);

    // Update requests html
    const queryFriendRequests = `SELECT u.username FROM friends f 
    JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'pending'`;
    const friends = await db.any(queryFriendRequests, [userUsername]);

    socialObj.friends = friends;
    socialObj["message"] = "Request Accepted";

    return res.status(201).render("pages/friendRequests.hbs", socialObj)
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Error accepting friend request');
  }
});
router.get('/profile/social/requests/sent', async (req, res) => {
  const db = req.app.get('db');
  const query = `SELECT u.username FROM friends f 
  JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'pending'`;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: []
    }

  try {
    const friends = await db.any(query, [req.session.user.username]);
    console.log(friends);
    
    socialObj.friends = friends;
    res.status(200).render('pages/sentFriendRequests.hbs', socialObj);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Error loading sent friend requests');
  }

});
router.post("/profile/social/requests/sent", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.add_friend;

  const queryUserExists = `SELECT * FROM users WHERE username = $1`
  const querySentFriends = `SELECT u.username FROM friends f 
  JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'pending'`;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: [],
        message: "",
        error: false
    }
  const userUsername = req.session.user.username;
  try {
    let friends = await db.any(querySentFriends, [userUsername]);
    socialObj.friends = friends;

    // Check if trying to friend self
    if(friendUsername == req.session.user.username){
        const errorMessage = "Can't friend yourself.";
        socialObj.message = errorMessage;
        socialObj.error = true;
        return res.status(400).render("pages/sentFriendRequests.hbs", socialObj);
    }

    // Check for valid username
    const userFriend = await db.oneOrNone(queryUserExists, [friendUsername]);
    console.log(userFriend);
    if (!userFriend) {
        const errorMessage = "Username does not exist.";
        socialObj.message = errorMessage;
        socialObj.error = true;
        return res.status(400).render("pages/sentFriendRequests.hbs", socialObj);
    }

    // Check if friendship already exists
    const queryFriendshipExists = `SELECT * FROM friends 
        WHERE ( (user_username = $1 AND friend_username = $2) OR (user_username = $2 AND friend_username = $1) );`
    const existing = await db.any(queryFriendshipExists, [userUsername, userFriend.username]);
    if (existing.length > 0) {
        const errorMessage = "Already existing friendship or request.";
        socialObj.message = errorMessage;
        socialObj.error = true;
        return res.status(400).render("pages/sentFriendRequests.hbs", socialObj);
    }

    // Add new friend
    const newFriendQuery = `INSERT INTO friends (user_username, friend_username, status) VALUES ($1, $2, 'pending');`
    await db.none(newFriendQuery, [userUsername, userFriend.username]);

    // Update html
    friends = await db.any(querySentFriends, [userUsername]);

    socialObj.message = "Friend request sent successfully";
    socialObj.friends = friends;
    return res.status(201).render("pages/sentFriendRequests.hbs", socialObj);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Unexpected error when sending friend request');
  }
});
router.post("/profile/social/requests/sent/cancel", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.friend_username;
  const userUsername = req.session.user.username;

  const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: [],
        message: "",
        error: false
    }
  try {

    const query = `DELETE FROM friends WHERE user_username = $1 AND friend_username = $2;`
    await db.none(query, [userUsername, friendUsername]);
    console.log(userUsername, friendUsername);
    // Update sent requests html
    const querySentFriends = `SELECT u.username FROM friends f 
    JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'pending'`;
    
    const friends = await db.any(querySentFriends, [userUsername]);
    socialObj.message = "Request Cancelled Successfully";
    socialObj.friends = friends;
    return res.status(201).render("pages/sentFriendRequests.hbs", socialObj);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Error cancelling friend request');
  }
});

module.exports = router;