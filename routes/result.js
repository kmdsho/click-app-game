const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const sessionstorage = require('sessionstorage');
const app = require('../app');

const pool = app.pool;

router.get('/', function(req, res, next){
    res.redirect('/');
});

router.post('/', async function(req, res, next){
    let score, time, level, loop;

    if(req.body.ip){
        score = app.body.score;
        time = app.body.time;
        level = app.body.level;
        loop = app.body.loop;
    }else{
        score = req.body.score;
        time = req.body.time;
        level = req.body.level;
        loop = req.body.loop;
    }

    score = parseInt(score);
    loop = parseInt(loop);
    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    console.log(`isAuth: ${isAuth}`);

    if(score > 0 && score <= loop){
        if(isAuth){
            try{
                connection = await pool.getConnection();
            }catch(err){
                console.log(err);
                return;
            }

            const sql = 'insert into scores\
                        values (null, ?, ?, ?, ?, ?);';
            try{
                [results, fields] = await connection.query(sql, [userid, level, score, time, dayjs().format()]);
            }catch(err){
                console.log('can not connect');
                console.log(err);
                return;
            }

            await connection.release();
        }else{
            const scores = {
                level: level,
                score: score,
                time: time,
                date: dayjs().format()
            }
            sessionstorage.setItem('score_' + (sessionstorage.length + 1), scores);
        }
    }

    res.render('result', {
        score: score,
        loop: loop,
        time: time.slice(0, time.indexOf('.') - 2) + ':' + time.slice(time.indexOf('.') - 2),
        select_lev: level,
        user: isAuth ? 1 : 0,
        my_lev: level.charAt(0).toUpperCase() + level.slice(1)
    });
});

module.exports = router;