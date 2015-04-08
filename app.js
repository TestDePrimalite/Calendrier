var express = require('express');
var bodyP = require('body-parser');
var cookieP = require('cookie-parser');

var app = express();

var twig = require('twig');
var mysql = require('mysql');
var db = mysql.createConnection({
    host    : process.env.IP,
    user    : process.env.C9_USER.substr(0,16),
    
    password: '',
    database: 'c9'
});

var session = require('express-session');

app
    .use(bodyP.json())
    .use(bodyP.urlencoded({ extended: false }))
    .use(cookieP())
    .use(session({ secret: '12345' }));
    
app.set('views', '');
app.set('view engine', 'html');
app.engine('html', twig.__express);

app.all('/signup', function(req,res)
{
    if(req.session.login != undefined)
    {
        console.log(req.session.login);
        res.redirect('/');
    }
    else
    {
        if(req.method == "POST")
        {
            console.log("Login : " + req.body.login);
            console.log("Pass : " + req.body.pass);
            if(req.body.login.trim() != "" && req.body.pass.trim() != "")
            {
                db.query('INSERT INTO utilisateurs VALUES (?,?)', [req.body.login,req.body.pass],
                function(err,result)
                {
                    if(err)
                    {
                        console.log(err);
                        //if(err.code == "ER_DUP_ENTRY")
                        res.render('signup.twig', {'erreur' : 1});
                    }
                    else if(result.length != 0)
                    {
                        console.log(result);
                        req.session.login = req.body.login;
                        req.session.pass = req.body.pass;
                        console.log(req.session.login);
                        console.log(req.session.pass);
                        res.redirect('/');
                    }
                    else
                    {
                        console.log("Resultat vide...");
                        res.render('signup.twig');
                    }
                });
            }
            else if(req.body.login.trim() == "")
            {
                res.render('signup.twig', {'erreur' : 2});
            }
            else if(req.body.pass.trim() == "")
            {
                res.render('signup.twig', {'erreur' : 3});
            }
        }
        else
        {
            res.render('signup.twig');
        }
    }
});

app.get('/', function(req,res)
{
   res.render('calendrier.twig', {'login' : req.session.login});
});

app.all('/login', function(req,res)
{
    if(req.session.login != undefined)
    {
        console.log(req.session.login);
        res.redirect('/');
    }
    else
    {
        console.log(req.method);
        if(req.method == "POST")
        {
            console.log("Login : " + req.body.login);
            console.log("Pass : " + req.body.pass);
            if(req.body.login.trim() != "" && req.body.pass.trim() != "")
            {
                db.query("SELECT * FROM utilisateurs WHERE login=(?) AND pass=(?)", [req.body.login,req.body.pass],
                function(err,result)
                {
                    if(err)
                    {
                        console.log(err);
                        res.render('login.twig', {'erreur' : 1});
                    }
                    else if(result.length != 0)
                    {
                        console.log(result);
                        req.session.login = req.body.login;
                        req.session.pass = req.body.pass;
                        res.redirect('/');
                    }
                    else
                    {
                        console.log("Resultat vide");
                        res.render('login.twig', {'erreur' : 2});
                    }
                });
            }
            else if(req.body.login.trim() == "")
            {
                res.render('login.twig', {'erreur' : 3});
            }
            else if(req.body.pass.trim() == "")
            {
                res.render('login.twig', {'erreur' : 4});
            }
        }
        else
        {
            res.render('login.twig');
        }
    }
});

app.get('/logout', function(req,res)
{
    req.session.login = null;
    req.session.pass = null;
    res.redirect('/');
});

app.all('/ajouter', function(req,res)
{
     if(req.session.login == undefined)
    {
        console.log(req.session.login);
        res.redirect('/login');
    }
    else
    {
        if(req.method == "POST")
        {
            console.log("Titre : " + req.body.titre);
            console.log("Debut " + req.body.debut);
            console.log("Fin " + req.body.fin);
            console.log("Login : " + req.session.login);
            if(req.body.titre.trim() != "" && req.body.debut.trim() != "" && req.body.fin.trim())
            {
                db.query('INSERT INTO evenements VALUES (?,?,?,?)', [req.body.debut,req.body.fin,req.session.login,req.body.titre],
                function(err,result)
                {
                    if(err)
                    {
                        console.log(err);
                        //if(err.code == "ER_DUP_ENTRY")
                        res.render('ajout_ev.twig', {'erreur' : 1});
                    }
                    else if(result.length != 0)
                    {
                        console.log(result);
                        console.log(req.session.pseudo);
                        res.redirect('/');
                    }
                    else
                    {
                        console.log("Resultat vide...");
                        res.render('ajout_ev.twig');
                    }
                });
            }
            else if(req.body.titre.trim() == "")
            {
                res.render('ajout_ev.twig', {'erreur' : 2});
            }
            else if(req.body.debut.trim() == "")
            {
                res.render('ajout_ev.twig', {'erreur' : 3});
            }
            else if(req.body.fin.trim() == "")
            {
                res.render('ajout_ev.twig', {'erreur' : 4});
            }
        }
        else
        {
            res.render('ajout_ev.twig');
        }
    }
});

app.listen(8080);