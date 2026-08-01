# Fiche Play Store — textes & réponses à recopier

Tout ce qui suit est prêt à copier-coller dans la Play Console.
Les réponses sont **vérifiées contre le code** (`AndroidManifest.xml`,
`scripts/sql/*.sql`, `src/pages/Onboarding.jsx`, `src/pages/Annonces.jsx`) —
la source est indiquée à chaque fois qu'une réponse pourrait prêter à débat.

---

## 1. Identité de l'app

| Champ | Valeur |
|---|---|
| Nom (30 car. max) | `CampConnect` |
| Nom du package | `com.campconnect.app` — **définitif**, doit rester aligné sur `applicationId` |
| Catégorie | Voyages et infos locales (alternative : Réseaux sociaux) |
| Type | Application · **Gratuite** (choix irréversible) |
| E-mail développeur | abitboljohan@gmail.com |
| Site web | https://www.campconnect.fr |

---

## 2. Description courte (80 car. max)

```
Groupes, chat et animations : vivez votre camping avec les autres.
```

*(alternative : « La vie de votre camping en direct : rencontres, animations, plan et chat. »)*

---

## 3. Description longue (4000 car. max)

```
CampConnect, c'est l'application qui recrée le lien entre vacanciers de votre camping.

En camping, trois heures suffisent pour passer d'inconnus à complices. Encore faut-il se croiser. CampConnect vous donne les outils pour que ça arrive : voir qui propose quoi, rejoindre en un clic, discuter, et se retrouver.

CES VACANCES, VOUS N'ÊTES PLUS SEULS

• GROUPES SPONTANÉS
Randonnée demain matin, pétanque à 18h, apéro sur la plage, soirée barbecue… Créez un groupe en quelques secondes, ou rejoignez ceux des autres vacanciers du camping. Tout le monde les voit, tout le monde peut participer.

• CHAT EN TEMPS RÉEL
Une messagerie instantanée par groupe. Plus besoin d'échanger son numéro maladroitement : on discute directement dans l'app, on s'organise, on se donne rendez-vous.

• AGENDA DES ANIMATIONS
Le programme complet publié par l'équipe du camping : tournois, spectacles, ateliers, soirées. Inscription en un clic, avec le nombre de participants déjà inscrits. Vous ne ratez plus rien.

• CARTE INTERACTIVE DU CAMPING
Le plan de votre camping en vue satellite, avec tous les points utiles repérés : piscine, bar, sanitaires, terrains de sport, laverie, parking. Vous vous repérez dès le premier jour.

• LIVRET D'ACCUEIL NUMÉRIQUE
Horaires de la piscine, code Wi-Fi, règlement, services, numéros utiles : tout est dans l'app, consultable à toute heure sans déranger la réception.

• PROFIL SIMPLE, SANS PRISE DE TÊTE
Un pseudo, un avatar, votre numéro d'emplacement. Pas d'email, pas de mot de passe, pas de formulaire interminable. Vous êtes dans l'app en trente secondes.

RÉSERVÉ AUX VACANCIERS DE VOTRE CAMPING

CampConnect n'est pas un réseau social ouvert. Chaque camping a son espace, accessible uniquement aux personnes présentes sur place, via le QR code affiché à la réception ou un code d'accès communiqué par l'équipe. Vous ne discutez qu'avec vos voisins de vacances, personne d'autre.

POUR LES CAMPINGS

Chaque camping dispose de son propre espace aux couleurs de l'établissement, avec son logo et son plan. L'équipe publie ses animations, suit les inscriptions et met à jour son livret d'accueil depuis une interface dédiée.

Vous gérez un camping et souhaitez proposer CampConnect à vos vacanciers ? Rendez-vous sur www.campconnect.fr

VIE PRIVÉE

Aucune donnée n'est revendue. Pas de publicité. Les échanges restent au sein de votre camping, et vos données sont supprimées à la fin de votre séjour.

Politique de confidentialité : https://www.campconnect.fr/confidentialite.html
```

> La phrase « supprimées à la fin de votre séjour » est **exacte** : la fonction
> `purge_vacanciers_partis()` (`scripts/sql/hardening.sql`) est planifiée via
> `pg_cron` et supprime les vacanciers dont la `date_depart` est passée.

---

## 4. Éléments visuels

| Élément | Fichier | Format | État |
|---|---|---|---|
| Icône | `assets/store/icon-512.png` | 512×512 | ✅ |
| Image de présentation | `assets/store/feature-graphic-1024x500.png` | 1024×500 | ✅ |
| Captures téléphone | `assets/store/screenshots/01→05` | 1080×1920 (9:16) | ✅ |
| Capture de la carte | — | — | ⬜ **à faire sur appareil réel** |

Ordre conseillé : Carte → Groupes → Chat → Agenda → Accueil → Infos.

Les captures **tablette 7"/10" sont facultatives** dès lors que 2 captures
téléphone sont fournies (le message « au moins deux captures de téléphone **ou**
de tablette » est un seuil global). Les omettre prive seulement l'app d'une mise
en avant sur tablettes et Chromebooks.

> La capture de la carte ne peut pas être produite hors ligne : les tuiles
> satellite ESRI ne se chargent pas et l'écran sort en fond gris, avec le bouton
> de debug « Simuler GPS » visible. À prendre depuis un téléphone réel.

---

## 5. Accès à l'application ⚠️ principal motif de rejet

CampConnect est **fermé par défaut**. `src/pages/Onboarding.jsx` exige, pour
entrer dans un camping :

- une position GPS à **moins de 800 m** du camping (ligne 85), **ou**
- un **code à 4 chiffres qui change toutes les heures** (`getHourlyCode`), **ou**
- une arrivée via `/join/<slug>` — le QR physique vaut preuve de présence et la
  vérification est alors sautée (commentaire ligne 28).

Un testeur Google, à l'étranger et sans code, **ne peut pas ouvrir l'app**.
C'est un motif de rejet classique (« fonctionnalité inaccessible au testeur »).

**Réponse à donner** : *« Une partie de mon application est protégée »*, puis
ces instructions :

```
Aucun identifiant ni mot de passe n'est requis.

Les campings réels vérifient que le vacancier est présent sur place
(position GPS, ou QR code affiché à la réception). Un camping de
démonstration a été ouvert spécialement pour la revue, sans aucune
vérification de position : il est accessible depuis n'importe où.

1. Lancez l'application.
2. Sur le premier écran, cherchez « Les Flots Bleus ».
3. Sélectionnez-le, saisissez un pseudo, et l'application s'ouvre
   entièrement : groupes, messagerie, agenda, carte et livret d'accueil.
```

> **Ne pas indiquer le lien `https://app.campconnect.fr/join/les-flots-bleus`
> comme unique moyen d'accès.** Il fonctionne dans un navigateur, mais **pas**
> dans l'app installée : Capacitor sert toujours l'app depuis `/`, si bien que
> le test de chemin dans `Onboarding.jsx` ne peut pas voir `/join/`. Un testeur
> qui installe l'app et la lance normalement n'emprunterait jamais ce chemin.
> D'où la recherche par nom dans les instructions ci-dessus, qui, elle, marche
> partout.

> **Prérequis** : le camping de démonstration doit exister **en production**.
> Le script `scripts/sql/seed_flots_bleus.sql` le crée de bout en bout —
> 6 groupes, 8 animations, 11 fiches de livret, 11 points sur la carte et des
> conversations déjà entamées. Il est idempotent et date les animations
> relativement à aujourd'hui : **le relancer avant chaque soumission** évite un
> agenda vide, qui suffirait à faire rejeter l'app.

---

## 6. Sécurité des données (Data safety)

- L'app collecte-t-elle des données ? → **Oui**
- Chiffrées en transit ? → **Oui** (HTTPS / Supabase)
- Suppression possible ? → **Oui** → `https://www.campconnect.fr/suppression-donnees.html`
- Partage avec des tiers ? → **Non**
- Utilisées pour la publicité ? → **Non**

| Donnée | Catégorie Play | Finalité | Facultatif ? |
|---|---|---|---|
| Pseudo + avatar | Infos personnelles → Nom | Fonctionnalité | Non |
| Adresse e-mail | Infos personnelles → Adresse e-mail | Connexion **des gérants** (Supabase Auth) | Non (gérants) |
| Emplacement, tranche d'âge, centres d'intérêt | Infos personnelles → Autres | Fonctionnalité | Oui |
| Messages du chat | Messages → Autres messages intégrés | Fonctionnalité | Oui |
| Photos (signalements, annonces) | Photos et vidéos → Photos | Fonctionnalité | Oui |
| Position **approximative** | Position → Position approximative | Contrôle de présence | Oui |
| Position **précise** | Position → Position précise | Contrôle de présence, calibrage du camping | Oui |
| Identifiant d'appareil | Identifiants → ID de l'appareil | Notifications, anti-doublon | Non |

**Trois points sur lesquels ne pas se tromper :**

- **Position précise à déclarer.** Le manifeste demande `ACCESS_FINE_LOCATION`,
  et surtout : si un camping n'a pas encore de centre calibré, les coordonnées
  exactes du vacancier sont **écrites en base** dans `campings.carte_config.center`
  (`Onboarding.jsx` lignes 73-82). Il y a donc bien transmission hors appareil.
  Dans tous les autres cas la position reste locale — la distance est calculée
  côté client et seul le résultat est conservé.

- **La position n'est PAS partagée avec les autres vacanciers.** Vérifié : la
  table `positions` existe dans le schéma mais **aucun code ne la lit ni ne
  l'écrit** ; c'est un reliquat d'une carte « type Snap Map » jamais branchée.
  La présence temps réel (`usePresence.js`) ne transmet qu'un horodatage.
  Répondre **Non** au partage de position est donc exact et défendable.

- **Ne pas oublier les photos.** `Signaler.jsx` et `Annonces.jsx` téléversent
  dans le bucket `camping-assets` via `getPublicUrl` — les images sont donc
  accessibles publiquement à qui possède l'URL. Omettre la catégorie « Photos
  et vidéos » est un motif classique de suspension.

### Permissions déclarées

| Permission | Pourquoi |
|---|---|
| `INTERNET` | Communication avec le serveur |
| `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` | Vérifier la présence au camping |
| `POST_NOTIFICATIONS` | Notifications de groupe et d'animations (Android 13+) |
| Appareil photo (sélecteur système) | Joindre une photo à un signalement / une annonce |

---

## 7. Classification du contenu (IARC)

| Question | Réponse |
|---|---|
| Catégorie | Réseau social / communication |
| Violence, contenu sexuel, grossièretés, drogue, jeux d'argent | Non à tout |
| Les utilisateurs communiquent-ils entre eux ? | **Oui** (chat de groupe, annonces) |
| Peuvent-ils partager images / contenu créé par eux ? | **Oui** (photos jointes) |
| La position est-elle partagée avec d'autres utilisateurs ? | **Non** (voir §6) |
| Contenu modérable ? | **Oui** — le gérant supprime messages, statuts, annonces et bannit |
| Contenu limité à un groupe fermé ? | **Oui** — cloisonné par camping (QR, GPS ou code horaire) |

Résultat attendu : **PEGI 3 / Tout public**.

---

## 8. Public cible & déclarations diverses

| Section | Réponse |
|---|---|
| Tranche d'âge cible | 18 ans et plus |
| Destinée aux enfants ? | Non |
| Contient des publicités ? | Non |
| Application d'actualités / COVID / finance | Non |
| Politique de confidentialité | `https://www.campconnect.fr/confidentialite.html` |

> Vérifié : la politique en ligne couvre bien position, GPS, pseudo, messages et
> notifications. Toute divergence entre cette page et le formulaire Data Safety
> est un motif de rejet — les remettre à jour ensemble.

---

## 9. Avant la production : le test fermé obligatoire

Tout compte développeur **personnel** créé après novembre 2023 doit, avant
d'accéder à la production :

1. lancer un **test fermé** avec **au moins 12 testeurs** ;
2. les maintenir inscrits **14 jours consécutifs** ;
3. puis demander l'accès à la production.

Prévoir donc **~3 semaines** entre le premier AAB uploadé et la publication
réelle. Les testeurs se recrutent par e-mail (Google Groupes ou liste
d'adresses) : proches, collègues, futurs campings pilotes.

---

## 10. Reste à faire

- [ ] Capture d'écran de la carte, depuis un appareil réel
- [ ] Exécuter `scripts/sql/seed_flots_bleus.sql` en production (bloque la revue)
- [ ] Clé de signature `campconnect-release.jks` — ⚠️ à sauvegarder à vie
- [ ] Build de l'AAB — voir `docs/PUBLICATION_ANDROID.md`
- [ ] Recruter 12 testeurs
