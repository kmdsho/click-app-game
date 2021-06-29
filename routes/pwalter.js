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
            try{
                connection = await pool.getConnection();
            }catch(err){
                console.log(err);
                return;
            }

            const sql = 'update users set\
                        hashed_password = ?\
                        where user_id = ?;';
            try{
                [results, fields] = await connection.query(sql, [hashedPassword, userid]);
            }catch(err){
                console.log('can not connect');
                console.log(err);
                return;
            }

            req.session.urlorigin = null;
            res.redirect('/');
            await connection.release();
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