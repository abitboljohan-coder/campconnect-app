# Nouveautés — météo, signalements, petites annonces

Trois fonctionnalités ajoutées à l'app vacancier, plus un écran gérant.

## 1. Météo du camping ☀️

Bandeau sur l'écran d'accueil : température actuelle + les 3 prochains jours.

- Source : **Open-Meteo** — gratuit, sans clé API, sans compte à créer.
- Position : centre du contour du camping (ou lat/lng réglées dans l'admin Carte).
- Cache d'1 heure (`sessionStorage`) pour ne pas rappeler l'API à chaque retour.
- **Se cache tout seul** si le camping n'a pas de coordonnées ou si l'API ne répond pas :
  un module secondaire ne doit jamais casser l'accueil.

> ⚠️ La météo n'apparaît que si le camping a des coordonnées.
> Elles se règlent dans **/admin → Carte** (tracer le contour ou placer le camping).

## 2. Signaler un problème 🛠️

Le vacancier remonte un souci en quelques secondes, photo à l'appui.

**Côté vacancier** (`/signaler`, accès rapide sur l'accueil) :
- 5 catégories : propreté, panne, sécurité, bruit, autre
- Description + lieu + **photo** (l'appareil photo s'ouvre directement sur mobile)
- Les photos sont **compressées côté client** (max 1400 px, JPEG 80 %) — un original
  de 6 Mo tombe à ~200 Ko, l'envoi passe même en 3G.

**Côté gérant** (`/admin → Signalements`) :
- Trois onglets : **Nouveaux · En cours · Résolus** avec compteurs
- Photo cliquable en plein écran, pseudo + emplacement du vacancier
- Changement de statut en un clic
- **Temps réel** : un nouveau signalement apparaît sans rafraîchir la page

## 3. Petites annonces & objets trouvés 📣

Entraide entre vacanciers du même camping (`/annonces`).

- 3 types : **Annonce** (« je prête ma pompe à vélo »), **Trouvé**, **Perdu**
- Titre, description, photo optionnelle
- Filtres par type, tri du plus récent au plus ancien
- L'auteur marque son annonce comme **terminée** quand c'est réglé
- **Expiration automatique après 14 jours** : la liste reste propre sans modération

---

## Mise en service

### 1. Base de données
Dans **Supabase → SQL Editor**, exécuter :

```
scripts/sql/signalements_annonces.sql
```

Ce script crée les tables `signalements` et `annonces` (cloisonnées par camping,
RLS activée) **et resserre la sécurité du bucket de photos** — voir ci-dessous.

### 2. Sécurité du stockage (important)

Le script corrige un point : jusqu'ici, **tout utilisateur authentifié** — donc
n'importe quel vacancier — pouvait écrire partout dans le bucket `camping-assets`,
y compris écraser le logo du camping.

Après le script :
- **Gérants** : accès complet au bucket
- **Vacanciers** : dépôt autorisé uniquement dans `signalements/` et `annonces/`

### 3. Vérification

Le script se termine par une requête de contrôle. Attendu :

| colonne | valeur |
|---|---|
| `table_signalements` | `signalements` |
| `table_annonces` | `annonces` |
| `policies_signalements` | 4 |
| `policies_annonces` | 4 |

### 4. Build

```powershell
git pull origin main
npm install
npm run build:mobile
```

---

## Traductions

Tout est disponible en **français, anglais, espagnol et néerlandais** —
les nouveaux écrans suivent la langue du téléphone comme le reste de l'app.

## Notes techniques

- Les photos vont dans le bucket existant `camping-assets`, sous
  `signalements/{camping_id}/` et `annonces/{camping_id}/`.
- Si l'upload d'une photo échoue, le signalement **part quand même** sans la photo :
  mieux vaut une remontée sans image que rien du tout.
- Cloisonnement respecté partout : un vacancier ne voit que les annonces de son
  camping et ses propres signalements ; le gérant voit ceux de son camping.
