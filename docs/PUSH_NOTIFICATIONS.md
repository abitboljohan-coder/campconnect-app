# Notifications push — mise en place (Android + iOS)

Architecture — **deux transports, et ce n'est pas un choix esthétique** :

```
Android ──(jeton FCM)───▶ push_tokens ──▶ send-push ──▶ FCM  ──▶ appareils
iOS     ──(jeton APNs)──▶ push_tokens ──▶ send-push ──▶ APNs ──▶ appareils
```

`@capacitor/push-notifications` ne passe pas par Firebase sur iOS : son code
natif renvoie le `deviceToken` brut d'APNs en hexadécimal, sans jamais toucher
au SDK Firebase (`PushNotificationsPlugin.swift`, aucune référence à Firebase).
Or FCM n'accepte que ses propres jetons d'enregistrement. Router iOS vers FCM
faisait rejeter chaque envoi — **les push Android auraient marché, les push iOS
jamais, et sans la moindre erreur visible dans l'application.**

L'Edge Function aiguille donc sur `push_tokens.platform`, que le client
renseigne déjà.

**Conséquence pratique : iOS n'a besoin ni de Firebase, ni de
`GoogleService-Info.plist`.** La clé `.p8` va dans les secrets Supabase, pas
dans Firebase.

Le code est déjà en place :
- `src/push.js` — enregistrement de l'appareil + gestion des taps
- `App.jsx` — appelle `registerPush()` dès qu'un vacancier est identifié
- `scripts/sql/push_tokens.sql` — table des tokens (cloisonnée, RLS)
- `supabase/functions/send-push/` — envoi FCM v1 (messages + animations)
- Android : permission `POST_NOTIFICATIONS` ajoutée
- iOS : `AppDelegate.swift` transmet le token APNs au plugin

Il reste la **configuration des consoles** (Firebase, Apple, Supabase), à faire une fois.

---

## ⚠️ Activation automatique (sécurité anti-crash)

Les push **Android** sont désactivées tant que `google-services.json` est absent.

Raison : sur Android, appeler `PushNotifications.register()` sans ce fichier
provoque un crash natif — « Default FirebaseApp is not initialized in this
process ». C'est une exception fatale côté Java, qu'aucun `try/catch`
JavaScript ne rattrape.

Le build détecte sa présence — voir `FIREBASE_ANDROID_PRET` dans
`vite.config.js` — et `src/push.js` ne bloque **que la plateforme Android**.
iOS n'est pas concerné : il ne touche jamais à Firebase.

**Concrètement** : dépose `google-services.json` (étape 1), relance
`npm run build:mobile`, et les push Android s'activent seules.


---

## 1. Firebase (transport commun Android + iOS)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Créer un projet** « CampConnect » (ou réutiliser un existant).
2. **Ajouter une app Android** :
   - Nom du package : `com.campconnect.app`
   - Télécharger **`google-services.json`** → le placer dans **`android/app/google-services.json`**
   - (le `build.gradle` applique déjà le plugin Google Services automatiquement si le fichier est présent)
3. **Ajouter une app iOS** : *inutile.* iOS ne passe pas par Firebase.
4. **Activer l'API** : Firebase → ⚙️ Paramètres du projet → **Cloud Messaging** → vérifier que « Firebase Cloud Messaging API (V1) » est **activée**.

> `google-services.json` et `GoogleService-Info.plist` sont dans `.gitignore` — ne pas les committer.

---

## 2. iOS — APNs (obligatoire pour les push iOS)

1. [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles → **Keys** → créer une **APNs Auth Key** (`.p8`). Noter le **Key ID** et ton **Team ID**.
2. La clé ne va **pas** dans Firebase : elle ira dans les secrets Supabase
   (étape 3c), puisque l'envoi iOS part directement vers APNs.

   ⚠️ À la création, régler **Environment** sur **Sandbox & Production** — le
   choix est irréversible, et « Sandbox » seul ne notifie jamais les
   installations venues de TestFlight ou de l'App Store.
3. **Côté projet, c'est déjà fait** et versionné :
   - `ios/App/App/App.entitlements` porte `aps-environment`
   - `CODE_SIGN_ENTITLEMENTS` est renseigné dans les deux configurations
   - `Info.plist` déclare `UIBackgroundModes → remote-notification`

   `aps-environment` reste à `development` : Xcode le promeut en `production`
   à l'archivage pour distribution. Ne pas l'écrire à la main en `production`.

4. **Activer le service sur l'App ID** — et ça, aucun Mac n'est nécessaire :
   [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers
   & Profiles → Identifiers → `com.campconnect.ios` → cocher **Push
   Notifications**. Laisser *Broadcast Capability* décoché : c'est réservé aux
   Live Activities diffusées, sans rapport ici.

   Sans cette case, la signature automatique ne peut pas produire de profil
   portant l'entitlement, et le build échoue.

   « Certificates (0) » sur cette page est **normal** : l'authentification se
   fait par jeton `.p8`, qui se gère dans la section **Keys**. Les certificats
   sont l'ancienne méthode, qui expire chaque année.

> Sans la clé `aps-environment`, iOS n'émet **jamais** de jeton :
> `registerForRemoteNotifications()` échoue en silence et `push_tokens` ne reçoit
> aucune ligne iOS. C'est exactement la panne qu'a connue ce projet — invisible
> depuis l'app comme depuis les logs serveur.

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
supabase link --project-ref tswpintevokeasteyjno

# secrets
supabase secrets set FCM_SERVICE_ACCOUNT="$(cat fcm-service-account.json)"
supabase secrets set PUSH_WEBHOOK_SECRET="un-secret-long-au-hasard"

# iOS — la clé .p8 Apple, son identifiant, et l'identifiant d'équipe
supabase secrets set APNS_KEY_P8="$(cat AuthKey_XXXXXXXXXX.p8)"
supabase secrets set APNS_KEY_ID="XXXXXXXXXX"
supabase secrets set APNS_TEAM_ID="CR82S4H52A"

# iOS — le bundle, qui n'est PAS le package Android
supabase secrets set APNS_BUNDLE_ID="com.campconnect.ios"

# déployer
supabase functions deploy send-push --no-verify-jwt
```

L'URL de la fonction sera :
`https://tswpintevokeasteyjno.supabase.co/functions/v1/send-push`

> ⚠️ `--no-verify-jwt` rend la fonction joignable sans jeton : **`PUSH_WEBHOOK_SECRET`
> est sa seule protection**, et n'est donc pas optionnel. La clé anonyme de
> Supabase est publique — elle voyage dans le bundle de l'app — elle ne
> protégerait rien. Sans ce secret, quiconque lit le bundle peut appeler la
> fonction avec `{ table: 'animations', record: { publiee: true, camping_id } }`
> et faire sonner tous les téléphones d'un camping. La fonction refuse
> désormais de servir tant qu'il n'est pas posé.

> ⚠️ **`APNS_BUNDLE_ID` n'est pas décoratif.** L'en-tête `apns-topic` doit
> correspondre **exactement** au bundle de l'app iOS, et les deux plateformes ne
> portent pas le même identifiant ici : `com.campconnect.app` côté Android,
> `com.campconnect.ios` côté iOS (`PRODUCT_BUNDLE_IDENTIFIER` dans le projet
> Xcode). Une erreur ici fait rejeter chaque notification par un `400 BadTopic`,
> alors même que tout le reste de la chaîne est correct.

### 3d. Déclencheurs (migration `declencheurs_notifications_push`)

**Pas de Database Webhooks du tableau de bord** : les déclencheurs sont posés
directement en SQL, avec `pg_net`. Le schéma `supabase_functions` n'a jamais été
activé sur ce projet, et cette voie donne un contrôle qu'on n'aurait pas
autrement — notamment la condition sur `OLD` pour les animations.

`public.notifier_push()` lit le secret partagé dans **Vault** (`push_webhook_secret`),
et non en dur : la migration peut ainsi vivre dans le dépôt sans rien exposer.
La valeur doit être **identique** à celle du secret `PUSH_WEBHOOK_SECRET` de
l'Edge Function, sinon la fonction répond `401` et rien ne part.

| Déclencheur | Table | Quand |
|---|---|---|
| `push_sur_message` | `messages` | `AFTER INSERT` |
| `push_sur_animation` | `animations` | `AFTER INSERT WHEN (new.publiee)` |
| `push_sur_animation_publiee` | `animations` | `AFTER UPDATE`, brouillon → publiée |

Le troisième n'est pas un doublon. Une animation peut être enregistrée en
brouillon puis publiée depuis la console, ce qui est un `UPDATE` : sans lui,
ces animations-là ne notifieraient jamais personne. La condition sur `OLD` évite
de re-sonner à chaque modification d'une animation déjà publiée, ou lors d'un
cycle dépublier/republier.

La fonction avale ses erreurs et renvoie toujours `NEW` : **une notification
ratée ne doit jamais empêcher l'écriture.** Sans ce garde-fou, une panne de
`pg_net` ferait échouer l'`INSERT` lui-même, et un vacancier verrait son message
refusé parce que la notification n'est pas partie.

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

Ces pannes ont toutes été vécues sur ce projet. Le point commun : **aucune ne
produit d'erreur visible.** L'app se lance, le build réussit, la fonction répond
`200`, et rien n'arrive.

**Rien dans `push_tokens`**
- Android : `google-services.json` absent de `android/app/`. Le build logue
  discrètement « Push Notifications won't work » et `push.js` sort avant
  `register()`. Ce fichier étant gitignoré, il **ne voyage pas avec le dépôt** —
  une machine de build neuve reproduit la panne.
- iOS : entitlement `aps-environment` absent, ou service Push non activé sur
  l'App ID.
- Les deux : permission refusée par l'utilisateur, ou app lancée sur le web.

**Un jeton existe, la fonction répond `200`, rien n'arrive**

`{"ok":true}` ne signifie pas « livré » : la fonction acquitte même quand l'envoi
échoue, en journalisant l'erreur. Lire les logs de la fonction, pas sa réponse.

- Ligne `APNs 400` → mauvais `apns-topic`, voir `APNS_BUNDLE_ID` ci-dessus.
- Ligne `APNs 403` → clé `.p8`, `APNS_KEY_ID` ou `APNS_TEAM_ID` incohérents.
- Ligne `FCM 403` → compte de service d'un autre projet Firebase que le
  `google-services.json`.
- **Aucune ligne, mais le jeton a disparu de la table** → FCM a répondu `404
  UNREGISTERED` et la fonction a purgé l'appareil sans rien journaliser. C'est
  le comportement normal après une réinstallation de l'app : le jeton précédent
  est invalidé, un nouveau s'enregistre au prochain lancement.

**La notification arrive mais ne s'affiche pas (Android, app ouverte)**

Android ne dessine pas la notification quand l'app est au premier plan : il la
remet au greffon. Logcat le dit — `No listeners found for event
pushNotificationReceived`. C'est `@capacitor/local-notifications` qui la
redessine, via l'écouteur de `push.js`. Si ce comportement disparaît, vérifier
que cet écouteur est bien enregistré dans le bundle compilé :

```bash
grep -l pushNotificationReceived dist/assets/*.js
```

**Le correctif ne semble pas pris en compte**

Comparer l'empreinte du bundle chargé par l'app (visible dans Logcat,
`Handling local request: .../assets/index-XXXX.js`) avec celle produite par
`npm run build`. Deux empreintes différentes = l'app tourne sur un autre code,
généralement une branche qui n'a pas été fusionnée.

**Émulateur Android**

Les push fonctionnent, à condition que l'image système embarque **Google Play**
(ou au minimum « Google APIs »). Une image AOSP nue n'a pas Google Play Services
et n'enregistre jamais de jeton. Le simulateur iOS, lui, ne reçoit **jamais** de
push APNs réelle : un iPhone physique est obligatoire.
