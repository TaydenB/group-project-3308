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
  const recievedFriendsQuery = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'accepted'`;
  const sentFriendsQuery = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'accepted'`;

    try{
        // Get friends who initially sent the friend request, then get friends who initially recieved the request, then combine
        const recievedFreinds = await db.any(recievedFriendsQuery, [req.session.user.id]);
        const sentFriends = await db.any(sentFriendsQuery, [req.session.user.id]);
        const friends = [...recievedFreinds, ...sentFriends];

        console.log(friends, recievedFreinds, sentFriends);
        res.render('pages/social.hbs', {active: { friends: true }, friends: friends});
    }
    catch (err) {
        console.log(err);
        res.render('pages/social.hbs', {active: { friends: true }});
    }
  
});

router.get('/profile/social/requests', async (req, res) => {
  const db = req.app.get('db');
  const query = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
    try{
        const friends = await db.any(query, [req.session.user.id]);
        console.log(friends);
        res.render('pages/friendRequests.hbs', {active: { requests: true }, friends: friends});
    }
    catch (err) {
        console.log(err);
        res.render('pages/friendRequests.hbs', {active: { requests: true }});
    }
  
});
router.post("/profile/social/requests/decline", async (req, res) => {
  const db = req.app.get('db');
  const friendId = req.body.friend_id;

  const userId = req.session.user.id;
  try {
      
      const query = `DELETE FROM friends WHERE user_id = $1 AND friend_id = $2;`
      await db.none(query, [friendId, userId]);
      
      // Update requests html
      const queryFriendRequests = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
      friends = await db.any(queryFriendRequests, [userId]);
      return res.render("pages/friendRequests.hbs", {active: { requests: true }, friends: friends, message: "Request Declined", error: false });
    }
    catch (err) {
      console.log(err);
    }
});
router.post("/profile/social/requests/accept", async (req, res) => {
  const db = req.app.get('db');
  const friendId = req.body.friend_id;

  const userId = req.session.user.id;
  try {
      
      const query = `UPDATE friends SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2;`
      await db.none(query, [friendId, userId]);
      
      // Update requests html
      const queryFriendRequests = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
      friends = await db.any(queryFriendRequests, [userId]);
      return res.render("pages/friendRequests.hbs", {active: { requests: true }, friends: friends, message: "Request Accepted", error: false });
    }
    catch (err) {
      console.log(err);
    }
});
router.get('/profile/social/requests/sent', async (req, res) => {
  const db = req.app.get('db');
  const query = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;
    try{
        const friends = await db.any(query, [req.session.user.id]);
        console.log(friends);
        res.render('pages/sentFriendRequests.hbs', {active: { sent: true }, friends: friends});
    }
    catch (err) {
        console.log(err);
        res.render('pages/sentFriendRequests.hbs',{active: { sent: true }});
    }
  
});
router.post("/profile/social/requests/sent", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.add_friend;

  const queryUserExists = `SELECT * FROM users WHERE username = $1`
  const querySentFriends = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;

  const userId = req.session.user.id;
  try {
      let friends = await db.any(querySentFriends, [userId]);

      // Check if trying to friend self
      if(friendUsername == req.session.user.username){
        const errorMessage = "Can't friend yourself.";
        return res.render("pages/sentFriendRequests.hbs", {active: { sent: true }, friends: friends, message: errorMessage, error: true });
      }

      // Check for valid username
      const userFriend = await db.oneOrNone(queryUserExists, [friendUsername]);
      console.log(userFriend);
      if (!userFriend) {
        const errorMessage = "Username does not exist.";
        return res.render("pages/sentFriendRequests.hbs", {active: { sent: true }, friends: friends, message: errorMessage, error: true });
      }
      
      // Check if friendship already exists
      const queryFriendshipExists = `SELECT * FROM friends 
        WHERE ( (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) );`
      const existing = await db.any(queryFriendshipExists, [userId, userFriend.id]);
      if(existing.length > 0){
        const errorMessage = "Already existing friendship or request.";
        return res.render("pages/sentFriendRequests.hbs", {active: { sent: true }, friends: friends, message: errorMessage, error: true });
      }

      // Add new friend
      const newFriendQuery = `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending');`
      await db.none(newFriendQuery, [userId, userFriend.id]);

      // Update html
      friends = await db.any(querySentFriends, [userId]);
      return res.render("pages/sentFriendRequests.hbs", {active: { sent: true }, friends: friends, message: "Friend request sent successfully", error: false });
    }
    catch (err) {
      console.log(err);
    }
});
router.post("/profile/social/requests/sent/cancel", async (req, res) => {
  const db = req.app.get('db');
  const friendId = req.body.friend_id;

  const userId = req.session.user.id;
  try {
      
      const query = `DELETE FROM friends WHERE user_id = $1 AND friend_id = $2;`
      await db.none(query, [userId, friendId]);
      
      // Update sent requests html
      const querySentFriends = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;
      friends = await db.any(querySentFriends, [userId]);
      return res.render("pages/sentFriendRequests.hbs", {active: { sent: true }, friends: friends, message: "Request cancelled successfully", error: false });
    }
    catch (err) {
      console.log(err);
    }
});

module.exports = router;