# Audit d'utilisation — 2 octobre 2026

Deux audits de praticité (vacancier : 22 constats, gérant : 25 constats),
corrigés par cinq lots puis vérifiés ensemble par le testeur. Rapports
détaillés : rédigés par les agents, non versionnés.

## Corrigé

- **Carte vacancier** : toucher un point ouvre enfin sa fiche (bloquant) ;
  sélecteur et zoom sous la barre d'état ; « 0 place » ; groupe complet ;
  désinscription confirmée depuis la fiche.
- **Infos pratiques** : plus de fausses données d'exemple ; état vide honnête
  avec 15, 17, 18, 112 ; numéros appelables ; modèles jamais publiés tels quels.
- **Erreur réseau** : « Problème de connexion · Réessayer » au lieu de listes
  vides, sur accueil, groupes, agenda, chat, annonces.
- **Groupes et chat** : heure avec le jour (« Demain 08:00 ») ; « Créer un
  groupe » ouvre le formulaire ; bouton Créer toujours visible ; non-membre :
  « Rejoindre » à la place de la saisie ; réactions plus grandes.
- **Confirmations** : se désinscrire, bloquer (et débloquer depuis le Profil),
  se déconnecter, supprimer son statut.
- **Arrivée et profil** : pseudo d'abord, avatars sur une ligne, case CGU de
  22 px ; profil pré-rempli au retour ; choix du profil traduits (codes
  stables, anciennes valeurs relues) ; photo existante pour un signalement.
- **Espace gérant** : plus rien sous la barre du bas au téléphone (bloquant) ;
  centre du camping enregistré avec le contour (bloquant) ; dupliquer une
  animation, heure par défaut à venir, mention de la notification ; inscrits
  copiables ; bannir depuis un message ; recherche de vacancier ; tuiles en
  deux colonnes et code d'accès en tête ; taux de remplissage plafonné ;
  statistiques bien titrées ; toasts au lieu d'alertes hors écran ; affiche QR
  imprimable ; logo transparent ; mot de passe oublié ; inscription d'un
  appareil à l'autre ; vocabulaire sans jargon ; export CSV protégé contre
  les formules.
- **Base** : écrire dans un groupe exige d'en être membre
  (`messages_ecriture_reservee_aux_membres`) ; signalements publiés en temps
  réel (`signalements_en_temps_reel`).

## Restant

- **Décidé (Johan, 3 octobre)** : la date de départ reste **facultative**.
  Sans date, un vacancier ne compte plus dans « vacanciers présents » et les
  compteurs 7 jours après son arrivée (`src/lib/presence.js`), mais il reçoit
  **toujours** les notifications : `send-push` garde l'ancienne règle (sans
  date = présent), volontairement. Ne pas y reporter la règle des 7 jours.
- Annuler une animation en prévenant les inscrits (colonne + notification).
- Prévenir le vacancier quand son signalement est résolu.
- Carte : une animation seule sur un lieu masque le point du lieu
  (`enCouronne` dans `Map.jsx`) ; le toast masque le bouton de la fiche ~3 s.
- Groupes à 320 px : le lieu est tronqué à côté de « Rejoindre » ; le « + »
  chevauche légèrement la dernière carte.
- Signalements gérant : aucun toast au changement de statut.
- Accueil à 320×568 : la première carte de groupe demande encore un petit
  défilement.
- Supabase → Authentication → URL Configuration : ajouter
  `https://app.campconnect.fr/admin` aux adresses de retour (mot de passe
  oublié).

## Sécurité — audit du 3 octobre 2026

Chaque faille a été prouvée par une simulation de rôle (vacancier, gérant,
anonyme) dans une transaction annulée, puis corrigée et revérifiée de la même
façon, sans casser la 1.0.2 publiée, la démo (cron `rafraichir-demo`,
7 groupes) ni les notifications (déclencheurs `push_*`).

### Fermé (migrations appliquées le 3 octobre, SQL dans `scripts/sql/2026-10-03_*`)

- **Jeton push détourné** (`durcissement_rls_cloisonnement`) : un appareil
  pouvait s'abonner aux notifications d'un autre vacancier, même d'un autre
  camping, et recevoir l'aperçu de ses messages. Le jeton doit désormais
  désigner un profil de la même identité (`jeton_push_autorise`).
- **Groupe au nom d'un autre** (`grp_insert` vérifie `createur_id`) ;
  **statut dans un autre camping** (`stat_insert`) ; **position dans un
  autre camping** (`pos_insert`, `pos_update`) ; **banni qui rejoint un
  groupe** (`mg_insert`) ; **brouillons d'animations lisibles** par les
  vacanciers (`anim_select` : publiées seulement).
- **Profil courant au hasard** : `my_camping_id()`, `my_vacancier_id()`,
  `est_banni()` prennent le profil le plus récent (`order by`).
- **Fonctions security definer** (`durcissement_fonctions_securite`) :
  fonctions de déclencheur (`notifier_push`, `notifier_candidature`,
  `touch_push_tokens`) plus appelables par l'API ; `a_cree_camping`,
  `est_banni` plus appelables sans session ; `search_path` fixé sur
  `touch_push_tokens`.
- **Couleur du camping injectée dans la carte** (`bornes_longueurs_couleurs`
  + `esc()` dans `Map.jsx`) : un gérant pouvait glisser du HTML exécuté chez
  ses vacanciers. La base n'accepte plus que `#rrggbb`.
- **Longueurs bornées côté base** : pseudo, statut, annonce, signalement,
  candidature (formulaire public), etc.
- **`api/notify.js`** (Vercel, ancienne alerte candidature) : fermé par
  défaut (secret obligatoire) et contenu échappé.
- Vérifié sain : RLS active partout ; un vacancier ou un gérant ne lit ni
  n'écrit rien d'un autre camping ; `send-push` (et sa copie `smart-service`)
  refuse sans `x-webhook-secret` (401) ; bucket `camping-assets` limité à
  JPEG/PNG/WebP 5 Mo, chemins par camping ; aucun secret ni
  `google-services.json` ni keystore dans le dépôt et son historique ;
  `camping_createurs` et `demo_ancre` : refus total voulu (utilisées
  seulement par des fonctions internes).

### Phase 2 en attente — à appliquer après la 1.0.3

**Les données des vacanciers restent trop lisibles tant que la phase 2 n'est
pas appliquée** : n'importe quel vacancier peut encore lire par l'API
l'emplacement, la tranche d'âge, la date de départ, le device_id et le
user_id des autres vacanciers de son camping.

- Phase 1 (faite) : l'app 1.0.3 ne lit plus ces colonnes que par
  `mon_profil()`, `vacanciers_du_camping()` (gérants) et
  `vacanciers_presents()` (`src/lib/vacanciers.js`). Fonctions créées en base
  (`fonctions_lecture_vacanciers`), sans effet sur la 1.0.2.
- Phase 2 (préparée, **non appliquée**) :
  `scripts/sql/a_appliquer_apres_1.0.3_colonnes_vacanciers.sql` retire la
  lecture directe de ces colonnes. Testée contre le code 1.0.3 ; elle
  casserait la 1.0.2. Quand, comment vérifier, comment revenir en arrière :
  en tête du fichier.

### Entrer dans n'importe quel camping — fermé en phase 1, phase 2 en attente

**Faille (haute)** : le code du jour se calculait dans l'app à partir de
l'identifiant public du camping (`getHourlyCode`), le contrôle GPS n'était
fait que dans l'app, et la politique `vac_insert` n'exige que
`user_id = auth.uid()`. Par l'API, n'importe qui pouvait créer un profil dans
n'importe quel camping, puis y lire messages, statuts, annonces.
Décision de Johan : « un code calculé par le serveur ».

- Phase 1 (faite, migration `code_acces_serveur`,
  `scripts/sql/2026-10-03_code_acces_serveur.sql`) :
  - clé secrète par camping (`camping_secrets`, illisible par anon et
    authenticated ; générée pour les campings existants et, par déclencheur,
    pour chaque nouveau) ;
  - code du jour = HMAC de la clé et de l'heure, 4 chiffres ; celui de l'heure
    précédente accepté 10 minutes ; 10 codes faux au plus par utilisateur et
    par heure, 60 par camping (`acces_essais`) ;
  - QR code de la réception = `…/join/<slug>?k=<clé>` ; le gérant lit code et
    clé par `acces_camping`, change la clé par `changer_cle_acces`
    (Paramètres → « Changer la clé du QR code ») ;
  - `verifier_acces_camping` (QR, GPS à moins de 800 m du centre, code) rend
    un jeton d'une à deux heures ; `rejoindre_camping` crée ou retrouve le
    profil avec ce jeton, les mêmes bornes que l'insertion, et l'accès libre
    de la démo ;
  - un profil ne peut plus changer de `camping_id` (sinon : entrer par la
    démo, puis basculer vers un autre camping) ;
  - l'app 1.0.3 n'insère plus dans `vacanciers` ; `getHourlyCode` a disparu.
  Simulé avant application (vacancier neuf et existant, gérant, anonyme ; bon
  code, mauvais code, code de l'heure précédente, clé QR, mauvaise clé, GPS
  dedans et dehors, accès libre, limite d'essais) puis vérifié après.
  Le GPS reste falsifiable par qui sait simuler une position : accepté.
- Phase 2 (préparée, **non appliquée**) :
  `scripts/sql/a_appliquer_apres_1.0.3_insertion_vacanciers.sql` retire
  l'insertion directe dans `vacanciers` (la 1.0.2 l'utilise encore). **Tant
  qu'elle n'est pas appliquée, la faille reste ouverte par l'API.** À
  appliquer avec la phase 2 des colonnes, mêmes conditions ; testée dans une
  transaction annulée.

### Restant

- **Schéma de travail `sim_acces`** : copie des fonctions ayant servi aux
  simulations du 3 octobre, sans aucun droit pour anon ni authenticated et
  invisible de l'API. Sa suppression demande une confirmation que l'agent ne
  pouvait pas donner : `drop schema sim_acces cascade;` (SQL Editor).
- **Réactions** : un vacancier peut réécrire la colonne `reactions` de
  n'importe quel message de son camping (effacer celles des autres). Corriger
  demande une fonction « réagir » et une nouvelle version de l'app.
- **Edge Function `notify-candidature`** : appelable par n'importe qui
  (email vers Johan au contenu choisi). Le déclencheur envoie déjà le secret ;
  il reste à poser `NOTIFY_SECRET` (étapes dans le rapport de sécurité).
- **Protection contre les mots de passe divulgués** désactivée (Supabase →
  Authentication → réglage à activer par Johan).
- `smart-service` : copie inutilisée de `send-push`, à supprimer du tableau
  de bord.
- `photo_url` des annonces et signalements accepte n'importe quelle adresse
  (pixel espion possible) : à restreindre au stockage du projet.
- Dépendances : `react-router` 7.13.1 et `ws` 8.19.0 ont des alertes hautes,
  non exploitables ici (rendu serveur / RSC non utilisés ; `ws` ne tourne pas
  dans le navigateur). Mettre à jour à la prochaine montée de version.

---

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

---

# Audit de l'espace gérant — 29 septembre 2026

Point de départ : un signalement envoyé depuis l'app, introuvable côté gérant.

## Corrigé

### Le signalement invisible — et tous les autres

- **La page Signalements était vide depuis des semaines.** Deux clés
  étrangères mènent de `signalements` à `vacanciers` (l'auteur du signalement,
  la personne signalée). La requête ne précisait pas laquelle : Supabase
  répondait `300` (jointure ambiguë) à chaque ouverture, et la page affichait
  « Aucun nouveau signalement ». Les journaux montrent l'erreur à chaque visite.
  Corrigé en nommant les contraintes. Un échec de chargement s'affiche
  désormais comme tel, au lieu de passer pour une liste vide.
- **Un signalement ne se voyait qu'en allant le chercher.** Pastille rouge
  sur « Signalements » dans le menu (temps réel), et bandeau « N nouveaux
  signalements à traiter » en tête de la vue d'ensemble.
- **On ne pouvait pas agir depuis un signalement.** Boutons « Supprimer le
  message / le statut / l'annonce » et « Bannir l'auteur » dans la carte.

### Sécurité (migrations appliquées et vérifiées)

| Faille | Gravité | Correction |
|---|---|---|
| **N'importe quel utilisateur connecté — même la session anonyme d'un vacancier — pouvait se déclarer gérant de n'importe quel camping**, et lire, modifier, supprimer toutes ses données | critique | On ne devient gérant que du camping qu'on vient de créer soi-même (`gerant_seulement_du_camping_quon_a_cree`) |
| Une session anonyme pouvait créer des campings | moyenne | Réservé aux comptes réels |
| **« Bannir » ne bloquait rien** : aucune règle ne lisait la colonne `banni` | haute | Un banni ne peut plus publier message, statut, annonce ni groupe (`bannir_bloque_vraiment`) |
| Un vacancier pouvait se débannir lui-même en modifiant son profil via l'API | haute | Seul un gérant du camping change ce drapeau |

Chaque règle a été testée en simulant un vacancier anonyme, un vrai compte et
un gérant, dans des transactions annulées : l'inscription self-service d'un
nouveau camping fonctionne toujours.

### Application

- **Sur le téléphone, passer en mode gérant effaçait l'identité du
  vacancier** : les deux sessions partageaient le même stockage. Il fallait
  recréer son profil en revenant. Sessions désormais rangées séparément.
  Conséquence unique : chaque gérant se reconnecte une fois après la mise à jour.
- Retour à l'espace vacancier sans se déconnecter (Réglages → « Espace
  vacancier », sur téléphone).
- **QR code des Paramètres cassé** : il encodait l'adresse de la page —
  `capacitor://localhost` depuis l'iPhone — et `?camping=` au lieu de
  `/join/`, qui ne dispense pas du contrôle GPS. Un seul lien, public, partout.
- **Animations** : un « 0 » s'affichait à côté des animations sans limite de
  places ; une animation modifiée après minuit était décalée d'un jour (date
  en temps universel) ; un enregistrement raté fermait le formulaire comme
  s'il avait réussi ; la liste commençait par la fin de saison — désormais
  « À venir » puis « Passées ». Formulaire dans la feuille partagée (clavier
  géré), sélecteur d'emojis complet, interrupteur accessible.
- **Modération** : suppression d'un seul appui, sans confirmation ni contrôle
  d'erreur ; ni les annonces (photos comprises) ni les groupes n'étaient
  modérables. Onglets Annonces et Groupes ajoutés.
- « Groupes actifs » comptait les groupes périmés ; « Copier le lien » ne
  disait rien ; le nouveau nom du camping n'apparaissait qu'au rechargement ;
  mot de passe : 6 caractères ici, 8 à l'inscription.
- Vue d'ensemble réorganisée : ce qui est à traiter, puis les chiffres du jour
  (deux colonnes sur téléphone, une ligne à l'écran), puis le code d'accès.

## Restant — espace gérant

1. **Pas de « mot de passe oublié »** à l'écran de connexion. En attendant :
   Supabase → Authentication → Users → *Send password recovery*.
2. **Export CSV et téléchargement du QR ne marchent pas dans l'app iPhone**
   (le téléchargement de fichier n'existe pas dans la vue web embarquée). Ils
   marchent depuis un navigateur : app.campconnect.fr/admin.
3. Le gérant ne reçoit **pas de notification** à l'arrivée d'un signalement.
4. Un compte = un camping (contrainte `gerants_user_unique`) : un groupe de
   campings devra utiliser un email par établissement.
5. La réinitialisation de saison ne vérifie pas le succès de chaque étape.
