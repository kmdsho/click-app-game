const express = require('express');
const router = express.Router();
const app = require('../app');
const dayjs = require('dayjs');
const sessionstorage = require('sessionstorage');

const pool = app.pool;

//スコア表を作る
function makeTable(results, sw, guestPerson){
    let rank, time, user = '', data = '';

    //sessionstorageから取得したデータはソートが必要
    if(guestPerson){
        //ソートするためにタイムや日時をシリアル値に変換
        for(let i = 0; i < results.length; i++){
            //タイム
            time = parseFloat(results[i].time);
            let min = parseInt(time / 100);
            results[i].time = Math.round(time % 100 * 1000) + min * 60000;

            //日時
            results[i].date = dayjs(results[i].date).valueOf(); //ミリ秒単位(unix()は秒単位)
        }

        //スコア順(降順)→タイム順(昇順)→日時順(昇順)
        results.sort(function(a, b){
            if(a.score !== b.score){
                return (a.score - b.score) * -1;
            }

            if(a.time !== b.time){
                return a.time - b.time;
            }

            if(a.date !== b.date){
                return a.date - b.date;
            }

            return 0;
        });
    }

    for(let i = 0; i < 10 && i < results.length; i++){
        //日付のシリアル値→yyyy:mm:dd hh:mm形式
        let date = dayjs(results[i].date).format('YYYY-MM-DD HH:mm');

        //タイムのシリアル値→MM:SS.MSまたはM:SS.MS形式
        if(guestPerson){  //ゲストかつ個人の場合
            time = dayjs(results[i].time).format('m:ss.SSS').slice(0, -1);
            
            //書き換えられたsessionstorageを戻す
            results[i].time = dayjs(results[i].time).format('mss.SSS').slice(0, -1);
            results[i].date = dayjs(results[i].date).format();
        }else if(parseInt(results[i].time.charAt(3))){
            time = results[i].time.slice(3);  //MM:SS.MS形式
        }else{
            time = results[i].time.slice(4);  //M:SS.MS形式
        }

        //順位付け
        if(i > 0){
            if(!(results[i - 1].score === results[i].score && results[i - 1].time === results[i].time)){
                rank = i + 1;  //前のスコアとタイムがそれぞれ同じであれば順位を更新しない
            }
        }else{
            rank = 1;  //最初は必ず1位(初期値)
        }

        //全体の場合はユーザ名を表に追加
        if(sw){
            user = '<td>' + results[i].name + '</td>';
        }

        data += '<tr><td>' + rank + '</td>' + user + '<td>' + results[i].score +
                '</td><td>' + time +
                '</td><td>' + date + '</td></tr>';
    }
    return data;
}

//sessionstorageのデータを難易度別に分ける(ゲスト)
function dataDivide(selectLevel, guest){
    let allScores = [], len;

    //一旦全てのデータを格納
    for(let i = 0; i < sessionstorage.length; i++){
        allScores.push(sessionstorage.getItem('score_' + (i + 1)));
    }

    switch(selectLevel){
        case 'easy':
            let easyScores = [];

            //全てのデータからレベルがeasyのものだけを抽出
            for(let value of allScores){
                if(value.level === selectLevel){
                    easyScores.push(value);
                }
            }

            len = easyScores.length;

            return {
                len: len,
                data: len ? makeTable(easyScores, 0, guest) : ''
            };
        case 'normal':
            let normalScores = [];

            //全てのデータからレベルがnormalのものだけを抽出
            for(let value of allScores){
                if(value.level === selectLevel){
                    normalScores.push(value);
                }
            }

            len = normalScores.length;

            return {
                len: len,
                data: len ? makeTable(normalScores, 0, guest) : ''
            };
        case 'hard':
            let hardScores = [];

            //全てのデータからレベルがhardのものだけを抽出
            for(let value of allScores){
                if(value.level === selectLevel){
                    hardScores.push(value);
                }
            }

            len = hardScores.length;

            return {
                len: len,
                data: len ? makeTable(hardScores, 0, guest) : ''
            };
    }
}

//個人か全体かでチェック状態を変える
function userSelect(user){
    switch(user){
        case 'person':
            return {
                person: 'checked',
                people: ''
            };
        case 'people':
            return {
                person: '',
                people: 'checked'
            };
    }
}

//レベルによってチェック状態を変える
function levelSelect(level){
    switch(level){
        case 'easy':
            return {
                easy: 'checked',
                normal: '',
                hard: ''
            };
        case 'normal':
            return {
                easy: '',
                normal: 'checked',
                hard: ''
            };
        case 'hard':
            return {
                easy: '',
                normal: '',
                hard: 'checked'
            };
    }
}

router.get('/', function(req, res, next){
    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    const guest = req.session.guest;
    console.log(`isAuth: ${isAuth}`);
    console.log(`guest: ${guest}`);

    if(isAuth){
        pool.getConnection(function(error, connection){
            connection.query(
                `select score, time, date
                from scores
                where user_id = ${userid} 
                and level = 'easy'
                order by score desc, time, date
                limit 10;`,  //トップ10
                (error, results) => {
                    console.log(error);
                    res.render('score', {
                        isAuth: isAuth,
                        user_logout: 1,
                        name: req.session.username,
                        user: userSelect('person'),
                        level: levelSelect('easy'),
                        trWidth: 350,
                        user_sw: '',
                        dataLen: results.length,
                        data: makeTable(results, 0, guest)
                    });
                }
            );
            connection.release();
        });
    }else if(guest){
        res.render('score', {
            isAuth: isAuth,
            user_logout: 0,
            name: 'ゲスト',
            user: userSelect('person'),
            level: levelSelect('easy'),
            trWidth: 350,
            user_sw: '',
            dataLen: dataDivide('easy', guest).len,
            data: dataDivide('easy', guest).data
        });
    }else{
        res.redirect('/signin');
    }
});

router.post('/', function(req, res, next){
    let user, level

    if(req.body.ip){
        user = app.body.user;
        level = app.body.level;
    }else{
        user = req.body.user;
        level = req.body.level;
    }

    const userid = req.session.userid;
    const isAuth = Boolean(userid);
    const guest = req.session.guest;
    console.log(`isAuth: ${isAuth}`);
    console.log(`guest: ${guest}`);

    let name;

    if(isAuth){
        name = req.session.username;
    }else{
        name = 'ゲスト';
    }

    if(isAuth && user === 'person'){    //ユーザかつ個人である場合
        pool.getConnection(function(error, connection){
            connection.query(
                `select score, time, date
                from scores
                where user_id = ${userid}
                and level = '${level}'
                order by score desc, time, date
                limit 10;`,  //トップ10
                (error, results) => {
                    console.log(error);
                    res.render('score', {
                        isAuth: isAuth,
                        user_logout: 1,
                        name: name,
                        user: userSelect(user),
                        level: levelSelect(level),
                        user_sw: '',
                        trWidth: 350,
                        dataLen: results.length,
                        data: makeTable(results, 0, guest)
                    });
                }
            );
            connection.release();
        });
    }else if(user === 'people'){    //全体である場合
        let user_logout;
        if(isAuth){
            user_logout = 1;
        }else{
            user_logout = 0;
        }

        pool.getConnection(function(error, connection){
            connection.query(
                `select name, score, time, date
                from users, scores
                where users.user_id = scores.user_id
                and level = '${level}'
                order by score desc, time, date
                limit 10;`,  //トップ10
                (error, results) => {
                    console.log(error);
                    res.render('score', {
                        isAuth: isAuth,
                        user_logout: user_logout,
                        name: name,
                        user: userSelect(user),
                        level: levelSelect(level),
                        user_sw: '<th style="width: 106px;">ユーザ</th>',
                        trWidth: 410,
                        dataLen: results.length,
                        data: makeTable(results, 1, 0)
                    });
                }
            );
            connection.release();
        });
    }else if(guest){    //ゲストかつ個人である場合
        res.render('score', {
            isAuth: isAuth,
            user_logout: 0,
            name: name,
            user: userSelect(user),
            level: levelSelect(level),
            user_sw: '',
            trWidth: 350,
            dataLen: dataDivide(level, guest).len,
            data: dataDivide(level, guest).data
        });
    }else{
        res.redirect('/signin');
    }
});

module.exports = router;