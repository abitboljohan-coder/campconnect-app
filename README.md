# CampConnect

Application mobile native (iOS + Android) pour campings — une seule app pour tous les campings, centrée sur le lien entre vacanciers.

> Le frontend est développé en React/Vite, puis empaqueté en application native via **Capacitor** pour distribution sur l'App Store et le Play Store.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite 8 |
| Routing | React Router v7 |
| Base de données | Supabase (PostgreSQL) |
| Temps réel | Supabase Realtime (`postgres_changes`) |
| Cartes | Leaflet + tuiles satellite ESRI |
| Charts | Recharts |
| QR Code | qrcode.react |
| App native | Capacitor (iOS + Android) |
| Distribution | App Store + Google Play Store |
| Backend / API | Vercel + campconnect.fr |

---

## Architecture multi-camping

Une seule app sert tous les campings. Le camping est identifié par :

1. L'URL `/join/[slug]` (QR code imprimé à la réception)
2. Le paramètre `?camping=[slug]` (dev)
3. Le `campingSlug` en localStorage (retour sur l'app)
4. Fallback `demo` en local (dev uniquement)

---

## Accès vacancier — Onboarding

### Flux d'entrée

```
QR code scanné (/join/slug)
  → camping chargé automatiquement
  → formulaire profil directement (pas de vérification)

Recherche manuelle
  → rechercher le camping par nom
  → vérification de présence :
      GPS < 800m du camping → accès auto ✅
      GPS indisponible → code à 4 chiffres (change toutes les heures)
  → formulaire profil
```

### Auto-calibration du camping

Si `carte_config.center` n'est pas défini (nouveau camping) :
- Le premier vacancier qui vérifie par GPS → sa position est sauvegardée comme centre du camping
- Calibration automatique, l'admin n'a rien à faire

### Code tournant horaire

```js
// Fonctionne avec UUID
function getHourlyCode(campingId) {
  const h = Math.floor(Date.now() / 3_600_000)
  const str = String(campingId) + String(h)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0
  }
  return String((Math.abs(hash) % 9000) + 1000)
}
```

Affiché sur le dashboard admin, change chaque heure.

### Anti-doublons (Device ID)

- À chaque ouverture : génération d'un `deviceId` UUID stocké en localStorage (`crypto.randomUUID()`)
- Sauvegardé en base dans `vacanciers.device_id`
- Au rechargement : lookup par `device_id + camping_id` → restauration automatique de session
- Fallback localStorage pour les anciens comptes (migration automatique)

---

## Pages vacancier

### Accueil (`/`)
- Fil d'activité du camping
- Prochaines animations
- Groupes actifs

### Carte (`/map`)
- **Satellite par défaut** — tuiles ESRI World Imagery
- **Toggle Satellite | Plan** en haut (si l'admin a uploadé un plan)
- Pins interactifs : lieux, animations, groupes
- GPS auto-follow : la carte suit la position de l'utilisateur
- Bouton 🎯 pour re-synchroniser après un déplacement manuel
- Drag → désynchronisation automatique du suivi
- Realtime Supabase : pins mis à jour instantanément quand l'admin sauvegarde
- Mode simulation GPS (pour les tests dev)

### Groupes (`/groupes`)
- Création de groupes spontanés (volley, rando, soirée...)
- Rejoindre en un clic

### Chat (`/chat/:groupeId`)
- Messagerie temps réel entre membres d'un groupe

### Agenda (`/agenda`)
- Animations publiées par l'admin
- Inscription en un clic

### Profil (`/profil`)
- Avatar emoji, pseudo, numéro d'emplacement
- Déconnexion

---

## Interface admin (`/admin`)

Accessible via login/mot de passe distinct des vacanciers.

### Dashboard
- Vue d'ensemble du camping
- Code d'accès horaire en cours (à afficher à la réception)
- Statistiques temps réel

### Apparence
- Nom, couleur principale, logo
- **MapEditor** — carte satellite interactive :
  - Recherche Google Maps-style pré-remplie avec le nom du camping
  - Ajout/déplacement/suppression de pins (lieux, animations, groupes)
  - Sauvegarde en `carte_config.pins` dans Supabase
  - Panel flottant, carte pleine largeur (560px)

### Animations
- Création/édition d'animations avec lieu, date, places max, emoji
- Publication immédiate côté vacanciers

### Statistiques
- Fréquentation, inscriptions, groupes populaires

### Paramètres
- Configuration générale du camping

---

## Base de données Supabase

### Tables principales

```sql
campings (
  id uuid PRIMARY KEY,
  nom text,
  slug text UNIQUE,           -- identifiant URL (ex: "camping-les-pins")
  couleur_principale text,    -- couleur hex du camping
  logo_url text,
  plan_url text,              -- image du plan du camping (optionnel)
  carte_config jsonb,         -- { center: {lat, lng}, pins: [...] }
  created_at timestamptz
)

vacanciers (
  id uuid PRIMARY KEY,
  camping_id uuid REFERENCES campings,
  pseudo text,
  avatar_emoji text,
  emplacement text,
  device_id text,             -- identifiant unique du téléphone
  created_at timestamptz
)

animations (
  id uuid PRIMARY KEY,
  camping_id uuid REFERENCES campings,
  titre text,
  emoji text,
  lieu text,
  debut timestamptz,
  places_max int,
  publiee boolean
)

groupes (
  id uuid PRIMARY KEY,
  camping_id uuid REFERENCES campings,
  titre text,
  emoji text,
  lieu text,
  heure timestamptz,
  actif boolean
)

inscriptions (
  animation_id uuid,
  vacancier_id uuid
)

membres_groupes (
  groupe_id uuid,
  vacancier_id uuid
)
```

### SQL à exécuter dans Supabase SQL Editor

```sql
-- Colonne device_id pour anti-doublons
ALTER TABLE vacanciers ADD COLUMN IF NOT EXISTS device_id text;
CREATE INDEX IF NOT EXISTS idx_vacanciers_device_id ON vacanciers(device_id, camping_id);

-- Carte config et Realtime
ALTER TABLE campings ADD COLUMN IF NOT EXISTS carte_config jsonb DEFAULT '{}'::jsonb;
ALTER PUBLICATION supabase_realtime ADD TABLE campings;
```

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Dev local (accès réseau pour tester sur mobile)
npx vite --host 0.0.0.0 --port 5173

# Build production
npm run build
```

### Variables d'environnement (`.env.local`)

```
VITE_SUPABASE_URL=https://[projet].supabase.co
VITE_SUPABASE_ANON_KEY=[clé anon]
SUPABASE_SERVICE_ROLE_KEY=[clé service role]
```

---

## Carte satellite — détails techniques

- Tuiles : ESRI World Imagery
- `maxZoom: 19`, `maxNativeZoom: 19` (évite "Map data not yet available")
- Initialisation protégée contre React StrictMode double-invoke : `isMounted` flag + `lfRef.current` guard
- Le suivi GPS utilise `followingRef` (pas le state) pour éviter les closures périmées

---

## Distribution mobile — Capacitor

Le code React est empaqueté via **Capacitor** pour produire une vraie application native distribuée sur les stores.

### iOS (App Store)
- Build Capacitor → projet Xcode → soumission App Store Connect
- Accès GPS natif, push notifications, icône sur l'écran d'accueil comme n'importe quelle app

### Android (Google Play)
- Build Capacitor → projet Android Studio → soumission Play Console

### Installation vacancier
1. Chercher "CampConnect" sur l'App Store ou Play Store
2. Télécharger → ouvrir → rejoindre son camping (QR code ou recherche)

### Avantages vs PWA
- Push notifications iOS sans restriction
- Accès GPS haute précision en arrière-plan
- Visibilité store (recherche, featured)
- Expérience native complète (animations, gestures)
- Pas de friction "Ajouter à l'écran d'accueil"

---

## Site vitrine

Situé dans `campconnect-main/`

- `index.html` — Landing page principale
- `tarifs.html` — Tarifs
- `apropos.html` — À propos
- `comment.html` — Comment ça marche

Servir en local : `npx serve . --listen 3000`

---

## Roadmap

- [ ] Intégration Capacitor (iOS + Android)
- [ ] Déploiement Vercel + domaine campconnect.fr
- [ ] Soumission App Store (Apple) + Play Store (Google)
- [ ] Push notifications natives iOS/Android
- [ ] Mise à jour site vitrine (style Apple, contenu app native)
- [ ] Pilote saison 2025 — 3 campings pionniers
