const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const sessionstorage = require('sessionstorage');
const app = require('../app');

const connection = app.connection;

router.get('/', function(req, res, next){
    res.redirect('/');
});

router.post('/', function(req, res, next){
    let score, time, level, loop, user;

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

    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    console.log(`isAuth: ${isAuth}`);

    if(isAuth){
        user = 1;
        connection.query(
            `insert into scores
             values (null, ${userid}, '${level}', ${score}, ${time}, '${dayjs().format()}');`,
            (error, results) => {
                console.log(error);
            }
        );
    }else{
        user = 0;
        const scores = {
            level: level,
            score: score,
            time: time,
            date: dayjs().format()
        }
        sessionstorage.setItem('score_' + (sessionstorage.length + 1), scores);
    }

    res.render('result', {
        score: score,
        loop: parseInt(loop),
        time: time.slice(0, time.indexOf('.') - 2) + ':' + time.slice(time.indexOf('.') - 2),
        select_lev: level,
        user: user,
        my_lev: level.charAt(0).toUpperCase() + level.slice(1)
    });
});

module.exports = router;