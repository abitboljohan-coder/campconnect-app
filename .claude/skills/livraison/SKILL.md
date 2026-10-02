---
name: livraison
description: Prépare une nouvelle version de CampConnect pour l'App Store et Google Play — numéro de version, notes de version, fusion dans main, puis la liste exacte des clics que Johan doit faire. À invoquer quand l'utilisateur veut « mettre la nouvelle version sur les stores », « publier une mise à jour » ou « livrer ».
---

# Livraison d'une version — CampConnect

Johan n'est pas développeur et travaille sous Windows, sans Mac. Ton travail :
tout faire jusqu'à `main`, puis lui donner les deux seules étapes qui
demandent ses accès, sans jargon.

## 1. Vérifier avant de toucher à quoi que ce soit

- `git fetch origin main` et partir de `main` à jour.
- `npx vitest run` doit passer. Le lint a des erreurs anciennes connues :
  compare avec `main`, n'en ajoute aucune.
- La démo est saine (voir CLAUDE.md, « Camping de démo ») : dernier passage
  du cron `rafraichir-demo` réussi, 7 groupes visibles.
- Lis `git log` depuis la dernière version pour savoir ce qui a changé.

## 2. Numéro de version

Version actuelle : `MARKETING_VERSION` dans
`ios/App/App.xcodeproj/project.pbxproj` (deux occurrences) et `versionName`
dans `android/app/build.gradle`. Les deux portent toujours le même numéro.

- Correction ou petite amélioration : 1.0.2 → 1.0.3.
- Nouvelle fonctionnalité visible : 1.0.3 → 1.1.0.

Ne touche **jamais** au numéro de build (`CURRENT_PROJECT_VERSION`,
`versionCode`) : il est automatique des deux côtés.

Mets à jour la mention de version dans `docs/XCODE_CLOUD.md` et le tableau
« Avant d'envoyer » de `docs/NOTES_VERSION.md`.

## 3. Notes de version

Ajoute une section en haut de `docs/NOTES_VERSION.md`, en français et en
anglais : ce que l'utilisateur gagne, pas ce que le code fait. Prépare aussi
une **version courte de moins de 500 caractères** (limite de Google Play) :
5 à 7 puces.

## 4. Livrer

Commit, pull request, fusion dans `main` (squash). Xcode Cloud (workflow
« Default ») compile `main` et l'envoie sur TestFlight.

## 5. Ce que tu donnes à Johan

Un message court, en français, avec exactement :

**iPhone**
1. Attendre l'email Xcode Cloud « Branch : main · Workflow : Default » ✅, puis
   10 à 30 min.
2. Installer via TestFlight, vérifier en bas du Profil `main · <commit>`.
3. appstoreconnect.apple.com → CampConnect → Distribution → ➕ à côté de
   « App iOS » → numéro de version → coller les nouveautés → Build : choisir
   celui de main → Enregistrer → Ajouter pour vérification → Soumettre.

**Android** (PowerShell, une ligne à la fois)
```powershell
cd C:\Users\abitb\campconnect-app
git checkout main
git pull
Test-Path android\app\google-services.json   # doit afficher True, sinon STOP
npm run build
npx cap sync android
cd android
.\gradlew bundleRelease
```
Puis Play Console → Production → Créer une release → glisser
`android\app\build\outputs\bundle\release\app-release.aab` → coller les
nouveautés (version courte) → Enregistrer et publier.

Termine par le texte court des nouveautés, prêt à copier.

## Pièges connus

- PowerShell s'ouvre dans `C:\WINDOWS\System32` : toujours commencer par le `cd`.
- `google-services.json` absent : le build réussit mais les notifications
  Android sont muettes. Ne jamais publier dans ce cas.
- Un build de branche `claude/…` dans TestFlight n'est pas la version à
  soumettre, même avec un numéro plus grand.
- Si la connexion Apple propose une « clé de sécurité » USB : Annuler, puis
  « Continuer avec le mot de passe ».
- Si le build n'apparaît pas dans « Ajouter un build » : workflow réglé sur
  « TestFlight seulement », voir `docs/XCODE_CLOUD.md` §6.
