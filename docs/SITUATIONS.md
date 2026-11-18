# Banque de situations de camping (vidéos qui vendent l'app)

Exigence de Johan (29 oct. 2026) : chaque vidéo raconte une **vraie situation de camping**
que tout le monde a vécue, puis montre **comment CampConnect la règle**, avec de vrais
écrans de l'app. On vend l'application : pas de démo abstraite, pas d'habillage décoratif.

## Structure obligatoire (20 à 35 s)

1. **0–3 s, l'accroche** : la situation, tout de suite, en image et en texte. Exemples :
   « Il est 22 h, Lapinou a disparu. »
2. **3–10 s, la galère** : ce qui se passe sans l'app (affiche, haut-parleur, tour du
   camping, file à l'accueil).
3. **10–25 s, la solution** : la fonction de CampConnect qui règle le problème, sur de
   vrais écrans filmés dans la démo. Le téléphone est entier, jamais l'écran carte.
4. **25–35 s, la chute** : la situation réglée, une émotion (soulagement, rire), puis
   l'appel à l'action pour les gérants.

Le storyboard est écrit **avant** toute production : une case par plan, avec ce qu'on voit,
le texte à l'écran, l'écran de l'app montré et la durée. `controle-video` le valide avant
le rendu. Il est ensuite enregistré dans le champ `storyboard` de la Vidéothèque.

## Les situations (à piocher, en ne reprenant jamais celle d'une des 6 dernières vidéos)

Chaque situation est reliée à une fonction qui existe vraiment dans l'app.

| Situation vécue | Fonction qui la règle |
|---|---|
| Un enfant a perdu son doudou | Annonce du gérant à tout le camping (notification), ou message dans un groupe |
| Les poubelles débordent près des sanitaires | Signalement du vacancier, avec photo, reçu tout de suite par le gérant |
| La douche est froide, le bloc sanitaire en panne | Signalement, puis annonce « réparé » |
| L'orage arrive, l'animation du soir est déplacée | Modifier l'animation, et tout le camping est prévenu |
| Le tournoi de pétanque n'a que 3 inscrits | Animation publiée, notification, inscriptions qui arrivent en direct |
| Le gérant répète 40 fois le code Wi-Fi | Livret d'accueil (Wi-Fi, horaires, règles) |
| Des enfants cherchent des copains de leur âge | Groupes entre vacanciers (« ados », « foot du soir ») |
| Des parents veulent un apéro entre voisins | Créer un groupe « apéro » et discuter |
| Des nouveaux arrivants ne connaissent personne | Entrée par QR code, « Quoi de neuf », groupes actifs |
| La musique trop forte à minuit | Signalement discret au gérant |
| Le marché nocturne, personne n'est au courant | Annonce ou animation, avec notification |
| La boulangerie ouvre plus tard dimanche | Annonce du gérant |
| Un vélo d'enfant oublié devant l'accueil | Annonce « objet trouvé » |
| La file à l'accueil pour savoir « on fait quoi ce soir ? » | Agenda des animations dans l'app |
| La piscine fermée pour entretien | Annonce, et le livret mis à jour |
| Le gérant refait la même animation chaque semaine | Dupliquer une animation en un geste |
| Un intrus sans bracelet entre dans le camping | Entrée vérifiée par QR code |
| Les vacanciers étrangers ne comprennent pas l'affiche | Interface de l'app en 4 langues. Seule l'interface est traduite, jamais les textes écrits par le gérant : ne pas promettre de traduction automatique |
| La fuite d'eau sur un emplacement | Signalement au gérant, avec photo |
| Le dernier soir, tout le monde veut se dire au revoir | Le groupe des voisins, les messages |

Toujours à vérifier dans la démo : la fonction montrée existe, l'écran est réel, et rien
n'est inventé (ni chiffre, ni client, ni témoignage).
