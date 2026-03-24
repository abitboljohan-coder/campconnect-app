# CampConnect

Application mobile (PWA) pour campings — une seule app pour tous les campings, centrée sur le lien entre vacanciers.

> Développée en React/Vite, déployée sur Vercel en tant que PWA. Fonctionne sur iOS et Android sans passer par les stores.

---

## Liens

| | URL |
|---|---|
| App (vacanciers + admin) | https://app.campconnect.fr |
| Site vitrine | https://www.campconnect.fr |
| Supabase | https://hsebtpliwimyidudajmi.supabase.co |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Base de données | Supabase (PostgreSQL) |
| Temps réel | Supabase Realtime (`postgres_changes`) |
| Cartes | Leaflet + tuiles satellite ESRI |
| Notifications email | Resend (domaine campconnect.fr vérifié) |
| API serverless | Vercel (`/api/notify.js`) |
| Hébergement app | Vercel (`app.campconnect.fr`) |
| Hébergement site vitrine | GitHub Pages (`www.campconnect.fr`) |

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

### Code tournant horaire

```js
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

### Anti-doublons (Device ID)

- `deviceId` UUID généré à chaque ouverture, stocké en localStorage
- Sauvegardé dans `vacanciers.device_id`
- Au rechargement : lookup par `device_id + camping_id` → restauration automatique de session

---

## Pages vacancier

| Page | Route | Description |
|---|---|---|
| Accueil | `/` | Fil d'activité, prochaines animations, groupes actifs |
| Carte | `/map` | Satellite ESRI, pins interactifs, GPS auto-follow |
| Groupes | `/groupes` | Groupes spontanés, rejoindre en 1 clic |
| Chat | `/chat/:groupeId` | Messagerie temps réel entre membres |
| Agenda | `/agenda` | Animations du camping, inscription en 1 clic |
| Profil | `/profil` | Avatar emoji, pseudo, emplacement, déconnexion |

---

## Interface admin (`/admin`)

Accessible via login/mot de passe gérant (table `gerants`).

- **Dashboard** — vue d'ensemble, code horaire, stats temps réel
- **MapEditor** — carte satellite, ajout/déplacement de pins
- **Animations** — création/édition, publication immédiate
- **Statistiques** — fréquentation, inscriptions, groupes populaires
- **Paramètres** — nom, couleurs, logo du camping

---

## Base de données Supabase

### Tables

```sql
campings        — id, nom, slug, couleur_principale, logo_url, plan_url, carte_config
vacanciers      — id, camping_id, pseudo, avatar_emoji, emplacement, device_id
animations      — id, camping_id, titre, emoji, lieu, debut, places_max, publiee
groupes         — id, camping_id, titre, emoji, lieu, heure, actif
inscriptions    — animation_id, vacancier_id
membres_groupes — groupe_id, vacancier_id
messages        — id, groupe_id, vacancier_id, contenu, created_at
gerants         — id, camping_id, email, mot_de_passe_hash
candidatures    — id, created_at, nom, email, camping, emplacements, message
```

### Migrations SQL

```sql
-- Device ID (anti-doublons)
ALTER TABLE vacanciers ADD COLUMN IF NOT EXISTS device_id text;
CREATE INDEX IF NOT EXISTS idx_vacanciers_device_id ON vacanciers(device_id, camping_id);

-- Carte config + Realtime
ALTER TABLE campings ADD COLUMN IF NOT EXISTS carte_config jsonb DEFAULT '{}'::jsonb;
ALTER PUBLICATION supabase_realtime ADD TABLE campings;

-- Candidatures pilote
CREATE TABLE candidatures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  nom text NOT NULL, email text NOT NULL,
  camping text NOT NULL, emplacements text, message text
);
ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert" ON candidatures FOR INSERT WITH CHECK (true);
```

---

## Notifications email (Resend)

Chaque nouvelle candidature pilote déclenche un email vers `contact@campconnect.fr`.

**Flux :** `candidatures` INSERT → Supabase Database Webhook → `POST /api/notify` → Resend API

- Domaine `campconnect.fr` vérifié dans Resend
- Fonction serverless : `api/notify.js` (Vercel)
- Clé API Resend : dans le code (à migrer en variable d'env)

---

## Lancer le projet

```bash
npm install
npx vite --host 0.0.0.0 --port 5173   # dev local (accessible sur mobile)
npm run build                           # build production
```

### Variables d'environnement (`.env.local`)

```
VITE_SUPABASE_URL=https://hsebtpliwimyidudajmi.supabase.co
VITE_SUPABASE_ANON_KEY=[clé anon]
```

---

## Site vitrine (`/site-web`)

| Fichier | Description |
|---|---|
| `index.html` | Landing page principale |
| `tarifs.html` | Tarifs + simulateur ROI + mises en situation |
| `pour-les-campings.html` | Landing page gérants |
| `comment.html` | Comment ça marche |
| `apropos.html` | À propos |
| `deploy.py` | Script de déploiement GitHub Pages via API |

```bash
cd site-web
python deploy.py               # déploie tous les fichiers
python deploy.py tarifs.html   # déploie un seul fichier
```

---

## Roadmap

- [x] App PWA déployée sur `app.campconnect.fr`
- [x] Site vitrine sur `www.campconnect.fr`
- [x] Formulaire candidature pilote → Supabase + email automatique
- [x] Un camping en base (Les Naïades Port Grimaud)
- [ ] Dashboard gérant complet
- [ ] Onboarding gérant (création compte depuis le site)
- [ ] Push notifications
- [ ] Pilote saison 2026 — 3 campings pionniers
