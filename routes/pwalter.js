const express = require('express');
const router = express.Router();
const app = require('../app');
const saltRounds = 10;  //ストレッチング回数
const bcrypt = require('bcrypt');

const pool = app.pool;

router.get('/', function(req, res, next){
    req.session.urlorigin = req.originalUrl;
    if(req.session.userid){
        res.redirect('/pwauth');
    }else{
        res.redirect('/signin');
    }
});

router.post('/', async function(req, res, next){
    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    let password, repassword;
    
    if(req.body.ip){
        password = app.body.password;
        repassword = app.body.repassword;
    }else{
        password = req.body.password;
        repassword = req.body.repassword;
    }

    const salt = bcrypt.genSaltSync(saltRounds);    //ソルト生成
    const hashedPassword = await bcrypt.hash(password, salt);   //ハッシュ化(password)
    const hashedRepassword = await bcrypt.hash(repassword, salt);   //ハッシュ化(repassword)

    if(isAuth){
        if(hashedPassword === hashedRepassword){
            pool.getConnection(function(error, connection){
                connection.query(
                    `update users set
                    hashed_password = '${hashedPassword}'
                    where user_id = ${userid};`,
                    (error, results) => {
                        console.log(error);
                        req.session.urlorigin = null;
                        res.redirect('/');
                    }
                );
                connection.release();
            });
        }else{
            res.render('pwalter', {
                msg: 'パスワードが一致しません'
            });
        }
    }else{
        res.redirect('/signin');
    }
});

module.exports = router;