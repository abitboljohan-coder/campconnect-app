# Notes de version

À coller dans **App Store Connect → la version → Nouveautés de cette version**
(et dans Play Console → *Notes de version*, une fois Android publié).

Le champ est limité à 4 000 caractères et est visible par tous : il décrit ce
que l'utilisateur gagne, pas ce que le code fait.

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
| `MARKETING_VERSION = 1.0.1` | `ios/App/App.xcodeproj/project.pbxproj` |
| `versionName "1.0.1"` | `android/app/build.gradle` |
| Numéro de build | s'aligne seul sur `$CI_BUILD_NUMBER` (Xcode Cloud) |
| `versionCode` Android | automatique, minutes depuis 1970 |

**Testez sur un vrai appareil avant l'envoi.** La refonte de la console gérant
n'a été vérifiée qu'en navigateur, avec un Supabase simulé : la barre du bas,
la feuille « Réglages » et l'entrée « Espace gérant » du Profil ne dépendent
pas des mêmes marges de sécurité sur iOS que dans Chromium.
