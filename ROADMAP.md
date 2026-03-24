# CampConnect — Roadmap & État du projet

> Dernière mise à jour : 25 mars 2026
> Chef de projet : ce fichier. Le mettre à jour à chaque session.

---

## Vue d'ensemble

```
PHASE 0 — Infrastructure        ████████████ 100% ✅
PHASE 1 — App vacancier         ████████░░░░  75% 🔄
PHASE 2 — App gérant            ████░░░░░░░░  30% 🔄
PHASE 3 — Site vitrine          ████████░░░░  70% 🔄
PHASE 4 — Sécurité & qualité    ██░░░░░░░░░░  15% ⏳
PHASE 5 — Acquisition pilotes   ████████░░░░  60% 🔄
PHASE 6 — Onboarding campings   ░░░░░░░░░░░░   0% ⏳
PHASE 7 — Scale                 ░░░░░░░░░░░░   0% ⏳
```

---

## PHASE 0 — Infrastructure ✅

| Tâche | Statut | Notes |
|---|---|---|
| App React PWA (Vite + React Router) | ✅ | |
| Déploiement Vercel | ✅ | auto-deploy sur push main |
| Domaine `app.campconnect.fr` | ✅ | CNAME → Vercel |
| Site vitrine GitHub Pages | ✅ | `www.campconnect.fr` |
| Domaine `campconnect.fr` | ✅ | CNAME → GitHub Pages |
| Supabase (base de données) | ✅ | Projet `hsebtpliwimyidudajmi` |
| `vercel.json` SPA routing | ✅ | Toutes les routes → index.html |
| `deploy.py` site vitrine | ✅ | Push GitHub API sans git |
| Email notifications (Resend) | ✅ | Domaine campconnect.fr vérifié |
| Formulaire candidature → email | ✅ | Supabase webhook → /api/notify |

---

## PHASE 1 — App vacancier 🔄

### Onboarding
| Tâche | Statut | Notes |
|---|---|---|
| QR code scan → `/join/[slug]` | ✅ | |
| Recherche camping par nom | ✅ | |
| Vérification GPS (< 800m) | ✅ | |
| Code horaire 4 chiffres (fallback) | ✅ | Change chaque heure |
| Formulaire profil (pseudo, emoji, emplacement) | ✅ | |
| Device ID anti-doublons | ✅ | `crypto.randomUUID()` |
| Auto-calibration centre camping (1er GPS) | ✅ | |

### Pages
| Page | Statut | Ce qui manque |
|---|---|---|
| Accueil (fil d'activité) | ✅ | |
| Carte (Leaflet + satellite ESRI) | ✅ | Amélioration fond SVG (optionnel) |
| Groupes (création + rejoindre) | ✅ | |
| Chat temps réel | ✅ | |
| Agenda (animations + inscription) | ✅ | |
| Profil (avatar, pseudo, déco) | ✅ | |

### Manquant Phase 1
- [ ] **Test complet end-to-end** sur un vrai téléphone avec un vrai camping
- [ ] **Gestion erreur offline** (app sans réseau)
- [ ] **Animation de transition** entre pages (optionnel)

---

## PHASE 2 — App gérant 🔄

| Tâche | Statut | Ce qui manque |
|---|---|---|
| Table `gerants` en base | ✅ | |
| Route `/admin` | ✅ (partiel) | Login non sécurisé |
| Login gérant (email + mot de passe) | ⚠️ | À sécuriser avec Supabase Auth |
| Dashboard — vue d'ensemble | ⚠️ | Stats basiques présentes |
| Code horaire affiché (à donner à l'accueil) | ✅ | |
| Création / édition animations | ⚠️ | UI présente, à tester |
| MapEditor (pins sur carte) | ✅ | Fonctionnel |
| Paramètres camping (nom, couleur, logo) | ⚠️ | Présent, à tester |
| Statistiques (fréquentation, groupes) | ⚠️ | Partiel |
| Upload plan camping | ⏳ | Non fait |
| Envoi notification push depuis dashboard | ⏳ | Non fait |

### Priorités Phase 2 (dans l'ordre)
1. [ ] **Sécuriser le login gérant** via Supabase Auth
2. [ ] **Tester l'onboarding complet** d'un nouveau camping depuis zéro
3. [ ] **Dashboard stats** : nb vacanciers actifs, animations, groupes
4. [ ] **Upload logo et plan**

---

## PHASE 3 — Site vitrine 🔄

| Page | Statut | Ce qui manque |
|---|---|---|
| `index.html` | ✅ | Liens footer (mentions légales) |
| `tarifs.html` | ✅ | — |
| `pour-les-campings.html` | ⚠️ | 35+ fautes d'accent, fausses témoignages à supprimer |
| `comment.html` | ⚠️ | Contenu à mettre à jour (parle encore de "PWA" pas "app native") |
| `apropos.html` | ⚠️ | Contenu OK, email Cloudflare à nettoyer |
| `mentions-legales.html` | ⏳ | Non créée |
| `confidentialite.html` | ✅ | |

### Corrections à faire (site vitrine)
- [ ] **Fautes d'accent** sur `pour-les-campings.html` (35+ instances)
- [ ] **Supprimer les faux témoignages** sur `pour-les-campings.html`
- [ ] **Liens footer** `href="#"` sur `index.html` (mentions légales, confidentialité)
- [ ] **Créer `mentions-legales.html`** (obligatoire légalement)
- [ ] **Mettre à jour `comment.html`** avec contenu app actuelle

---

## PHASE 4 — Sécurité & qualité ⏳

| Tâche | Statut | Notes |
|---|---|---|
| RLS activé sur toutes les tables | ❌ | Toutes en UNRESTRICTED actuellement |
| Policies anon/vacancier/gérant | ❌ | Urgent avant pilotes réels |
| SQL migrations complètes | ⚠️ | `device_id` fait, reste `tranche_age`, `avec`, `interets` |
| Variables d'env (clé Resend hors code) | ❌ | Clé hardcodée dans `notify.js` |
| HTTPS / headers sécurité | ✅ | Géré par Vercel |
| RGPD — mentions dans l'app | ⚠️ | Partiel |

### Priorité absolue avant 1er pilote réel
- [ ] **RLS policies** sur `vacanciers`, `messages`, `groupes`, `campings`
  - Un vacancier ne voit que les données de son camping
  - Un gérant ne gère que son camping
- [ ] **Clé Resend** → variable d'environnement Vercel

---

## PHASE 5 — Acquisition pilotes 🔄

| Tâche | Statut | Notes |
|---|---|---|
| Page `tarifs.html` (offre 0€, 3 places) | ✅ | |
| Page `pour-les-campings.html` | ✅ (à corriger) | |
| Formulaire candidature | ✅ | |
| Email auto à chaque candidature | ✅ | contact@campconnect.fr |
| Candidatures en base (Supabase) | ✅ | |
| Prompt prospection Vibe Prospect | ✅ | Rédigé le 25/03 |
| Prospection active | ⏳ | À lancer |
| 1er camping pilote signé | ⏳ | |
| 2ème camping pilote signé | ⏳ | |
| 3ème camping pilote signé | ⏳ | |

---

## PHASE 6 — Onboarding campings ⏳

*Se déclenche quand le 1er pilote est signé.*

| Tâche | Statut | Notes |
|---|---|---|
| Script d'onboarding gérant (SQL) | ⏳ | Créer camping + gérant en 2 min |
| QR code personnalisé par camping | ⏳ | Via `/join/[slug]` |
| Guide PDF gérant | ⏳ | Formation en 1h |
| Session visio onboarding | ⏳ | 30 min par camping |
| Suivi mensuel pendant la saison | ⏳ | |

---

## PHASE 7 — Scale ⏳

*Après validation du produit sur les pilotes.*

| Tâche | Statut | Notes |
|---|---|---|
| Push notifications iOS/Android | ⏳ | Capacitor ou Web Push |
| Analytics dashboard gérant avancé | ⏳ | |
| Multi-langue (EN, DE, NL) | ⏳ | Campings avec clientèle étrangère |
| App Store + Play Store (Capacitor) | ⏳ | |
| Passage au plan Supabase payant | ⏳ | Si > 500 utilisateurs actifs |
| Facturation (Stripe) | ⏳ | Fin de la période pilote |

---

## Ce qu'il faut faire MAINTENANT (priorités)

```
1. 🔴 URGENT — Lancer la prospection (Vibe Prospect)
   → Objectif : 3 campings pilotes avant mai 2026

2. 🟠 IMPORTANT — Corriger le site vitrine
   → Accents sur pour-les-campings.html
   → Supprimer faux témoignages
   → Créer mentions-legales.html

3. 🟠 IMPORTANT — Sécuriser avant pilote
   → RLS policies Supabase
   → Clé Resend en variable d'env

4. 🟡 QUAND UN PILOTE EST SIGNÉ — Tester l'onboarding gérant
   → Login /admin, créer animations, MapEditor
```

---

## Campings en base

| Camping | Slug | Statut |
|---|---|---|
| Les Naïades Port Grimaud | `les-naïades-port-grimaud` | Démo (données fictives) |

---

## Contacts & accès

| Service | Accès |
|---|---|
| Vercel | Dashboard Vercel, projet `campconnect-app` |
| Supabase | `hsebtpliwimyidudajmi.supabase.co` |
| GitHub | `abitboljohan-coder/campconnect-app` + `abitboljohan-coder/campconnect` |
| Resend | Compte `abitboljohan@gmail.com`, domaine `campconnect.fr` vérifié |
| Infomaniak | DNS + messagerie `contact@campconnect.fr` |
| Hébergeur DNS | Infomaniak (manager.infomaniak.com) |
