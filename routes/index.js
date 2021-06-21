const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const userid = req.session.userid;
  const isAuth = Boolean(userid);
  const guest = req.session.guest;
  console.log(`isAuth: ${isAuth}`);
  console.log(`guest: ${guest}`);

  if(isAuth){
    res.render('index', {
      name: req.session.username,
      user: 1,
      link: '"/logout">ログアウト'
    });
  }else if(guest){
    res.render('index', {
      user: 0,
      link: '"/signup">サインアップ'
    });
  }else{
    res.redirect('/signin');
  }
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));
router.use('/guest', require('./guest'));
router.use('/result', require('./result'));
router.use('/score', require('./score'));
router.use('/pwauth', require('./pwauth'));
router.use('/pwauth/useralter', require('./useralter'));
router.use('/pwauth/pwalter', require('./pwalter'));
router.use('/pwauth/deluser', require('./deluser'));
module.exports = router;