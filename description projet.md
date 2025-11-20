# Description simple du système

Le système est une API appelée Steam User Platine API.
Elle sert à récupérer des informations sur des utilisateurs Steam, leurs jeux, leurs succès, et à déterminer si un joueur a terminé un jeu à 100%.

Elle utilise la vrai API de steam (il y a donc besion d'une clé API steam). Mais 90% des routes peuvent êtres utilisé sans.

L’API est organisée autour de trois éléments principaux : les utilisateurs, les jeux, et les catégories.

#### 1. Utilisateurs

Le système peut :

afficher la liste de tous les utilisateurs,

afficher les informations d’un utilisateur spécifique grâce à son Steam ID,

afficher la liste des jeux d’un utilisateur,

afficher les succès obtenus ou manquants pour un jeu donné,

vérifier si un utilisateur a obtenu tous les succès d’un jeu (statut platine).

#### 2. Jeux

Le système permet :

d’obtenir la liste des jeux présents dans la base,

d’obtenir les informations d’un jeu à partir de son App ID,

d’obtenir la liste des succès d’un jeu,

d’obtenir le détail d’un succès particulier.

#### 3. Catégories

Le système peut aussi :

lister toutes les catégories de jeux,

afficher la description d’une catégorie spécifique.

#### 4. Modèles de données

Le système utilise les modèles suivants :

User

- steamId

- username

Game

- appId

- name

Achievement

- id

- name

Category

- id

- name