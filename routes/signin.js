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

router.post('/', async function(req, res, next){
    const ip = req.session.ip;
    let username, password;

    if(req.body.ip){
        username = app.body.username;
        password = app.body.password;
    }else{
        username = req.body.username;
        password = req.body.password;
    }

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
        if(bcrypt.compareSync(password, results[0].hashed_password)){
            req.session.userid = results[0].user_id;
            req.session.username = username;
            req.session.guest = false;
            const sql = 'update locks set\
                        extend_end = \'済\'\
                        where ip = inet_aton(?);';
            try{
                [results, fields] = await connection.query(sql, [ip]);
            }catch(err){
                console.log('can not connect');
                console.log(err);
                return;
            }

            res.redirect('/');
        }else{
            const sql = 'select exists (\
                            select 1\
                            from locks\
                            where ip = inet_aton(?)\
                            and extend_end is null\
                        ) auth;';
            try{
                [results, fields] = await connection.query(sql, [ip]);
            }catch(err){
                console.log('can not connect');
                console.log(err);
                return;
            }

            //データの挿入か更新か
            if(results[0].auth){
                //ペナルティを増やし、5であればロック日時に現在日時、5以上であれば解除日時を計算して更新する
                const sql_1 =   'update locks set\
                                penalty = penalty + 1,\
                                lock_date =\
                                    case\
                                        when penalty = 5 then (now() + interval 9 hour)\
                                        else lock_date\
                                        end\
                                    ,\
                                unlock_date =\
                                    case\
                                        when penalty >= 5 then (from_unixtime(unix_timestamp() + 60 * pow(4, penalty - 5)) + interval 9 hour)\
                                        else unlock_date\
                                        end\
                                where ip = inet_aton(?)\
                                and extend_end is null;';
                const sql_2 =   'select *\
                                from locks\
                                where ip = inet_aton(?)\
                                and unlock_date > (now() + interval 9 hour);';
                try{
                    [results, fields] = await connection.query(sql_1 + sql_2, [ip, ip]);
                }catch(err){
                    console.log('can not connect');
                    console.log(err);
                    return;
                }
                
                //ロックされたかどうか
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
            }else{
                const sql = 'insert into locks\
                            values (null, inet_aton(?), 1, null, null, null);';
                try{
                    [results, fields] = await connection.query(sql, [ip]);
                }catch(err){
                    console.log('can not connect');
                    console.log(err);
                    return;
                }

                res.render('signin', {
                    title: 'signin',
                    name: username,
                    msg: 'パスワードが間違っています'
                });
            }
        }
    }else{
        res.render('signin', {
            title: 'signin',
            name: username,
            msg: 'ユーザが見つかりません'
        });
    }
    await connection.release();
});

module.exports = router;