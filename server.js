/*
* Copyright by Dayyoung You (dryudryu@gmail.com)
*/

var express = require('express')
, http = require('http')
, fs = require('fs')
,connect = require('connect')
,cookieParser = require('cookie-parser')
,bodyParser = require('body-parser');
var path = require('path');
var favicon = require('serve-favicon');
var COMMON = require('./modules/common');
var router = require('./modules/router');
var session = require('express-session');

var i18n = require('i18n');

i18n.configure({
  locales: ['en','ko','zh','ja'],
  defaultLocale: 'en',
  directory: __dirname + '/locales'
});

var app = express();
var server = http.createServer(app);

app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(session({
  secret: 'keyboard warrior',
  resave: false,
  saveUninitialized: true
}));

app.use(i18n.init);

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

router.setRestUrl(app);

server.listen(process.env.PORT || 7777, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("SNSEHERO.com server running on " +  COMMON.HOST_URL + ":" + addr.port);
});