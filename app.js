var express = require('express');
var bodyP = require('body-parser');
var cookieP = require('cookie-parser');

var app = express();
var evts = require('events');
var twig = require('twig');
var mysql = require('mysql');
var db = mysql.createConnection({
    host    : process.env.IP,
    user    : process.env.C9_USER.substr(0,16),
    password: '',
    database: 'c9'
});

var an_emmiter = new evts.EventEmitter();

var session = require('express-session');

app
    .use(bodyP.json())
    .use(bodyP.urlencoded({ extended: false }))
    .use(cookieP())
    .use(express.static('.'))
    .use(session({ secret: '12345', resave: false, saveUninitialized: false }));
    
app.set('views', '');
app.set('view engine', 'html');
app.engine('html', twig.__express);

//TODO?: si la connection a la bdd c9 a reussie, creer les tables evenements et utilisateurs si elles n'existent pas

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

app.all('/', function(req,res)
{
   if(req.method == "POST")
   {
       res.redirect('/ajouter');
   }
   else
   {
       db.query('SELECT * FROM evenements', function(err,result)
       {
           if(err)
           {
               console.log(err);
               res.render('calendrier.twig', {'erreur' : 7, 'login': req.session.login});   // Probleme 7: pb recherche BD
           }
           else if(result.length > 0)
           {
                console.log(result);
                console.log(result[0]["debut"]);
                
                if (req.query.date_ref) {
                    res.render('calendrier.twig', {'evenements' : result, 'login' : req.session.login, 'date_ref': req.query.date_ref});
                }
                else {
                    res.render('calendrier.twig', {'evenements' : result, 'login' : req.session.login});
                }
           }
           else
               res.render('calendrier.twig', {'login' : req.session.login});
       });
   }
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

app.post('/ajouter', function(req,res)
{
    console.log("Dans /ajouter : method = " + req.method);
     if(req.session.login == undefined)
    {
        console.log(req.session.login);
        res.redirect('/login');
    }
    else
    {
        console.log("Titre : " + req.body.titre);
        console.log("Debut " + req.body.debut);
        console.log("Fin " + req.body.fin);
        console.log("Login : " + req.session.login);
        if(req.body.titre.trim() != "" && req.body.debut.trim() != "" && req.body.fin.trim() && req.body.debut < req.body.fin
            && req.body.jour.trim() != "")
        {
            db.query('SELECT * FROM evenements WHERE jour=(?)', [req.body.jour], function(err,result)
            {
                if(err)
                {
                    console.log(err);
                    res.render('calendrier.twig', {'erreur' : 7, 'login' : req.session.login});
                }
                else
                {
                    console.log(result);
                    if(result.length > 0)
                    {
                        for(var j in result)
                        {
                            if((req.body.debut <= result[j]["debut"] && req.body.fin > result[j]["debut"])
                                || (req.body.debut > result[j]["debut"] && req.body.debut < result[j]["fin"]))
                            {
                                res.render('calendrier.twig', {'erreur' : 8, 'login' : req.session.login});
                                return;
                            }
                        }
                    }
                    db.query('INSERT INTO evenements VALUES (?,?,?,?,?,?)', [req.body.debut,req.body.fin,req.body.jour,req.session.login,
                    req.body.titre,req.session.login+req.body.jour+req.body.debut],function(err,result)
                    {
                        if(err)
                        {
                            console.log(err);
                            //if(err.code == "ER_DUP_ENTRY")
                            res.render('calendrier.twig', {'erreur' : 1, 'login' : req.session.login});
                        }
                        else if(result.length != 0)
                        {
                            console.log(result);
                            console.log(req.session.login);
                            an_emmiter.emit('nouvel_ev',result);
                            res.redirect('/');
                        }
                        else
                        {
                            console.log("Resultat vide...");
                            res.render('calendrier.twig', {'login' : req.session.login});
                        }
                    });
                }
            });
            
        }
        else if(req.body.titre.trim() == "")
        {
            res.render('calendrier.twig', {'erreur' : 2, 'login' : req.session.login});
        }
        else if(req.body.debut.trim() == "")
        {
            res.render('calendrier.twig', {'erreur' : 3, 'login' : req.session.login});
        }
        else if(req.body.fin.trim() == "")
        {
            res.render('calendrier.twig', {'erreur' : 4, 'login' : req.session.login});
        }
        else if(req.body.debut >= req.body.fin)
        {
            res.render('calendrier.twig', {'erreur' : 5, 'login' : req.session.login});
        }
        else if(req.body.jour.trim() == "")
        {
            res.render('calendrier.twig', {'erreur' : 6, 'login' : req.session.login});
        }
    }
});

app.get('/liste', function(req,res)
{
    db.query('SELECT * FROM evenements', function(err,result)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.json(result);
        }
    });
});

app.get('/effacer', function(req, res) 
{
    console.log("ZBRA");
    res.send(300);
});

app.listen(process.env.PORT);