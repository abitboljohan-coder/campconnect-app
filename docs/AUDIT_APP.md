# Audit de l'application vacancier — 29 septembre 2026

Lecture complète des écrans vacancier (inscription, accueil, groupes, chat,
agenda, carte, annonces, signalement, profil), des composants partagés, et des
règles d'accès de la base. Point de départ : une vidéo où la création d'un
groupe devenait inutilisable dès l'ouverture du clavier.

Chaque bug est décrit par **ce que vit le vacancier**, puis par sa cause.

---

## Corrigé dans cette version

### Créer un groupe, clavier ouvert (la vidéo)

- **Le formulaire tenait dans un tiers d'écran.** La feuille se plafonnait à
  « 85 % de l'écran moins le clavier ». Elle occupe désormais toute la hauteur
  visible au-dessus du clavier (`Sheet.jsx`). Corrige aussi toutes les autres
  feuilles : statut, annonce, modération, suppression de compte.
- **Le formulaire glissait sur le côté à chaque frappe.** Le champ Heure
  d'iOS impose sa largeur et débordait de sa colonne. Colonnes en
  `minmax(0, 1fr)`, champs date/heure bornés (`index.css`), défilement
  horizontal interdit dans les feuilles.
- **Le clavier s'ouvrait avant qu'on ait vu le formulaire.** `autoFocus`
  retiré du titre (et de l'annonce) : un modèle en un appui suffit souvent.

### Emojis

- **Douze emojis figés par écran.** Nouveau sélecteur partagé
  (`components/ChoixEmoji.jsx`) : suggestions, huit catégories (264 emojis),
  et n'importe quel emoji tapé au clavier du téléphone.
- **Refusés** (`lib/emojis.js`, testés) : 🍆 🍑 💦 👅 🫦 🥵 🔞 🖕 🔫 🔪 🗡️ 💣
  💊 💉 🚬 💀 ☠️ ⚰️ 🪦 🩸 💩 — toutes variantes de couleur de peau comprises.
  Un emoji refusé tapé au clavier est écarté avec un message.
- Utilisé pour : l'emoji d'un groupe, d'un statut, l'avatar à l'inscription.
- **L'avatar ne pouvait plus être changé après l'inscription.** Il se modifie
  maintenant depuis le profil.

### Groupes

- **« Rando demain matin » créée la veille donnait un rendez-vous déjà
  passé.** L'heure était toujours rattachée au jour même. Une heure dépassée
  de plus d'une heure désigne désormais le lendemain (`lib/groupes.js`).
- **Les groupes ne disparaissaient jamais.** Personne ne peut les fermer : le
  créateur n'en a pas le droit, et la console gérant n'a aucun écran pour le
  faire. Au bout d'une semaine, la liste
  proposait des apéros passés. 8 des 9 groupes actifs en base avaient plus de
  7 jours. Un groupe n'est plus proposé que jusqu'à 3 h après son heure, ou
  24 h après sa création s'il n'en a pas. Ses membres le gardent dans « Mes
  groupes ».
- **On rejoignait un groupe « 4 places » à dix.** Le maximum n'était
  qu'affiché. Le bouton passe à « Complet ».
- Maximum de membres ramené entre 2 et 50 (un « 1 » rendait le groupe
  complet d'emblée).

### Accueil

- **Compteurs faux** : « 5 groupes actifs » et « 4 animations » quel que soit
  le nombre réel — ils comptaient des listes tronquées.
- **Son propre statut n'apparaissait pas** si le temps réel était coupé
  (veille, réseau du camping) : on republiait en croyant l'envoi raté.

### Chat

- **Messages manquants au retour dans l'app.** Le temps réel ne rattrape pas
  ce qui arrive pendant la veille. La conversation est relue au retour au
  premier plan.
- **Son propre message pouvait ne jamais s'afficher** (même cause) : il
  s'affiche dès l'envoi, sans doublon.
- **Réagir à un vieux message ramenait tout en bas.** Le défilement ne se fait
  plus qu'à l'arrivée d'un message.
- Flèche retour : cible de 44 × 44 au lieu d'une douzaine de pixels.

### Agenda et carte

- **Les animations passées restaient au programme toute la saison**, en tête
  de liste, et l'on pouvait encore s'y inscrire. Masquées deux heures après
  leur début (agenda et carte). Les groupes périmés quittent aussi la carte.
- Confirmation d'inscription traduite (elle restait en français).

### Profil

- **Après « Enregistrer », l'écran montrait l'ancien pseudo**, et l'accueil
  comme le chat le gardaient jusqu'au redémarrage : le profil n'était écrit
  qu'en base. Il remonte désormais dans l'application.
- Pseudo vide refusé à l'enregistrement.
- L'enregistrement du profil ne réenregistre plus l'appareil pour les
  notifications.

### Inscription

- **Recherche d'un camping avec une virgule** (« Les Pins, Var ») : la requête
  cassait et l'écran affichait « aucun camping ».
- **Code du jour refusé à une minute près** : lu à 10 h 58, tapé à 11 h 01. Le
  code précédent reste accepté pendant les 10 premières minutes de l'heure.
- Champ du code : pavé numérique simple sur iOS, 4 chiffres maximum.

### Annonces

- **Une annonce (photo comprise) ne pouvait être ni signalée ni son auteur
  bloqué**, contrairement aux messages et statuts. Bouton ⋯ ajouté ; la
  console gérant l'affiche comme « Annonce ».
- **Photo perdue sans le dire** : l'annonce partait sans sa photo, en silence.
  Un message le signale maintenant.

---

## Sécurité — corrigé en base (migrations appliquées le 29/09)

| Faille | Correction | Migration |
|---|---|---|
| N'importe quel vacancier pouvait **réécrire le texte des messages des autres** via l'API (la règle d'accès servait aux réactions, mais portait sur toutes les colonnes) | Seule la colonne `reactions` reste modifiable | `messages_seules_les_reactions_sont_modifiables` |
| **N'importe quel gérant pouvait écrire dans les fichiers de tous les campings** (remplacer le plan d'un autre) | Écriture limitée aux dossiers de son camping | `stockage_cloisonne_par_camping` |
| Le seau public de fichiers **acceptait tout type de fichier** (une page HTML y aurait été servie) | Images uniquement (JPEG, PNG, WebP) | idem |
| Un vacancier pouvait déposer une photo dans le dossier d'un autre camping | Dossier de son camping uniquement | idem |
| Rejoindre un groupe ou s'inscrire à une animation ne vérifiait pas le camping | Vérifié par la base | `bornes_emojis_et_textes` |
| Champs emoji utilisables comme zone de texte libre | 16 caractères max ; titre de groupe 80 ; message 2 000 | idem |

Chaque règle a été vérifiée en simulant un vacancier et un gérant réels, dans
une transaction annulée : ce qui doit passer passe, le reste est refusé.

---

## Restant — à traiter plus tard

Classé par impact pour le vacancier. Rien de bloquant pour un pilote.

1. **Chat, clavier ouvert sur iPhone — à vérifier sur appareil.** L'app n'a
   pas le greffon `@capacitor/keyboard`. Si la zone de saisie du chat se
   retrouve sous le clavier ou si l'en-tête sort de l'écran, c'est la
   correction : l'installer avec `resize: 'native'`.
2. **Démarrage sans réseau : un vacancier inscrit revoit l'écran
   d'inscription.** Au-delà de 7 s de chargement, l'app ne se sert pas du
   profil gardé sur le téléphone. Elle se répare dès que le réseau revient,
   mais l'écran fait peur. Correction : partir du profil en cache.
3. **Impossible de quitter un groupe**, ni de fermer celui qu'on a créé. La
   documentation produit l'annonce pourtant.
4. **Bouton retour Android avec une feuille ouverte** : il change de page au
   lieu de fermer la feuille.
5. **Deux réactions simultanées sur un même message : l'une est perdue.**
   Les réactions sont réécrites en bloc. Correction : une fonction SQL.
6. **Places d'une animation ou d'un groupe : limite vérifiée par l'app, pas
   par la base.** Deux inscriptions à la même seconde peuvent dépasser d'une
   place. Correction : un déclencheur.
7. **Traductions manquantes** : choix du profil (Solo, En couple, centres
   d'intérêt), étiquettes de l'agenda (Sport, Famille, Soirée), messages
   d'erreur de la carte.
8. **Code du jour calculable** : il dérive de l'identifiant du camping par une
   formule présente dans l'app. C'est un ralentisseur, pas un verrou — à
   savoir avant de le présenter comme une sécurité à un gérant.
9. **Dates en temps universel** : entre minuit et 2 h, « aujourd'hui » vaut
   encore hier (jour de départ, date minimale du calendrier).
10. Un statut supprimé par le gérant reste affiché chez les vacanciers jusqu'au
    rechargement de l'accueil.
11. Le chat charge tous les messages d'un groupe d'un coup : sans effet sur un
    séjour, lourd pour un groupe qui vivrait toute une saison.
12. **Console gérant : « Groupes actifs — en ce moment » compte aussi les
    groupes périmés** (même cause que côté vacancier). Chiffre flatteur mais
    faux, à aligner sur la règle de `lib/groupes.js` avant de montrer les
    statistiques à un gérant.
