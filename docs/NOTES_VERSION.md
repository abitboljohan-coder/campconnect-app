# Notes de version

À coller dans **App Store Connect → la version → Nouveautés de cette version**
(et dans Play Console → *Notes de version*, une fois Android publié).

Le champ est limité à 4 000 caractères et est visible par tous : il décrit ce
que l'utilisateur gagne, pas ce que le code fait.

---

## 1.0.2

### Français

```
Cette mise à jour rend CampConnect plus agréable au quotidien, pour les
vacanciers comme pour les gérants.

• Des centaines d'emojis pour vos groupes, vos statuts et votre avatar.
• Créer un groupe est plus fluide, même clavier ouvert.
• Les groupes et animations terminés disparaissent d'eux-mêmes.
• Discussions plus fiables : plus de messages en double, et les messages
  reçus pendant votre absence s'affichent dès votre retour.
• Petites annonces : signaler ou bloquer un auteur en un geste.
• Gérants : les signalements arrivent en direct, signalés par une pastille,
  et la modération couvre désormais les annonces et les groupes.
• Compatibilité avec les dernières versions d'iOS, et corrections
  d'affichage sur les petits écrans.
```

### English

```
This update makes CampConnect nicer to use every day, for holidaymakers and
campsite managers alike.

• Hundreds of emojis for your groups, status and avatar.
• Creating a group is smoother, even with the keyboard open.
• Finished groups and events now disappear on their own.
• More reliable chats: no more duplicate messages, and messages received
  while you were away show up as soon as you come back.
• Classifieds: report or block an author in one tap.
• Managers: issue reports arrive live with a badge, and moderation now
  covers classifieds and groups.
• Support for the latest iOS versions, and display fixes on small screens.
```

---

## 1.0.1

### Français

```
Cette mise à jour affine la prise en main, côté vacanciers comme côté gérants.

• Espace gérant plus lisible : la navigation passe de neuf onglets à quatre
  gestes du quotidien — accueil, animations, signalements, modération — la
  configuration se regroupant derrière « Réglages ». Les libellés sont
  désormais toujours visibles.
• L'espace gérant est accessible depuis l'onglet Profil, et non plus seulement
  depuis le premier écran de l'application.
• Écran d'accueil du gérant remanié : le guide de démarrage ne montre plus que
  les étapes qu'il reste à faire, et les chiffres du jour remontent à vue.
• Un camping dont la réception n'a pas fini l'installation l'annonce clairement
  au lieu de demander un code que personne ne peut donner.
• Corrections d'affichage et d'accessibilité.
```

### English

```
This update refines the experience for holidaymakers and campsite managers
alike.

• A clearer manager console: navigation goes from nine tabs to the four
  everyday actions - home, events, issue reports, moderation - with setup
  grouped under "Settings". Labels are now always visible.
• The manager console can be reached from the Profile tab, not only from the
  app's first screen.
• Reworked manager home screen: the setup guide now shows only the steps left
  to do, bringing the day's figures into view.
• A campsite whose reception has not finished setting up now says so, instead
  of asking for a code nobody can provide.
• Display and accessibility fixes.
```

---

## Avant d'envoyer

| À vérifier | Où |
|---|---|
| `MARKETING_VERSION = 1.0.2` | `ios/App/App.xcodeproj/project.pbxproj` |
| `versionName "1.0.2"` | `android/app/build.gradle` |
| Numéro de build | s'aligne seul sur `$CI_BUILD_NUMBER` (Xcode Cloud) |
| `versionCode` Android | automatique, minutes depuis 1970 |

**Testez sur un vrai appareil avant l'envoi.** La refonte de la console gérant
n'a été vérifiée qu'en navigateur, avec un Supabase simulé : la barre du bas,
la feuille « Réglages » et l'entrée « Espace gérant » du Profil ne dépendent
pas des mêmes marges de sécurité sur iOS que dans Chromium.
