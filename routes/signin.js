const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const app = require('../app');
const dayjs = require('dayjs');

const pool = app.pool;

router.get('/', function(req, res, next){
    res.render('signin', {
        title: 'signin',
        name: '',
        msg: ''
    });
});

router.post('/', function(req, res, next){
    const ip = req.session.ip;
    let username, password;

    if(req.body.ip){
        username = app.body.username;
        password = app.body.password;
    }else{
        username = req.body.username;
        password = req.body.password;
    }

    pool.getConnection(function(error, connection){
        connection.query(
            `select *
            from users
            where name = '${username}';`,
            (error, results) => {
                console.log(error);
                if(results.length){
                    if(bcrypt.compareSync(password, results[0].hashed_password)){
                        req.session.userid = results[0].user_id;
                        req.session.username = username;
                        req.session.guest = false;
                        connection.query(
                            `update locks set
                            extend_end = '済'
                            where ip = inet_aton('${ip}');`,
                            (error, results) => {
                                console.log(error);
                            }
                        );
                        res.redirect('/');
                    }else{
                        connection.query(
                            `select exists (
                                select 1
                                from locks
                                where ip = inet_aton('${ip}')
                                and extend_end is null
                            ) auth;`,
                            (error, results) => {
                                console.log(error);
                                if(results[0].auth){
                                    //ペナルティを増やし、5であればロック日時に現在日時、5以上であれば解除日時を計算して更新する
                                    connection.query(
                                        `update locks set
                                        penalty = penalty + 1,
                                        lock_date =
                                            case
                                                when penalty = 5 then (now() + interval 9 hour)
                                                else lock_date
                                                end
                                            ,
                                        unlock_date =
                                            case
                                                when penalty >= 5 then (from_unixtime(unix_timestamp() + 60 * pow(4, penalty - 5)) + interval 9 hour)
                                                else unlock_date
                                                end
                                        where ip = inet_aton('${ip}')
                                        and extend_end is null;
                                        select *
                                        from locks
                                        where ip = inet_aton('${ip}')
                                        and unlock_date > (now() + interval 9 hour);`,
                                        (error, results) => {
                                            if(results[1].length){
                                                req.session.check = false;
                                                res.render('lock', {
                                                    pathname: req.originalUrl,
                                                    locktime: dayjs(results[1][0].unlock_date).diff(dayjs())
                                                });
                                            }else{
                                                res.render('signin', {
                                                    title: 'signin',
                                                    name: username,
                                                    msg: 'パスワードが間違っています'
                                                });
                                            }
                                        }
                                    );
                                }else{
                                    connection.query(
                                        `insert into locks
                                        values (null, inet_aton('${ip}'), 1, null, null, null);`,
                                        (error, results) => {
                                            console.log(error);
                                            res.render('signin', {
                                                title: 'signin',
                                                name: username,
                                                msg: 'パスワードが間違っています'
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    }
                }else{
                    res.render('signin', {
                        title: 'signin',
                        name: username,
                        msg: 'ユーザが見つかりません'
                    });
                }
            }
        );
        connection.release();
    });
});

module.exports = router;