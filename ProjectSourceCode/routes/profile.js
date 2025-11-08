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

module.exports = router;