const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next){
    req.session.userid = req.session.username = null;
    res.redirect('/signin');
});

module.exports = router;