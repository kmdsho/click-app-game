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

router.post('/', async function(req, res, next){
    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    let username;

    if(req.body.ip){
        username = app.body.username;
    }else{
        username = req.body.username;
    }

    if(isAuth){
        try{
            connection = await pool.getConnection();
        }catch(err){
            console.log(err);
            return;
        }

        const sql = 'select *\
                    from users\
                    where name = ?;';
        try{
            [results, fields] = await connection.query(sql, [username]);
        }catch(err){
            console.log('can not connect');
            console.log(err);
            return;
        }

        if(results.length){
            res.render('useralter', {
                name: username,
                msg: 'そのユーザ名はすでに使われています'
            });
        }else{
            const sql = 'update users set\
                        name = ?\
                        where user_id = ?;';
            try{
                [results, fields] = await connection.query(sql, [username, userid]);
            }catch(err){
                console.log('can not connect');
                console.log(err);
                return;
            }

            req.session.username = username;
            req.session.urlorigin = null;
            res.redirect('/');
        }
        await connection.release();
    }else{
        res.redirect('signin');
    }
});

module.exports = router;