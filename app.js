const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cookieSession = require('cookie-session');
const mysql = require('mysql');
const secret = 'secretCuisine123';
const dayjs = require('dayjs');

const app = express();

const pool = mysql.createPool({
  host: 'us-cdbr-east-04.cleardb.com',
  user: 'b568f416a852d8',
  password: '66c00005',
  database: 'heroku_e688232a8b6fef7',
  multipleStatements: true
});

pool.getConnection(function(error, connection){
  connection.query(
    'set time_zone=\'+9:00\';',
    (error, results) => {
      console.log(error);
    }
  );
})

exports.pool = pool;

app.use(
  cookieSession({
    name: "session",
    keys: [secret],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/*', function(req, res, next){
  if(req.body.ip){
    req.session.ip = req.body.ip;  //IPをアドレスをセッションに保存(再取得が不要になる)
    if(req.session.method === 'GET'){
      req.method = 'GET';   //IPアドレス取得によるPOSTをGETに変更
    }
  }

  if(req.session.ip){     //IPアドレスを一度でも取得したかどうか
    if(req.session.check){   //ロックされていないことを確認
      next();
    }else{
      pool.getConnection(function(error, connection){
        connection.query(
          `select *
          from locks
          where ip = inet_aton('${req.session.ip}')
          and unlock_date > (now() + interval 9 hour);`,
          (error, results) => {
            console.log(error);
            if(results.length){   //ロックされているかどうか
              req.session.check = false;
              res.render('lock', {
                pathname: req.originalUrl,
                locktime: dayjs(results[0].unlock_date).diff(dayjs())
              });
            }else{
              req.session.check = true;
              next();
            }
          }
        );
        connection.release();
      });
    }
  }else{
    req.session.method = req.method;
    if(req.session.method === 'POST'){
      exports.body = req.body;
    }
    res.render('ip', {
      pathname: req.originalUrl
    });
  }
});

app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
