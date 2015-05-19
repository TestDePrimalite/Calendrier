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
    database: 'CalendrierFrancoisMikael'
});

// var an_emmiter = new evts.EventEmitter();

var session = require('express-session');
var an_emmiter = new evts.EventEmitter();

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
                db.query('INSERT INTO utilisateurs VALUES (?,?)', [escape(req.body.login),escape(req.body.pass)],
                function(err,result)
                {
                    if(err)
                    {
                        console.log(err);
                        res.render('signup.twig', {'erreur' : 1});
                    }
                    else if(result.length != 0)
                    {
                        console.log(result);
                        req.session.login = escape(req.body.login);
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
app.get('/', function(req,res)
{
       db.query('SELECT * FROM evenements', function(err,result)
       {
           if(err)
           {
               console.log(err);
               res.render('calendrier.twig', {'erreur' : "Erreur : Problème de recherche dans la base de donnée", 'login': req.session.login});   // Probleme 7: pb recherche BD
           }
           else if(result.length > 0)
           {
                console.log(result);
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
        if(req.method == "POST")
        {
            console.log("Login : " + req.body.login);
            console.log("Pass : " + req.body.pass);
            if(req.body.login.trim() != "" && req.body.pass.trim() != "")
            {
                db.query("SELECT * FROM utilisateurs WHERE login=(?) AND pass=(?)", [escape(req.body.login),escape(req.body.pass)],
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
                        req.session.login = escape(req.body.login);
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
    res.redirect('/');
});

/* Ce gestionnaire permet d'ajouter des événements dans la base de donnée. Si l'utilisateur n'est pas connecté, il est redirigé vers '/login'.
Sinon, si l'événement ne se supperpose pas avec un autre événement, n'a pas une date de fin inférieur a une date de début, n'a pas de durée nulle,
possède bien un titre, alors il est inséré dans la base de donnée.*/
app.post('/ajouter', function(req,res)
{
     if(req.session.login == undefined)
    {
        return res.send("Erreur : Vous n'êtes pas connecté.");
    }
    else
    {
        console.log("Titre : " + req.body.titre);
        console.log("Debut " + req.body.debut);
        console.log("Fin " + req.body.fin);
        console.log("Login : " + req.session.login);
        if(req.body.titre.trim() != "" && req.body.debut.trim() != "" && req.body.fin.trim()!= "" && req.body.debut < req.body.fin
            && req.body.jour.trim() != "")
        {
            db.query('SELECT * FROM evenements WHERE jour=(?)', [req.body.jour], function(err,result)
            {
                if(err)
                {
                    return res.send("Erreur : Problème de recherche dans la base de données. Veuillez réessayer." + err);
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
                                return res.send("Erreur : Un événement est déjà présent au niveau de cette plage horaire.");
                            }
                        }
                    }
                    db.query('INSERT INTO evenements VALUES (?,?,?,?,?,?)', [req.body.debut,req.body.fin,req.body.jour,escape(req.session.login),
                    req.body.titre,"De "+req.body.debut+" à "+req.body.fin+" le "+req.body.jour+" ("+escape(req.session.login)+")"],
                    function(err,result)
                    {
                        if(err)
                        {
                            console.log(err);
                            return res.send("Erreur : Date déjà utilisée.");
                        }
                        else if(result.length != 0)
                        {
                            an_emmiter.emit('/liste');
                            console.log(result);
                            console.log(req.session.login);
                            return res.send("L'événement a bien été ajouté.");
                        }
                        else
                        {
                            console.log("Resultat vide...");
                            return res.send("Rien n'a été inséré dans la base de donnée.");
                        }
                    });
                }
            });
            
        }
        else if(req.body.titre.trim() == "")
        {
            return res.send("Votre titre est vide.");
        }
        else if(req.body.debut.trim() == "")
        {
            return res.send("Aucune date de début n'a été entrée.");
        }
        else if(req.body.fin.trim() == "")
        {
            return res.send("Aucune date de fin n'a été entrée.");
        }
        else if(req.body.debut >= req.body.fin)
        {
            return res.send("La date de début est supérieur ou égal à la date de fin.");
        }
        else if(req.body.jour.trim() == "")
        {
            return res.send("Aucun jour n'a été entré.");
        }
    }
});

/* Ce gestionnaire envoie les événements sous format json. */
app.get('/liste', function(req,res)
{
    res.set({
        'Content-type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.writeHead(200);
    an_emmiter.on('/liste',function(){
        db.query('SELECT * FROM evenements', function(err,result)
        {
            if(err)
            {
                console.log(err);
            }
            res.write('event: evenements\n');
            res.write('data: ' + JSON.stringify(result) + '\n\n');
        });
    });
});

/* Ce gestionnaire permet d'effacer un événement de la base de donnée. */
app.post('/effacer', function(req, res) 
{
    if(req.session.login == undefined)
    {
        return res.send("Erreur : vous n'êtes pas connecté.");
    }
    else
    {
        db.query("SELECT * FROM evenements WHERE id=(?)", [req.body.id] , function(err,result)
        {
            if(err)
            {
                console.log(err);
                return res.send("Erreur : Problème de recherche dans la base de donnée." + err);
            }
            else 
            {
                if(result.length > 0) 
                {
                    if (result[0].login == escape(req.session.login)) 
                    {
                        db.query("DELETE from evenements WHERE id=(?)", [req.body.id], function(err,result)
                        {
                            if(err)
                            {
                                return res.send(err);
                            }
                            else
                            {
                                an_emmiter.emit('/liste');
                                res.send("L'événement a bien été supprimé.");
                            }
                            
                        });
                    }
                    else 
                    {
                        return res.send("Erreur : Vous n'êtes pas le créateur de cet événement.");
                    }
                }
            }
        });
    }
    
});

app.post('/modifier', function(req, res) {
    if(req.session.login == undefined)
    {
        return res.send("Erreur : vous n'êtes pas connecté.");
    }
    else
    {
        if(req.body.titre.trim() != "" && req.body.debut.trim() != "" && req.body.fin.trim()!= "" && req.body.debut < req.body.fin
            && req.body.jour.trim() != "")
        {
            db.query('SELECT * FROM evenements', function(err, result) 
            {
                if(err)
                    return res.send(err);
                else
                {
                    if(result.length > 0)
                    {
                        for(var j in result)
                        {
                            if(req.body.id == result[j]["id"] && req.session.login != result[j]["login"])
                                return res.send("Erreur : Vous n'êtes pas le créateur de cet événement.");
                        }
                    }
                }
                db.query("SELECT * FROM evenements WHERE jour=?",[req.body.jour] , function(err,result)
                {
                    if(err)
                    {
                        return res.send("Erreur : Problème de recherche dans la base de donnée." + err);
                    }
                    else 
                    {
                        if(result.length > 0)
                        {
                            for(var j in result)
                            {
                                if(req.body.id != result[j]["id"] && ((req.body.debut <= result[j]["debut"] 
                                && req.body.fin > result[j]["debut"]) || (req.body.debut > result[j]["debut"] && req.body.debut < result[j]["fin"])))
                                {
                                    return res.send("Erreur : Un événement est déjà présent au niveau de cette plage horaire.");
                                }
                            }
                        }
                        db.query("UPDATE evenements SET debut=?, fin=?, jour=?, titre=? WHERE id=?", [req.body.debut,req.body.fin,req.body.jour,
                        req.body.titre,req.body.id], function(err,result)
                        {
                            if(err)
                            {
                                return res.send(err);
                            }
                            else
                            {
                                an_emmiter.emit('/liste');
                                res.send("L'événement a bien été modifié.");
                            }
                            });
                    }
                });
            });
        }
        else if(req.body.titre.trim() == "")
        {
            return res.send("Votre titre est vide.");
        }
        else if(req.body.debut.trim() == "")
        {
            return res.send("Aucune date de début n'a été entrée.");
        }
        else if(req.body.fin.trim() == "")
        {
            return res.send("Aucune date de fin n'a été entrée.");
        }
        else if(req.body.debut >= req.body.fin)
        {
            return res.send("La date de début est supérieur ou égal à la date de fin.");
        }
        else if(req.body.jour.trim() == "")
        {
            return res.send("Aucune jour n'a été entré.");
        }
    }
});

app.listen(process.env.PORT);