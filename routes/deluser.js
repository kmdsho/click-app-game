const express = require('express');
const router = express.Router();
const app = require('../app');

const connection = app.connection;

router.get('/', function(req, res, next){
    req.session.urlorigin = req.originalUrl;
    if(req.session.userid){
        res.redirect('/pwauth');
    }else{
        res.redirect('/signin');
    }
});

router.post('/', function(req, res, next){
    const userid = req.session.userid;
    const isAuth = Boolean(userid);

    if(isAuth){
        connection.query(
            `delete users, scores
             from users
             left join scores
             on users.user_id = scores.user_id
             where users.user_id = ${userid};`,
            (error, results) => {
                console.log(error);
                req.session.urlorigin = null;
                res.redirect('/logout');
            }
        );
    }else{
        res.redirect('/signin');
    }
});

module.exports = router;