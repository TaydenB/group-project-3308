const express = require('express'); // To build an application server or API
const router = express.Router();

router.get('/home', async (req, res) => {

  res.render('pages/home.hbs');

});

router.get('/daily', async (req,res) => {
  
  res.render('pages/daily.hbs');
  
});

module.exports = router;
