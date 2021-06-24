const express = require('express');
const router = express.Router();
const app = require('../app');

const pool = app.pool;

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
    let username;

    if(req.body.ip){
        username = app.body.username;
    }else{
        username = req.body.username;
    }

    if(isAuth){
        pool.getConnection(function(error, connection){
            connection.query(
                `select *
                from users
                where name = '${username}';`,
                (error, results) => {
                    console.log(error);
                    if(results.length){
                        res.render('useralter', {
                            name: username,
                            msg: 'そのユーザ名はすでに使われています'
                        });
                    }else{
                        connection.query(
                            `update users set
                            name = '${username}'
                            where user_id = ${userid};`,
                            (error, results) => {
                                console.log(error);
                                req.session.username = username;
                                req.session.urlorigin = null;
                                res.redirect('/');
                            }
                        );
                    }
                }
            );
            connection.release();
        });
    }else{
        res.redirect('signin');
    }
});

module.exports = router;