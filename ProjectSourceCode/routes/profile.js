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

router.get('/home', async (req, res) => {
  res.render('pages/home.hbs');
  
});
router.get('/profile', async (req, res) => {

  res.render('pages/profile.hbs');

});

router.get('/profile/social', async (req, res) => {
  res.render('pages/social.hbs');
  
});

router.get('/daily', async (req,res) => {
  
  res.render('pages/daily.hbs');
  
});

router.get('/profile/social/requests', async (req, res) => {
  const db = req.app.get('db');
  const query = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
    try{
        const friends = await db.any(query, [req.session.user.id]);
        console.log(friends);
        res.render('pages/friendRequests.hbs', {friends: friends});
    }
    catch (err) {
        console.log(err);
        res.render('pages/friendRequests.hbs');
    }
  
});

router.post("/profile/social/requests", async (req, res) => {
  const db = req.app.get('db');
  const friendUsername = req.body.add_friend;

  const queryUserExists = `SELECT * FROM users WHERE username = $1`
  const queryFriends = `SELECT u.id, u.username FROM friends f 
  JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;

  const userId = req.session.user.id;
  try {
      let friends = await db.any(queryFriends, [userId]);

      // Check if trying to friend self
      if(friendUsername == req.session.user.username){
        const errorMessage = "Can't friend yourself.";
        return res.render("pages/friendRequests.hbs", {friends: friends, message: errorMessage, error: true });
      }

      // Check for valid username
      const userFriend = await db.oneOrNone(queryUserExists, [friendUsername]);
      console.log(userFriend);
      if (!userFriend) {
        const errorMessage = "Username does not exist.";
        return res.render("pages/friendRequests.hbs", {friends: friends, message: errorMessage, error: true });
      }
      
      // Check if friendship already exists
      const queryFriendshipExists = `SELECT * FROM friends 
        WHERE ( (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) );`
      const existing = await db.any(queryFriendshipExists, [userId, userFriend.id]);
      if(existing.length > 0){
        const errorMessage = "Already existing friendship or request.";
        return res.render("pages/friendRequests.hbs", {friends: friends, message: errorMessage, error: true });
      }

      // Add new friend
      const newFriendQuery = `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending');`
      await db.none(newFriendQuery, [userId, userFriend.id]);
      friends = await db.any(queryFriends, [userId]);
      return res.render("pages/friendRequests.hbs", {friends: friends, message: "Friend request sent successfully", error: false });
    }
    catch (err) {
      console.log(err);
    }
})


router.get('/logout', async (req, res) => {

});

module.exports = router;