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

/* Ce gestionnaire permet de créer un compte si l'utilisateur n'est pas déjà connecté. Sinon, on fait une redirection vers '/'. */
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

/* Ce gestionnaire va s'occuper de rediriger vers '/ajouter' si la méthode est POST (c'est à dire qu'on a voulu ajouter un événement), sinon, il va renvoyer
 la liste de tous les événements. */
app.all('/', function(req,res)
{
   if(req.method == "POST")
   {
       res.redirect('/ajouter');
   }
   else
   {   var erreur = req.session.erreur;
       req.session.erreur = 0;
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
                    res.render('calendrier.twig', {'evenements' : result, 'login' : req.session.login, 'date_ref': req.query.date_ref, 'erreur':erreur});
                }
                else {
                    res.render('calendrier.twig', {'evenements' : result, 'login' : req.session.login, 'erreur':erreur});
                }
           }
           else
               res.render('calendrier.twig', {'login' : req.session.login, 'erreur' : erreur});
       });
   }
});

/* Ce gestionnaire permet à l'utilisteur de se connecter s'il n'est pas déjà connecté, en cherchant dans la base de donnée si les login et mot de passe
correspondent. Si l'authentification est réussie, il redirige vers '/' en stockant les informations dans la session.*/
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

/* Ce gestionnaire permet tout simplement de se déconnecter de la session, et redirige vers '/'. */
app.get('/logout', function(req,res)
{
    req.session.login = null;
    req.session.pass = null;
    res.redirect('/');
});

/* Ce gestionnaire permet d'ajouter des événements dans la base de donnée. Si l'utilisateur n'est pas connecté, il est redirigé vers '/login'.
Sinon, si l'événement ne se supperpose pas avec un autre événement, n'a pas une date de fin inférieur a une date de début, n'a pas de durée nulle,
possède bien un titre, alors il est inséré dans la base de donnée.*/
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
                    req.session.erreur = 7;
                    //res.render('calendrier.twig', {'erreur' : 7, 'login' : req.session.login});
                    res.redirect('/');
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
                                req.session.erreur=8;
                                res.redirect('/');
                            }
                        }
                    }
                    db.query('INSERT INTO evenements VALUES (?,?,?,?,?,?)', [req.body.debut,req.body.fin,req.body.jour,req.session.login,
                    req.body.titre,req.session.login+req.body.jour+req.body.debut],function(err,result)
                    {
                        if(err)
                        {
                            console.log(err);

                            req.session.erreur = 1;
                            res.redirect('/');
                        }
                        else if(result.length != 0)
                        {
                            console.log(result);
                            console.log(req.session.login);
                            //an_emmiter.emit('nouvel_ev',result);
                            res.redirect('/');
                        }
                        else
                        {
                            console.log("Resultat vide...");
                            res.redirect('/');
                        }
                    });
                }
            });
            
        }
        else if(req.body.titre.trim() == "")
        {
            req.session.erreur = 2;
            res.redirect('/');
        }
        else if(req.body.debut.trim() == "")
        {
            req.session.erreur = 3;
            res.redirect('/');
        }
        else if(req.body.fin.trim() == "")
        {
            req.session.erreur = 4;
            res.redirect('/');
        }
        else if(req.body.debut >= req.body.fin)
        {
            req.session.erreur = 5;
            res.redirect('/');
        }
        else if(req.body.jour.trim() == "")
        {
            req.session.erreur = 6;
            res.redirect('/');
        }
    }
});

/* Ce gestionnaire envoie les événements sous format json. */
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

/* Ce gestionnaire permet d'effacer un événement de la base de donnée. */
app.post('/effacer', function(req, res) 
{
    db.query("SELECT * FROM evenements WHERE id=(?)", [req.body.id] , function(err,result)
    {
        if(err)
        {
            console.log(err);
        }
        else {
            if(result.length > 0) {
                if (result[0].login == req.session.login) {
                    db.query("DELETE from evenements WHERE id=(?)", [req.body.id], function(err,result)
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                        res.redirect('/');
                    });
                }
            }
        }
    });
});

app.listen(process.env.PORT);