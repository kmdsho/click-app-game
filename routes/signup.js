const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;  //ストレッチング回数
const app = require('../app');
const sessionstorage = require('sessionstorage');

const pool = app.pool;

router.get('/', function(req, res, next){
    res.render('signup', {
        title: 'signup',
        name: '',
        msg: ''
    });
});

router.post('/', async function(req, res, next){
    let username, password, repassword, trans;
    
    if(req.body.ip){
        username = app.body.username;
        password = app.body.password;
        repassword = app.body.repassword;
        trans = app.body.trans;
    }else{
        username = req.body.username;
        password = req.body.password;
        repassword = req.body.repassword;
        trans = req.body.trans;
    }

    const salt = bcrypt.genSaltSync(saltRounds);    //ソルト生成
    const hashedPassword = await bcrypt.hash(password, salt);   //ハッシュ化(password)
    const hashedRepassword = await bcrypt.hash(repassword, salt);   //ハッシュ化(repassword)

    if(hashedPassword === hashedRepassword){
        pool.getConnection(function(error, connection){
            connection.query(
                `select *
                from users
                where name = '${username}';`,
                (error, results) => {
                    console.log(error);
                    if(results.length){
                        res.render('signup', {
                            title: 'signup',
                            name: username,
                            msg: 'そのユーザ名はすでに使われています'
                        });
                    }else{
                        connection.query(
                            `insert into users
                            values (null, '${username}', '${hashedPassword}');`,
                            (error, results) => {
                                console.log(error);
                                const userid = req.session.userid = results.insertId;
                                req.session.username = username;
                                req.session.guest = false;

                                //チェックを入れた場合sessionstorageからDBに引継ぐ
                                if(trans && sessionstorage.length){
                                    let datas = [];

                                    for(let i = 0; i < sessionstorage.length; i++){
                                        datas.push(sessionstorage.getItem('score_' + (i + 1)));
                                    }

                                    for(let i = 0; i < datas.length; i++){
                                        let score = datas[i].score;
                                        let time = datas[i].time;
                                        let date = datas[i].date;
                                        let level = datas[i].level;

                                        connection.query(
                                            `insert into scores
                                            values (null, ${userid}, '${level}', ${score}, ${time}, '${date}');`,
                                            (error, results) => {
                                                console.log(error);
                                            }
                                        );
                                    }

                                    sessionstorage.clear();     //引継いだら全データ削除
                                }

                                res.redirect('/');
                            }
                        );
                    }
                }
            );
            connection.release();
        });
    }else{
        res.render('signup', {
            title: 'signup',
            name: username,
            msg: 'パスワードが一致しません'
        });
    }
});

module.exports = router