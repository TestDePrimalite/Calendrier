# Calendrier
Projet calendrier application Web

Le contenu de la base de donnée à exporter est dans le fichier "CalendrierFrancoisMikael.sql". Il suffit de copier le contenu du fichier (qui contient du code SQL) dans 
l'onglet "SQL" de phpMyAdmin.
Cela va créer une base de donnée au nom de CalendrierFrancoisMikael, avec 2 table : utilisateurs et evenements. Il y a déjà utilisateurs enregistrés (A titre d'exemple):
Login : Nash , Mot de passe : user1
Login : Lind , Mot de passe : user2

Vous pouvez créer un compte via la page principale, en cliquant sur "Créer un compte".
Vous pouvez également vous connecter via le bouton "Se connecter".
Le calendrier est capable de naviguer entre les semaines grâce à deux liens "Semaine suivante" et "Semaine précédente", et peut revenir
à la semaine courante grâce au lien "Semaine courante".

Si l'on clique sur une case libre du calendrier, un formulaire de création d'événement s'affiche, et la procédure d'ajout est possible si l'on est connecté.
Si l'on clique sur une case occupée, un formulaire d'effacement d'événement s'affiche, et l'effacement est possible si l'événement en question a été créé par l'utilisateur connecté.

Note : les événements du calendrier se mettent à jour toutes les 10 secondes.