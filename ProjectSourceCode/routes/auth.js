const express = require('express'); // To build an application server or API
const bcrypt = require('bcryptjs'); //  To hash passwords
const router = express.Router();

router.get("/", (req, res) => {
  res.render('pages/welcome');
})

router.get("/login", (req, res) => {
  res.render('pages/login', {active: {login: true}});
})

router.get("/register", (req, res) => {
  res.render('pages/register', { active: {register: true}});
})

router.post("/register", async (req, res) => {
  const db = req.app.get('db');
  const username = req.body.username;
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;`

  try {
    await db.one(query, [username, hash]);
    res.status(201).render('pages/login', { message: "Account created successfully!", error: false, active: {login: true} });
  }
  catch (err) {
    const error = true;
    console.log(err);
    const errorMessage = "Username already exists";
    res.status(400).render('pages/register', { message: errorMessage, error, active: {register: true} });
  }
})

router.post("/login", async (req, res) => {
  const db = req.app.get('db');
  const username = req.body.username;
  const query = `SELECT * FROM users WHERE username = $1;`;

  try {
    const user = await db.oneOrNone(query, [username]);
    console.log(username, user);
    if (!user) {
      return res.redirect("/register");
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    console.log(match);

    if (match) {
      req.session.user = user;
      req.session.save();
      res.redirect("/profile");
    } else {
      const errorMessage = "Incorrect password. Please try again.";
      res.render("pages/login", { message: errorMessage, error: true, active: {login: true} });
    }

  }
  catch (err) {
    console.log(err);
    res.redirect("/register");
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('logout error')
      return res.render('pages/logout', { message: 'Error logging out', error: true, active: {logout: true} })
    }
    res.render('pages/logout', { message: 'Logged Out Successfully!', error: false, active: {logout: true} })
  });
});

module.exports = router;