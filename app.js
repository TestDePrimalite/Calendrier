var express = require('express');
var bodyP = require('body-parser');
var cookieP = require('cookie-parser');

var app = express();
var mysql = require('mysql');
var twig = require('twig');
var db = mysql.createConnection({
    host    : process.env.IP,
    user    : process.env.C9_USER.substr(0,16),
    
    password: '',
    database: 'c9'
});

var session = require('express-session');

var connectes = [];

app
    .use(bodyP.json())
    .use(bodyP.urlencoded({ extended: false }))
    .use(cookieP())
    .use(session({ secret: '12345' }));
app.set('views', '');
app.set('view engine', 'html');
app.engine('html', twig.__express);