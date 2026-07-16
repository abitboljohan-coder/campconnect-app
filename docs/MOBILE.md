# Mobile (Android / iOS) — Capacitor

Une seule app native embarquant les deux espaces :
- **Vacancier** (défaut) — onboarding recherche camping / QR / deep link `/join/:slug`
- **Gérant** — lien « Je suis gérant de camping » sur l'onboarding (mode persisté via `localStorage.appMode`)

## Commandes

```bash
npm run build:mobile   # vite build + cap sync
npm run cap:android    # ouvre Android Studio
npm run cap:ios        # ouvre Xcode (macOS)
```

## Deep links

- Android : App Links `https://app.campconnect.fr/join/*` (nécessite `/.well-known/assetlinks.json` sur le domaine) + scheme `campconnect://`
- iOS : scheme `campconnect://` (Info.plist). Universal Links : ajouter l'entitlement `applinks:app.campconnect.fr` dans Xcode + `apple-app-site-association` sur le domaine.

Gérés dans `src/native.js` (`appUrlOpen`) — stocke le slug puis relance sur `/`.

## Points natifs

- `src/native.js` : détection plateforme, mode vacancier/gérant, deep links, bouton retour Android
- Safe areas : `env(safe-area-inset-*)` dans `Layout.jsx` / `AdminLayout.jsx`
- Permissions : localisation (vérif présence camping) — AndroidManifest + Info.plist
- IDs : `com.campconnect.app` / nom `CampConnect`
