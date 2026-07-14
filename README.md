# CampConnect

**L'application mobile qui recrée le lien entre vacanciers.**

CampConnect est une application mobile native déployée sur `app.campconnect.fr`, accessible sur iOS et Android. Une seule app sert tous les campings clients — chacun a son propre espace brandé (logo, couleurs, plan).

> En camping, trois heures suffisent pour passer d'inconnus à complices. CampConnect donne aux vacanciers les outils pour que ça arrive encore.

---

## Liens

| | URL |
|---|---|
| App vacanciers + admin | https://app.campconnect.fr |
| Site vitrine | https://www.campconnect.fr |
| Supabase | https://hsebtpliwimyidudajmi.supabase.co |

---

## Fonctionnalités — côté vacancier

### Carte interactive GPS
Carte satellite ESRI avec le plan personnalisé du camping en overlay. Affiche les points d'intérêt (piscine, bar, terrains de sport…), les groupes actifs et les animations à venir. Suivi GPS automatique.

### Groupes spontanés
Les vacanciers créent des groupes thématiques (randonnée, pétanque, soirée barbecue, apéro plage…) visibles de tous les autres vacanciers du camping. Rejoindre en 1 clic.

### Chat en temps réel
Messagerie instantanée par groupe via Supabase Realtime. Fini les numéros de téléphone échangés maladroitement.

### Agenda des animations
Programme complet des animations publiées par le gérant. Inscription en 1 clic, compteur de participants visible. Notifications si l'animation est complète.

### Livret d'accueil numérique
Sections dépliables : horaires piscine, code Wi-Fi, règlement intérieur, bar/snack, laverie, poubelles, animaux, numéros d'urgence. Configuré par le gérant, consulté dans l'app sans déranger la réception.

### Profil vacancier
Avatar emoji, pseudo, numéro d'emplacement, tranche d'âge, avec qui on voyage. Pas d'email requis — friction zéro.

### Accès sécurisé
- **QR code** imprimé à la réception → scan → accès immédiat
- **GPS** : vérification automatique si le vacancier est à moins de 800 m du camping
- **Code horaire** : code à 4 chiffres qui change toutes les heures (affiché à la réception)

---

## Fonctionnalités — interface gérant (`/admin`)

### Accueil (dashboard)
Métriques en temps réel : nombre de vacanciers inscrits, groupes actifs, inscriptions du jour, taux de remplissage animations. Code horaire affiché pour la réception. Activité récente (derniers groupes créés, dernières inscriptions).

### Animations
Créer, modifier, publier ou dépublier des animations. Voir la liste des inscrits (pseudo, emplacement, tranche d'âge). Gestion des capacités max. Suppression avec cascade sur les inscriptions.

### Carte
Upload du plan image du camping (JPG/PNG, compression automatique). Éditeur de carte satellite : placer des points d'intérêt sur la carte (47 types de lieux disponibles : piscine, tennis, bar, sanitaires, wifi, parking…). Les pins sont visibles par les vacanciers dans l'app.

### Apparence
Nom du camping, couleurs principale et secondaire (avec aperçu live de l'app), logo (PNG/JPG/SVG). Tout se reflète immédiatement sur l'app des vacanciers.

### Statistiques
Graphiques sur 30 jours : nouveaux vacanciers par jour, top animations par inscriptions, répartition par tranche d'âge, avec qui voyagent-ils, top centres d'intérêt, groupes créés par jour.

### Paramètres
Modifier email et mot de passe du compte gérant. Générer et télécharger le QR code du camping. Réinitialisation des données de saison (conserve les animations et la config).

---

## Tarifs (saison 2026)

| Formule | Prix | Emplacements |
|---|---|---|
| Découverte | **490 € / an** | Jusqu'à 50 emplacements |
| Essentiel | **790 € / an** | Jusqu'à 200 emplacements |
| Premium | **1 290 € / an** | 200+ emplacements |

**Offre pilote saison 2026 : GRATUIT** — 3 campings sélectionnés, déployé en 48h, accompagnement personnalisé toute la saison.

Toutes les formules incluent : app branded (logo + couleurs), dashboard gérant, support, mises à jour.

---

## Camping de démonstration

Un camping de test est disponible pour les démos :

| | |
|---|---|
| Camping | Les Pins Verts |
| Slug | `les-pins-verts` |
| URL vacancier | https://app.campconnect.fr/join/les-pins-verts |
| Login gérant | gerant@les-pins-verts.fr / PinsVerts2026! |
| URL admin | https://app.campconnect.fr/admin |

Le camping de demo contient 12 animations pré-créées et 4 groupes actifs.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Base de données | Supabase (PostgreSQL) |
| Temps réel | Supabase Realtime |
| Cartes | Leaflet + tuiles satellite ESRI + Nominatim |
| Email | Resend (domaine campconnect.fr vérifié) |
| API serverless | Vercel (`/api/notify.js`) |
| Hébergement app | Vercel |
| Hébergement site vitrine | GitHub Pages |
| Analytics | Google Analytics G-PRTR7LJLGD |

---

## Base de données (Supabase)

```sql
campings        — id, nom, slug, couleur_principale, couleur_secondaire, logo_url, plan_url, carte_config, infos
vacanciers      — id, camping_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, device_id
animations      — id, camping_id, titre, emoji, lieu, debut, places_max, publiee, description
groupes         — id, camping_id, titre, emoji, lieu, heure, actif
inscriptions    — animation_id, vacancier_id
membres_groupes — groupe_id, vacancier_id
messages        — id, groupe_id, vacancier_id, contenu, created_at
gerants         — id, camping_id, email
candidatures    — id, created_at, nom, email, camping, emplacements, message
```

---

## Notifications email

Chaque nouvelle candidature pilote (formulaire sur le site vitrine) déclenche un email vers `contact@campconnect.fr`.

**Flux :** `candidatures` INSERT → Supabase Webhook → `POST /api/notify` → Resend API → email reçu

---

## Site vitrine (`www.campconnect.fr`)

| Page | Description |
|---|---|
| `index.html` | Landing principale + formulaire candidature pilote |
| `pour-les-campings.html` | Landing gérants, bento grid fonctionnalités |
| `tarifs.html` | Tarifs + simulateur ROI interactif |
| `comment.html` | Comment ça marche (4 étapes) |
| `apropos.html` | Histoire et vision |
| `mentions-legales.html` | Mentions légales |
| `confidentialite.html` | Politique de confidentialité |

Déploiement via `python deploy.py [fichier.html]` → GitHub Pages.

---

## Roadmap

### Fait ✅
- Application mobile déployée (`app.campconnect.fr`)
- Site vitrine déployé (`www.campconnect.fr`) avec GA4
- Formulaire candidature pilote → Supabase + email auto (Resend)
- Architecture multi-camping (un slug par camping)
- Accès vacancier : QR code / GPS 800m / code horaire
- Carte interactive GPS + points d'intérêt (MapEditor)
- Groupes spontanés + chat temps réel
- Agenda animations + inscriptions
- Livret d'accueil numérique
- Interface admin complète (dashboard, animations, carte, apparence, stats, paramètres)
- Camping démo "Les Pins Verts" opérationnel
- Favicon + Google Search Console validée
- Tarifs marché (490 / 790 / 1290 €/an)

### En cours / À venir
- [ ] Onboarding gérant en self-service (création compte depuis le site)
- [ ] Push notifications (Expo / Web Push)
- [ ] Export des données vacanciers (CSV)
- [ ] Clé Resend en variable d'environnement Vercel
- [ ] RLS Supabase (sécurisation des tables)
- [ ] Pilote saison 2026 — 3 campings pionniers
