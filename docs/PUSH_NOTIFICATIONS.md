# Notifications push — mise en place (Android + iOS)

Architecture :

```
App native ──(token FCM/APNs)──▶ table push_tokens (Supabase)
Nouveau message / animation ──▶ Database Webhook ──▶ Edge Function send-push ──▶ FCM ──▶ appareils
```

Le code est déjà en place :
- `src/push.js` — enregistrement de l'appareil + gestion des taps
- `App.jsx` — appelle `registerPush()` dès qu'un vacancier est identifié
- `scripts/sql/push_tokens.sql` — table des tokens (cloisonnée, RLS)
- `supabase/functions/send-push/` — envoi FCM v1 (messages + animations)
- Android : permission `POST_NOTIFICATIONS` ajoutée
- iOS : `AppDelegate.swift` transmet le token APNs au plugin

Il reste la **configuration des consoles** (Firebase, Apple, Supabase), à faire une fois.

---

## 1. Firebase (transport commun Android + iOS)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Créer un projet** « CampConnect » (ou réutiliser un existant).
2. **Ajouter une app Android** :
   - Nom du package : `com.campconnect.app`
   - Télécharger **`google-services.json`** → le placer dans **`android/app/google-services.json`**
   - (le `build.gradle` applique déjà le plugin Google Services automatiquement si le fichier est présent)
3. **Ajouter une app iOS** :
   - Bundle ID : `com.campconnect.app`
   - Télécharger **`GoogleService-Info.plist`** → l'ajouter dans **Xcode** au dossier `App/App` (glisser-déposer, cocher « Copy items if needed »)
4. **Activer l'API** : Firebase → ⚙️ Paramètres du projet → **Cloud Messaging** → vérifier que « Firebase Cloud Messaging API (V1) » est **activée**.

> `google-services.json` et `GoogleService-Info.plist` sont dans `.gitignore` — ne pas les committer.

---

## 2. iOS — APNs (obligatoire pour les push iOS)

1. [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles → **Keys** → créer une **APNs Auth Key** (`.p8`). Noter le **Key ID** et ton **Team ID**.
2. Firebase → Paramètres → Cloud Messaging → section **Apple app configuration** → **APNs Authentication Key** → uploader le `.p8` + Key ID + Team ID.
3. Dans **Xcode** (`ios/App/App.xcworkspace`) → cible **App** → onglet **Signing & Capabilities** :
   - **+ Capability → Push Notifications**
   - **+ Capability → Background Modes** → cocher **Remote notifications**

---

## 3. Supabase — base + Edge Function

### 3a. Table des tokens
Dans **SQL Editor**, exécuter `scripts/sql/push_tokens.sql`.

### 3b. Compte de service Firebase (pour l'envoi)
Firebase → ⚙️ Paramètres → **Comptes de service** → **Générer une nouvelle clé privée** → fichier JSON (ex. `fcm-service-account.json`).

### 3c. Déployer la fonction + secrets
Depuis la racine du projet (Supabase CLI installé, `supabase login` fait) :

```bash
# lier le projet (une fois)
supabase link --project-ref hsebtpliwimyidudajmi

# secrets
supabase secrets set FCM_SERVICE_ACCOUNT="$(cat fcm-service-account.json)"
supabase secrets set PUSH_WEBHOOK_SECRET="un-secret-long-au-hasard"

# déployer
supabase functions deploy send-push --no-verify-jwt
```

L'URL de la fonction sera :
`https://hsebtpliwimyidudajmi.supabase.co/functions/v1/send-push`

### 3d. Database Webhooks (déclencheurs)
Supabase Dashboard → **Database → Webhooks** → **Create a new hook**, en créer **deux** :

| Table | Événement | Type | URL | Header |
|-------|-----------|------|-----|--------|
| `messages`   | Insert | HTTP Request (POST) | URL de la fonction | `x-webhook-secret: <PUSH_WEBHOOK_SECRET>` |
| `animations` | Insert | HTTP Request (POST) | URL de la fonction | `x-webhook-secret: <PUSH_WEBHOOK_SECRET>` |

(Le corps par défaut du webhook `{ type, table, record, old_record }` est exactement ce qu'attend la fonction.)

---

## 4. Build & test

```powershell
npm install
npm run build:mobile
npx cap open android   # ou cap open ios
```

Puis :
1. Lancer l'app sur un **appareil réel** (les push ne marchent pas toujours sur émulateur ; iOS jamais sur simulateur).
2. Accepter la demande de notifications.
3. Vérifier qu'une ligne apparaît dans `push_tokens` (SQL Editor).
4. Test **message** : avec 2 appareils dans le même groupe, en envoyer un depuis l'un → l'autre (app en arrière-plan) reçoit la notif.
5. Test **animation** : côté gérant, publier une animation → les vacanciers du camping reçoivent la notif.

---

## Ce qui déclenche une notification

| Événement | Destinataires | Contenu |
|-----------|---------------|---------|
| Nouveau message dans un groupe | Membres **présents** du groupe, sauf l'auteur | « *Titre du groupe* — Pseudo : message » → ouvre le chat |
| Nouvelle animation publiée | Tous les vacanciers **présents** du camping | « Nouvelle animation 🎉 — *titre* » → ouvre l'agenda |

Les tokens morts (appareil désinstallé) sont **purgés automatiquement** par la fonction.

---

## Dépannage

- **Aucune notif Android** : `google-services.json` bien dans `android/app/` ? Permission notifications accordée ? Appareil réel ?
- **Aucune notif iOS** : capability Push + Background Modes activées ? APNs key uploadée dans Firebase ? Testé sur iPhone réel (pas simulateur) ?
- **Fonction en erreur** : `supabase functions logs send-push` — vérifier `FCM_SERVICE_ACCOUNT` (JSON complet, guillemets inclus).
- **Rien dans push_tokens** : la permission a été refusée, ou l'app tourne sur le web (les push sont natifs uniquement).
