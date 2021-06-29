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

    if(isAuth){
        try{
            connection = await pool.getConnection();
        }catch(err){
            console.log(err);
            return;
        }

        const sql = 'delete users, scores\
                    from users\
                    left join scores\
                    on users.user_id = scores.user_id\
                    where users.user_id = ?;';
        try{
            [results, fields] = await connection.query(sql, [userid]);
        }catch(err){
            console.log('can not connect');
            console.log(err);
            return;
        }

        req.session.urlorigin = null;
        res.redirect('/logout');
        await connection.release();
    }else{
        res.redirect('/signin');
    }
});

module.exports = router;