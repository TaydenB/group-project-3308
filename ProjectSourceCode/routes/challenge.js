const express = require('express'); // To build an application server or API
const router = express.Router();
const fs = require('fs');
const sowpods = require('sowpods-five');
const { getChallengeFromUsers, getAllFriends } = require('../public/resources/socialHelpers.js');

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

router.get('/challenge', async (req, res) => {
  res.redirect('/profile/social');
});

router.post("/profile/social/challenge", async (req, res) => {
    const db = req.app.get('db');
    const userUsername = req.session.user.username;
    const friendUsername = req.body.friend_username;
    const word = req.body.word.toLowerCase();

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: [],
        message: "",
        error: false
    }

    try {
        let friends = await getAllFriends(db, req.session.user.username);
        socialObj.friends = friends;

        // Check if challenge already exists
        const challenge = await getChallengeFromUsers(db, userUsername, friendUsername);
        if (challenge) {
            const errorMessage = "Already existing challenge.";
            socialObj.message = errorMessage;
            socialObj.error = true;
            return res.status(400).render("pages/social.hbs", socialObj);
        }
        
        // Check if word is 5 letters long
        if (!/^[a-z]{5}$/.test(word)) {
            socialObj.error = true;
            socialObj.message = "Word not 5 letters long";
            return res.status(400).render('pages/social.hbs', socialObj);
        }

        // Check if word is an actual word
        if (!sowpods.includes(word)) {
            socialObj.error = true;
            socialObj.message = "Word is not a real word";
            return res.status(400).render('pages/social.hbs', socialObj);
        }
        const sendChallengeQuery = `INSERT INTO challenge (user_word, user_username, friend_username) VALUES ($1, $2, $3)`;
        await db.none(sendChallengeQuery, [word, userUsername, friendUsername]);
        
        // Update html
        friends = await getAllFriends(db, req.session.user.username);
        socialObj.message = "Challenge sent successfully";
        socialObj.friends = friends;
        return res.status(201).render("pages/social.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error sending challenge');
    }
});

router.post("/profile/social/challenge/cancel", async (req, res) => {
    const db = req.app.get('db');
    const userUsername = req.session.user.username;
    const friendUsername = req.body.friend_username;

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: [],
        message: "",
        error: false
    }
    
    try {
        const query = `DELETE FROM challenge WHERE user_username = $1 AND friend_username = $2;`
        await db.none(query, [userUsername, friendUsername]);
        
        // Update html
        friends = await getAllFriends(db, req.session.user.username);
        socialObj.message = "Challenge cancelled successfully";
        socialObj.friends = friends;
        return res.status(201).render("pages/social.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error canceling challenge');
    }
});

router.post("/profile/social/challenge/accept", async (req, res) => {
    const db = req.app.get('db');
    const userUsername = req.session.user.username;
    const friendUsername = req.body.friend_username;
    const word = req.body.word.toLowerCase();

    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: [],
        message: "",
        error: false
    }

    try {
        let friends = await getAllFriends(db, req.session.user.username);
        socialObj.friends = friends;
        
        // Check if word is 5 letters long
        if (!/^[a-z]{5}$/.test(word)) {
            socialObj.error = true;
            socialObj.message = "Word not 5 letters long";
            return res.status(400).render('pages/social.hbs', socialObj);
        }

        // Check if word is an actual word
        if (!sowpods.includes(word)) {
            socialObj.error = true;
            socialObj.message = "Word is not a real word";
            return res.status(400).render('pages/social.hbs', socialObj);
        }
        const acceptChallengeQuery = `UPDATE challenge SET friend_word = $1, status = 'play' 
        WHERE (user_username = $2 AND friend_username = $3)`;
        await db.none(acceptChallengeQuery, [word, friendUsername, userUsername]);
        
        // Update html
        friends = await getAllFriends(db, req.session.user.username);
        socialObj.message = "Challenge accepted successfully";
        socialObj.friends = friends;
        return res.status(201).render("pages/social.hbs", socialObj);
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error sending challenge');
    }
});
router.post('/profile/social/challenge/play', (req, res) => {
    req.session.friendUsername = req.body.friend_username;
    res.redirect('/profile/social/challenge/play'); 
});
router.get('/profile/social/challenge/play', async (req, res) => {
    // start the game with friend
    const db = req.app.get('db');
    const userUsername = req.session.user.username;
    const friendUsername = req.session.friendUsername;

  try {
    const challenge = await getChallengeFromUsers(db, userUsername, friendUsername);
    const friends = await getAllFriends(db, req.session.user.username);
    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: friends,
        message: "No challenge exists to play",
        error: true
      }
    // Make sure challenge exists
    if(!challenge){
      return res.status(400).render('pages/social.hbs', socialObj);
    }

    // Start challenge game by sending appropriate word
    if(challenge.user_username === userUsername){
      // If user already has a score don't let them play again
      if(challenge.user_score){
        socialObj.message = "Challenge has already been played";
        return res.status(400).render('pages/social.hbs', socialObj);
      }
      const progress = {
            guesses: challenge.user_progress,
            row: challenge.user_progress.length,
            completed: (challenge.status === "wating_friend")
        }
      return res.status(200).render('pages/challengeGame.hbs', { word: challenge.friend_word, friendUsername: friendUsername, challengeProgress: progress});
    }else{
      // If user already has a score don't let them play again
      if(challenge.friend_score){
        socialObj.message = "Challenge has already been played";
        return res.status(400).render('pages/social.hbs', socialObj);
      }

      const progress = {
            guesses: challenge.friend_progress,
            row: challenge.friend_progress.length,
            completed: (challenge.status === "waiting_user")
        }
      return res.status(200).render('pages/challengeGame.hbs', { word: challenge.user_word, friendUsername: friendUsername, challengeProgress: progress});
    }
  } catch (err) {
    const friends = await getAllFriends(db, req.session.user.username);
    const socialObj = {
        userUsername: req.session.user.username,
        active: { social: true },
        activeSocial: { friends: true },
        friends: friends,
        message: "No challenge exists to play",
        error: true
      }
    return res.status(400).render('pages/social.hbs', socialObj);
  }
});
async function getFriendByName(db, userUsername, friendUsername) {
  const getFriendQuery = `SELECT * FROM friends WHERE (user_username = $1 AND friend_username = $2) OR (friend_username = $1 AND user_username = $2);`
  const friend = await db.oneOrNone(getFriendQuery,[userUsername, friendUsername]);

  return friend;
}
router.post('/profile/social/challenge/result', async (req, res) => {
    const db = req.app.get('db');
    const score = req.body.score;
    const userUsername = req.session.user.username;
    const friendUsername = req.body.friendUsername; 
    
    try {
        // Check if challenge actually exists
        const challenge = await getChallengeFromUsers(db, userUsername, friendUsername);
        if(!challenge){
          const friends = await getAllFriends(db, req.session.user.username);
          const socialObj = {
              userUsername: req.session.user.username,
              active: { social: true },
              activeSocial: { friends: true },
              friends: friends,
              message: "No challenge to update",
              error: true
            }
          return res.status(400).render('pages/social.hbs', socialObj);
        }
        // Update appropriate score
        let userScore = null;
        let friendScore = null;

        if(challenge.user_username === userUsername){
          await db.none(`UPDATE challenge SET user_score = $1 WHERE id = $2;`, [score, challenge.id]);

          userScore = score;
          // If friend doesn't have a score yet update status
          if(challenge.friend_score){
            friendScore = challenge.friend_score;
          }else{
            await db.none(`UPDATE challenge SET status = $1 WHERE id = $2;`, ['waiting_friend', challenge.id]);
          }
        }else{
          await db.none(`UPDATE challenge SET friend_score = $1 WHERE id = $2;`, [score, challenge.id]);
          
          friendScore = score;
          // If user doesn't have a score yet update status
          if(challenge.user_score){
            userScore = challenge.user_score;
          }
          else{
            await db.none(`UPDATE challenge SET status = $1 WHERE id = $2;`, ['waiting_user', challenge.id]);
          }
        }
        // If both scores are set challenge is complete so delete
        if(userScore && friendScore){
          const friend = await getFriendByName(db, userUsername, friendUsername);
          if(!friend){
            res.status(500).json({ error: 'Friendship does not exist' });
          }
          
          // If order of friend and challenge names is switched switch score order
          if(friend.user_username != challenge.user_username){
            const temp = userScore;
            userScore = friendScore;
            friendScore = temp;
          }
          console.log(userScore, friendScore);
          // Update record between players
          if(userScore > friendScore){
            const updateRecordQuery = `UPDATE friends SET user_wins = $1 WHERE 
            (user_username = $2 AND friend_username = $3) OR (friend_username = $2 AND user_username = $3);`;
            await db.none(updateRecordQuery, [friend?.user_wins+1 || 1, userUsername, friendUsername]);
          }else if(friendScore > userScore){
            const updateRecordQuery = `UPDATE friends SET friend_wins = $1 WHERE 
            (user_username = $2 AND friend_username = $3) OR (friend_username = $2 AND user_username = $3);`;
            await db.none(updateRecordQuery, [friend?.friend_wins+1 || 1, userUsername, friendUsername]);
          }else{
            const updateRecordQuery = `UPDATE friends SET ties = $1 WHERE 
            (user_username = $2 AND friend_username = $3) OR (friend_username = $2 AND user_username = $3);`;
            await db.none(updateRecordQuery, [friend?.ties+1 || 1, userUsername, friendUsername]);
          }
          
          await db.none(`
              UPDATE users
              SET challenge_plays = challenge_plays + 1,
                  challenge_wins = challenge_wins + CASE WHEN $1 THEN 1 ELSE 0 END
              WHERE username = $2
          `, [userScore < friendScore, userUsername]);

          await db.none(`
              UPDATE users
              SET challenge_plays = challenge_plays + 1,
                  challenge_wins = challenge_wins + CASE WHEN $1 THEN 1 ELSE 0 END
              WHERE username = $2
          `, [friendScore < userScore, friendUsername]);


          // Delete challenge
          await db.none(`DELETE FROM challenge WHERE id = $1;`,[challenge.id]);
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database update failed' });
    }
});

router.post('/profile/social/challenge/save', async (req, res) => {
    console.log("saving");
    const db = req.app.get('db');
    const user = req.session.user;
    const userUsername = req.session.user.username;
    const friendUsername = req.body.friendUsername; 

    const challenge = await getChallengeFromUsers(db, userUsername, friendUsername);
    if (!challenge) return res.status(401).send();

    const progressColumn = challenge.user_username === userUsername ? "user_progress" : "friend_progress";

    const { guess, row, completed } = req.body;
    
    const query = `
        UPDATE challenge
        SET ${progressColumn} = 
            COALESCE(${progressColumn}, '[]'::jsonb) || to_jsonb($1::text)
        WHERE id = $2
    `;

    await db.none(query, [guess, challenge.id]);
    res.status(200).send();
});

module.exports = router;
