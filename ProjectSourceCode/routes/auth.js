const express = require('express'); // To build an application server or API
const bcrypt = require('bcryptjs'); //  To hash passwords
const router = express.Router();

router.get("/", (req, res) => {
  res.redirect('/login');
})

router.get("/login", (req, res) => {
  res.render('pages/login');
})

router.get("/register", (req, res) => {
  res.render('pages/register');
})

router.post("/register", async (req, res) => {
  const db = req.app.get('db');
  const username = req.body.username;
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;`

  try {
    await db.one(query, [username, hash]);
    res.redirect('/');
  }
  catch (err) {
    const error = true;
    console.log(err);
    const errorMessage = "Username already exists";
    res.render('pages/register', { message: errorMessage, error });
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
      res.render("pages/login", { message: errorMessage, error: true });
    }

  }
  catch (err) {
    console.log(err);
    res.redirect("/register");
  }
})

module.exports = router;