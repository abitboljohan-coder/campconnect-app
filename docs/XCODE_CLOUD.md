# Xcode Cloud — builder iOS sans Mac

Objectif : pouvoir publier les mises à jour iOS depuis Windows (ou n'importe où),
sans machine Apple. Xcode Cloud clone le dépôt, construit, signe et envoie vers
TestFlight puis l'App Store.

**Une seule étape exige un Mac : la création initiale du workflow, qui se fait
depuis Xcode.** Tout le reste — modification du workflow, variables
d'environnement, destination de distribution, relance de build, soumission à la
revue — se pilote depuis App Store Connect, dans un navigateur.

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
5. Action : **Archive**, une seule. Destination *TestFlight (Internal Testing
   Only)* pour valider la chaîne sans engager la distribution — voir §5 pour
   basculer ensuite, ce qui se fait depuis le navigateur.

N'ajouter **ni action Ad Hoc ni action Development** : leur export exige au
moins un iPhone enregistré sur le compte développeur et échoue sinon en
`exit 70`, faisant passer tout le build en rouge alors que l'archive est
correcte.

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

`ios/App/ci_scripts/ci_post_clone.sh` est exécuté automatiquement par Xcode
Cloud après le clone. Il installe Node via Homebrew, écrit le `.env`, lance
`npm ci`, `vite build` puis `cap sync ios`.

**Emplacement impératif** : Apple exige que le dossier `ci_scripts/` soit placé
**au même niveau que le fichier `.xcodeproj` utilisé par le workflow** — donc
`ios/App/ci_scripts/`, puisque le projet est `ios/App/App.xcodeproj`. Un
`ci_scripts/` à la racine du dépôt (à côté de `package.json`) est silencieusement
ignoré : Xcode Cloud saute directement à `Resolve Package Dependencies`, qui
échoue en quelques secondes puisque `node_modules/` n'a jamais été créé — c'est
exactement l'échec rencontré au premier build (Build 4, `xcodebuild: error:
Could not resolve package dependencies`, package introuvable dans
`node_modules/@capacitor/...`).

**Pourquoi le script est indispensable par ailleurs** : `dist/` et
`ios/App/App/public/` sont gitignorés. Xcode Cloud ne récupère donc aucun
bundle web et `xcodebuild` produirait une app qui s'ouvre sur un écran blanc —
un build « réussi » et inutilisable. Le script se termine par une vérification
de la présence de `ios/App/App/public/index.html` pour transformer cette panne
silencieuse en échec visible.

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

## 5. Passer de « TestFlight seulement » à l'App Store — sans Mac

Un build archivé en *TestFlight (Internal Testing Only)* ne peut pas être
rattaché à une version App Store : il n'apparaît pas comme sélectionnable dans
« Ajouter un build ». Le réglage se change dans le navigateur :

**App Store Connect → l'app → onglet Xcode Cloud → Gérer les workflows → le
workflow → Modifier → action « Archive - iOS » → Deployment Preparation →
*TestFlight and App Store*.**

Le changement ne vaut que pour les builds **suivants** : les builds déjà envoyés
en interne ne se promeuvent pas. Il faut donc relancer un build — « Start Build »
sur la même page — et c'est celui-là qui sera sélectionnable.

## 6. Ce qui reste à faire côté Android

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
