const express = require('express');
const router = express.Router();
const app = require('../app');
const bcrypt = require('bcrypt');

const connection = app.connection;

router.get('/', function(req, res, next){
    if(req.session.urlorigin){
        res.render('pwauth', {
            msg: ''
        });
    }else{
        res.redirect('/');
    }
});

router.post('/', function(req, res, next){
    const url = req.session.urlorigin;
    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    let view, password;

    if(url){
        const idx = url.indexOf('/', url.indexOf('/') + 1);
        view = url.slice((url.length - idx - 1) * -1);
    }

    if(req.body.ip){
        password = app.body.password;
    }else{
        password = req.body.password;
    }

    if(isAuth && view){
        connection.query(
            `select *
            from users
            where user_id = ${userid};`,
            (error, results) => {
                console.log(error);
                if(bcrypt.compareSync(password, results[0].hashed_password)){
                    res.render(view, {
                        name: '',
                        msg: ''
                    });
                }else{
                    if(req.session.miss){
                        req.session.miss++;
                    }else{
                        req.session.miss = 1;
                    }

                    if(req.session.miss < 5){
                        res.render('pwauth', {
                            msg: 'パスワードが間違っています'
                        });
                    }else{
                        req.session.miss = null;
                        res.redirect('/logout');
                    }
                }
            }
        );
    }else if(view){
        res.redirect('/signin');
    }else{
        res.redirect('/');
    }
});

module.exports = router;