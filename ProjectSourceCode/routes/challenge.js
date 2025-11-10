const express = require('express'); // To build an application server or API
const router = express.Router();

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
router.use(auth);

router.get('/challenge', async (req, res) => {
  res.render('pages/challenge.hbs');
});

module.exports = router;
