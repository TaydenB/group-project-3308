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

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: []
    }
    try{
        // Get friends who initially sent the friend request, then get friends who initially recieved the request, then combine
        const recievedFreinds = await db.any(recievedFriendsQuery, [req.session.user.id]);
        const sentFriends = await db.any(sentFriendsQuery, [req.session.user.id]);
        const friends = [...recievedFreinds, ...sentFriends];

        console.log(friends, recievedFreinds, sentFriends);
        socialObj.friends = friends;
        res.render('pages/social.hbs', socialObj);
    }
    catch (err) {
        console.log(err);
        res.render('pages/social.hbs', socialObj);
    }
  
});

router.get('/profile/social/requests', async (req, res) => {
    const db = req.app.get('db');
    const query = `SELECT u.id, u.username FROM friends f 
    JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: []
    }
    try{
        const friends = await db.any(query, [req.session.user.id]);
        console.log(friends);
        
        socialObj.friends = friends;
        res.render('pages/friendRequests.hbs', socialObj);
    }
    catch (err) {
        console.log(err);
        res.render('pages/friendRequests.hbs', socialObj);
    }
  
});
router.post("/profile/social/requests/decline", async (req, res) => {
    const db = req.app.get('db');
    const friendId = req.body.friend_id;
    const userId = req.session.user.id;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: [],
        error: false
    }
    try {
        
        const query = `DELETE FROM friends WHERE user_id = $1 AND friend_id = $2;`
        await db.none(query, [friendId, userId]);
        
        // Update requests html
        const queryFriendRequests = `SELECT u.id, u.username FROM friends f 
        JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
        const friends = await db.any(queryFriendRequests, [userId]);

        socialObj.friends = friends;
        socialObj["message"] = "Request Declined";

        return res.render("pages/friendRequests.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
    }
});
router.post("/profile/social/requests/accept", async (req, res) => {
    const db = req.app.get('db');
    const friendId = req.body.friend_id;
    const userId = req.session.user.id;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { requests: true },
        friends: [],
        error: false
    }

    try {
        const query = `UPDATE friends SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2;`
        await db.none(query, [friendId, userId]);
        
        // Update requests html
        const queryFriendRequests = `SELECT u.id, u.username FROM friends f 
        JOIN users u ON u.id = f.user_id WHERE f.friend_id = $1 AND f.status = 'pending'`;
        const friends = await db.any(queryFriendRequests, [userId]);

        socialObj.friends = friends;
        socialObj["message"] = "Request Accepted";

        return res.render("pages/friendRequests.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
    }
});
router.get('/profile/social/requests/sent', async (req, res) => {
    const db = req.app.get('db');
    const query = `SELECT u.id, u.username FROM friends f 
    JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: []
    }

    try{
        const friends = await db.any(query, [req.session.user.id]);
        console.log(friends);

        socialObj.friends = friends;
        res.render('pages/sentFriendRequests.hbs', socialObj);
    }
    catch (err) {
        console.log(err);
        res.render('pages/sentFriendRequests.hbs', socialObj);
    }
  
});
router.post("/profile/social/requests/sent", async (req, res) => {
    const db = req.app.get('db');
    const friendUsername = req.body.add_friend;
    const userId = req.session.user.id;

    const queryUserExists = `SELECT * FROM users WHERE username = $1`
    const querySentFriends = `SELECT u.id, u.username FROM friends f 
    JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: [],
        message: "",
        error: false
    }
    try {
        let friends = await db.any(querySentFriends, [userId]);
        socialObj.friends = friends;

        // Check if trying to friend self
        if(friendUsername == req.session.user.username){
            const errorMessage = "Can't friend yourself.";
            socialObj.message = errorMessage;
            socialObj.error = true;
            return res.render("pages/sentFriendRequests.hbs", socialObj);
        }

        // Check for valid username
        const userFriend = await db.oneOrNone(queryUserExists, [friendUsername]);
        console.log(userFriend);
        if (!userFriend) {
            const errorMessage = "Username does not exist.";
            socialObj.message = errorMessage;
            socialObj.error = true;
            return res.render("pages/sentFriendRequests.hbs", socialObj);
        }
        
        // Check if friendship already exists
        const queryFriendshipExists = `SELECT * FROM friends 
        WHERE ( (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) );`
        const existing = await db.any(queryFriendshipExists, [userId, userFriend.id]);

        if(existing.length > 0){
            const errorMessage = "Already existing friendship or request.";
            socialObj.message = errorMessage;
            socialObj.error = true;
            return res.render("pages/sentFriendRequests.hbs", socialObj);
        }

        // Add new friend
        const newFriendQuery = `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending');`
        await db.none(newFriendQuery, [userId, userFriend.id]);

        // Update html
        friends = await db.any(querySentFriends, [userId]);
        
        socialObj.message = "Friend request sent successfully";
        socialObj.friends = friends;
        return res.render("pages/sentFriendRequests.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
    }
});
router.post("/profile/social/requests/sent/cancel", async (req, res) => {
    const db = req.app.get('db');
    const friendId = req.body.friend_id;
    const userId = req.session.user.id;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { sent: true },
        friends: [],
        message: "",
        error: false
    }

    try {
        const query = `DELETE FROM friends WHERE user_id = $1 AND friend_id = $2;`
        await db.none(query, [userId, friendId]);
        
        // Update sent requests html
        const querySentFriends = `SELECT u.id, u.username FROM friends f 
        JOIN users u ON u.id = f.friend_id WHERE f.user_id = $1 AND f.status = 'pending'`;
        const friends = await db.any(querySentFriends, [userId]);
        socialObj.message = "Request cancelled Successfully";
        socialObj.friends = friends;
        return res.render("pages/sentFriendRequests.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;