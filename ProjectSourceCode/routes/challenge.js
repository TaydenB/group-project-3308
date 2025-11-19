const express = require('express'); // To build an application server or API
const router = express.Router();
const fs = require('fs');
const sowpods = require('sowpods-five');

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

router.get('/challenge', async (req, res) => {
  res.render('pages/challenge');
});

router.post('/challenge', async (req, res) => {
  const db = req.app.get('db');
  const word = req.body.word.toLowerCase();
  if (!/^[a-z]{5}$/.test(word)) {
    return res.status(400).render('pages/challenge', { message: "Word not 5 letters long", error: true });
  }
  if (!sowpods.includes(word)) {
    return res.status(400).render('pages/challenge', { message: "Word is not a real word", error: true });
  }
  const newChallengeID = await db.one(`INSERT INTO challenge(word, username) VALUES ($1, $2) RETURNING id;`, [word, req.session.user.username]);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const challengeLink = `${baseUrl}/challenge/game/${newChallengeID.id}`;
  console.log(newChallengeID)
  return res.status(201).render('pages/challenge', { message: "Challenge successfully created", link: challengeLink, error: false });
});

router.get('/challenge/game/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = req.params.id;
  try {
    const word = await db.oneOrNone(`SELECT word FROM challenge WHERE id = ${id}`);
    return res.status(200).render('pages/challenge-game', { message: "Game successfully created and accesed", word: word.word, error: false });
  } catch (err) {
    return res.status(404).render('pages/challenge-game', { message: "Game not created and accesed", error: true });
  }
});

module.exports = router;
