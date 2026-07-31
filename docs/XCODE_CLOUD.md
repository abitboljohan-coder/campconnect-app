# Xcode Cloud — builder iOS sans Mac

Objectif : pouvoir publier les mises à jour iOS depuis Windows (ou n'importe où),
sans machine Apple. Xcode Cloud clone le dépôt, construit, signe et envoie vers
TestFlight puis l'App Store.

**Une seule étape exige un Mac : la création du workflow, qui se fait depuis
Xcode.** Tout le reste se pilote ensuite depuis App Store Connect, dans un
navigateur. À faire tant que le Mac est disponible.

---

## 1. Créer le workflow (depuis le Mac, une fois)

1. Ouvrir `ios/App/App.xcodeproj` dans Xcode.
2. Menu **Product → Xcode Cloud → Create Workflow**.
3. Sélectionner la target **App**, puis connecter le dépôt GitHub
   `abitboljohan-coder/campconnect-app` (Xcode ouvre le navigateur pour
   autoriser l'app GitHub d'Apple).
4. Conditions de départ : *Branch Changes* sur la branche de ton choix.
   Éviter de déclencher sur toutes les branches — le quota de 25 h/mois inclus
   dans l'adhésion développeur se consomme vite.
5. Action : **Archive** avec la destination *TestFlight (Internal Testing Only)*
   pour commencer. On passera à *TestFlight and App Store* une fois le premier
   build validé.

## 2. Déclarer les variables d'environnement

Dans le workflow → section **Environment** → **Environment Variables** :

| Nom | Valeur | Secret ? |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://tswpintevokeasteyjno.supabase.co` | non |
| `VITE_SUPABASE_ANON_KEY` | la clé `anon public` du projet Supabase | non |

La clé anon est publique par conception — elle est déjà embarquée dans le bundle
JS servi à chaque visiteur. Inutile de la marquer comme secrète. En revanche la
clé `service_role` n'a **rien** à faire ici.

Sans ces deux variables, `ci_scripts/ci_post_clone.sh` s'arrête avec un message
explicite plutôt que de produire une app affichant « Configuration manquante ».

## 3. Le script de build

`ci_scripts/ci_post_clone.sh` (à la racine du dépôt) est exécuté automatiquement
par Xcode Cloud après le clone. Il installe Node via Homebrew, écrit le `.env`,
lance `npm ci`, `vite build` puis `cap sync ios`.

**Pourquoi il est indispensable** : `dist/` et `ios/App/App/public/` sont
gitignorés. Xcode Cloud ne récupère donc aucun bundle web et `xcodebuild`
produirait une app qui s'ouvre sur un écran blanc — un build « réussi » et
inutilisable. Le script se termine par une vérification de la présence de
`ios/App/App/public/index.html` pour transformer cette panne silencieuse en
échec visible.

> Si les logs Xcode Cloud ne montrent aucune trace du script, c'est qu'il n'a
> pas été trouvé : déplacer le dossier `ci_scripts/` à côté du projet Xcode,
> dans `ios/App/`. Apple accepte les deux emplacements selon la configuration
> du workflow.

## 4. Ensuite, depuis Windows

- Pousser sur la branche surveillée déclenche le build.
- Suivi, logs, relance manuelle : App Store Connect → **Xcode Cloud**.
- Distribution TestFlight et soumission à la revue : App Store Connect, toujours
  dans le navigateur.
- La signature est gérée par Xcode Cloud : aucun certificat ni profil à
  installer localement. C'est précisément ce qui rend la chose praticable sans
  Mac.

Depuis un iPhone, l'app **App Store Connect** permet de suivre les builds, les
retours TestFlight et l'état de la revue — mais pas de construire.

## 5. Ce qui reste à faire côté Android

Rien de commun : Android se construit très bien sous Windows avec Android
Studio. Voir `docs/PUBLICATION_ANDROID.md`.

---

## Notes

- Le numéro de build (`CURRENT_PROJECT_VERSION`) doit être incrémenté à chaque
  envoi vers TestFlight, sinon App Store Connect refuse le binaire. Xcode Cloud
  expose `$CI_BUILD_NUMBER` : on pourra automatiser via un script
  `ci_post_xcodebuild.sh` si l'incrément manuel devient pénible.
- Les push restent désactivées tant que `GoogleService-Info.plist` est absent du
  clone (il est gitignoré). C'est volontaire : la voie APNs iOS n'est pas encore
  implémentée côté Edge Function — voir `docs/PUSH_NOTIFICATIONS.md`.
