var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var validator = require('express-validator');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var listsRouter = require('./routes/lists');
var detailRouter = require('./routes/detail');
var create = require('./routes/create');
var good = require('./routes/good');
const pass = require('./routes/pass');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(validator());

var session_opt = {
  secret:'keyboard cat',
  resave:false,
  saveUninitialized:false,
  cookie:{maxAge:48 * 60 * 60 * 1000}
};
app.use(session(session_opt));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lists',listsRouter);
app.use('/detail',detailRouter);
app.use('/create',create);
app.use('/good',good);
app.use('/pass',pass);

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
