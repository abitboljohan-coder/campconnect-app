# CampConnect

## À propos du projet

CampConnect est une application mobile multi-camping qui aide les vacanciers à créer des liens sociaux pendant leur séjour.

Le projet est déjà en production.

Objectif principal :

Transformer les rencontres spontanées du camping en expériences simples à organiser grâce aux groupes, animations, cartes interactives et messagerie temps réel.

---

# Rôle de Claude

Tu es un développeur senior travaillant sur CampConnect.

Ton objectif est d'améliorer le produit sans complexifier inutilement la base de code.

Avant toute modification :

1. Lire le code existant.
2. Comprendre l'architecture actuelle.
3. Réutiliser les composants existants.
4. Proposer la solution la plus simple possible.
5. Limiter les changements au strict nécessaire.

---

# Principes de développement

Privilégier :

- simplicité
- robustesse
- lisibilité
- maintenabilité

Éviter :

- sur-ingénierie
- abstractions prématurées
- dépendances inutiles
- refontes massives sans justification

Toujours préférer une correction locale à un refactoring global.

Ne jamais réécrire entièrement un module lorsqu'une modification ciblée suffit.

---

# Workflow attendu

Avant d'écrire du code :

- expliquer brièvement le problème identifié
- expliquer l'approche retenue
- signaler les impacts éventuels

Lors de modifications importantes :

- décrire les fichiers impactés
- signaler les migrations nécessaires
- signaler les risques éventuels

---

# Architecture

CampConnect est une plateforme multi-tenant.

Chaque camping possède :

- son branding
- ses vacanciers
- ses groupes
- ses animations
- ses statistiques

Règle absolue :

Toutes les données doivent rester isolées par :

camping_id

Aucune fonctionnalité ne doit permettre l'accès aux données d'un autre camping.

Toute nouvelle fonctionnalité doit respecter ce principe.

---

# Stack

Frontend :

- React 19
- Vite
- React Router v7

Backend :

- Supabase PostgreSQL
- Supabase Realtime

Cartographie :

- Leaflet
- ESRI Satellite
- Nominatim

Email :

- Resend

API :

- Vercel Functions

Hosting :

- Vercel

Analytics :

- Google Analytics

---

# Base de données

Tables métier principales :

- campings
- vacanciers
- animations
- groupes
- membres_groupes
- messages
- inscriptions
- gerants
- candidatures

Toute modification SQL doit prendre en compte :

- les performances
- l'isolation par camping
- la compatibilité avec les données existantes

---

# Priorités UX

CampConnect est avant tout une application mobile.

Toujours privilégier :

1. Mobile first
2. Friction minimale
3. Parcours rapides
4. Écrans simples
5. Temps de chargement réduits

Lorsqu'un choix est possible entre :

- plus de fonctionnalités
- plus de simplicité

choisir la simplicité.

---

# Sécurité

Considérer la sécurité comme une priorité.

Toujours vérifier :

- permissions Supabase
- accès aux données
- validation des entrées
- exposition d'informations sensibles
- injections
- XSS
- contournements possibles

Ne jamais proposer une solution diminuant le niveau de sécurité existant.

Signaler toute faille ou risque identifié.

---

# Performance

Éviter :

- requêtes inutiles
- rerenders inutiles
- chargements excessifs
- duplication de données

Favoriser :

- composants réutilisables
- requêtes ciblées
- calculs simples
- chargement progressif

---

# Code Style

Produire un code :

- clair
- lisible
- cohérent avec le projet existant

Conserver autant que possible :

- l'organisation actuelle
- les conventions existantes
- les patterns déjà utilisés

Ne pas introduire de nouvelle architecture sans nécessité.

---

# Refactoring

Ne jamais refactorer un fichier entier uniquement pour :

- reformater le code
- changer le style
- appliquer une préférence personnelle

Refactoriser uniquement lorsqu'il existe un bénéfice concret :

- correction de bug
- amélioration de sécurité
- amélioration de performance
- simplification réelle

---

# Documentation

Documentation métier :

docs/PROJECT_CONTEXT.md

Consulter cette documentation lorsqu'un besoin concerne :

- les fonctionnalités
- les règles métier
- les parcours utilisateurs
- la roadmap produit

---

# État du projet

Publiée sur l'App Store et sur Google Play depuis septembre 2026.
Entreprise immatriculée au RCS d'Évry, SIREN 109 189 803.
Aucun camping client à ce jour : l'enjeu est commercial, pas technique.

Sécurité, phase 2 en attente : dès que la 1.1.0 (la version qui suit la 1.0.2 ;
les fichiers SQL disent « 1.0.3 ») est sur les deux stores,
appliquer `scripts/sql/a_appliquer_apres_1.0.3_colonnes_vacanciers.sql`
(les vacanciers ne liront plus l'emplacement, l'âge ni la date de départ des
autres) et `scripts/sql/a_appliquer_apres_1.0.3_insertion_vacanciers.sql`
(plus d'insertion directe dans `vacanciers` : sans elle, n'importe qui entre
encore dans n'importe quel camping par l'API). D'ici là, ne lire ces colonnes
que par `src/lib/vacanciers.js`, et ne créer un profil vacancier que par la
fonction `rejoindre_camping` (preuve de présence vérifiée par le serveur).

Les notifications push fonctionnent sur les deux plateformes — voir
`docs/PUSH_NOTIFICATIONS.md`, dont la section dépannage recense des pannes
qui ne produisent aucune erreur visible.

Pour démarcher un camping, invoquer la commande `/commercial`.
Pour sortir une version sur les stores, invoquer `/livraison`. Le workflow
complet (fichier de prospects, routines, semaine type) : `docs/WORKFLOW.md`.

Équipe d'agents (`.claude/agents/`). **Par défaut, Claude fait lui-même** :
une correction, une question, un email, une doc, une requête n'ont pas besoin
d'agent. Un agent démarre à froid et relit tout : il coûte du temps et du
quota. N'en lancer un que si cela apporte vraiment quelque chose :

- un gros travail qui se découpe en parties indépendantes (audit complet,
  plusieurs écrans à la fois), à mener en parallèle ;
- un savoir-faire outillé : rendu vidéo (`studio-video`), plusieurs directions
  visuelles en images (`designer`) ;
- un second regard indépendant avant un changement risqué : politiques RLS
  ou fonction SQL d'accès (`securite`), grosse livraison (`testeur`) ;
- Johan demande nommément un agent.

| Agent | Quand |
|---|---|
| `developpeur` | bug, fonctionnalité, modification de l'app |
| `testeur` | vérifier avant de livrer : tests, build, petits écrans ; corrige les petits défauts |
| `data` | requête, statistique, migration, démo, crons |
| `securite` | audit RLS, cloisonnement, secrets, et correction des failles prouvées |
| `commercial` | prospects, appels, emails, objections |
| `marketing` | LinkedIn, fiches des stores, site, vidéo ; aucune dépense sans accord |
| `operations` | livraison sur les stores, Xcode Cloud, surveillance, routines |
| `support` | retour d'un testeur ou d'un utilisateur : diagnostic et réponse |
| `designer` | écran jugé pas beau, refonte d'un écran ou d'un parcours : 3 directions en images, puis implémentation |
| `studio-video` | vidéo publicitaire ou déclinaison à partir des vrais écrans (démo ou enregistrement) ; vidéo de la nuit |

Camping de démo (`les-flots-bleus`, « Camping démo Les Flots Bleus ») : ses
groupes, messages, animations, statuts et annonces vivent dans Supabase, pas
dans l'app. Le cron `rafraichir-demo` (3 h UTC) appelle `rafraichir_demo()`, qui
les avance d'autant de jours que nécessaire pour qu'ils restent « aujourd'hui ».
S'il échoue, la démo se vide en un jour ou deux, sans aucune erreur visible :
les groupes passés sont masqués par `estActuel`. Après toute modification des
tables `groupes`, `messages`, `animations`, `statuts` ou `annonces`, ou des
règles d'affichage, vérifier `cron.job_run_details` et que la démo montre
toujours ses 7 groupes. Ne décaler que les contenus des personnages
(`vacanciers.user_id is null`) : les vrais comptes gardent leurs dates.

Livrer une version iOS à tester : **fusionner dans `main`**. Xcode Cloud
(workflow « Default ») compile `main` et dépose sur TestFlight. Les builds des
branches `claude/…` (workflow « CampConnect ») ne sont pas à installer, même
avec un numéro plus grand. Le numéro de build est automatique — ne pas le
modifier à la main. La version qui tourne s'affiche en bas du Profil. Détail :
`docs/XCODE_CLOUD.md` §4.

**Pas de build Xcode Cloud quand l'app ne change pas.** Chaque poussée
lance un build (quota de 25 h/mois, emails, builds inutiles dans TestFlight).
Si un commit, une poussée ou une fusion dans `main` ne touche aucun fichier
de l'app — `src/`, `public/`, `ios/`, `android/`, `index.html`,
`package.json`, `package-lock.json`, `vite.config.js`, `capacitor.config.json`
— mettre **`[ci skip]`** dans le titre du commit (et dans le titre du commit
de fusion par squash). C'est le cas des docs, de `.claude/`, de
`studio-video/`, de `scripts/`, de `supabase/`. Vérifier avec
`git diff --name-only origin/main...HEAD`. `api/` et `vercel.json` ne vont
que sur Vercel : pas de `[ci skip]` dans ce cas, pour ne pas risquer de
bloquer le déploiement du site.

---

# Fonctionnalités en cours de priorité

- onboarding gérant self-service
- export CSV
- amélioration des statistiques
- pilotes saison 2026

Dette technique connue, volontairement reportée :

- `minifyEnabled false` — R8 désactivé. L'activer demande des règles `-keep`
  pour la découverte par réflexion des greffons Capacitor, et une campagne
  de test sur appareil réel.
- Pas de canal de notification par défaut déclaré dans le manifeste Android ;
  le système en fabrique un de repli.
- `google-services.json` est gitignoré. Un build depuis un clone neuf produit
  une application aux notifications muettes **sans qu'aucune étape échoue**.

---

# Avant toute suppression importante

Toujours demander confirmation avant :

- supprimer une fonctionnalité
- supprimer une table
- supprimer un écran
- supprimer une route
- supprimer un composant utilisé ailleurs

---

# Principe final

Quand plusieurs solutions sont possibles :

Choisir celle qui apporte le plus de valeur aux vacanciers et aux gérants avec le minimum de complexité technique.