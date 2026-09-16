# Publier CampConnect sur Google Play — pas-à-pas

Tout se fait sur **ta machine Windows** (PowerShell), dans le dossier du projet.

## 0. Prérequis : Java 21 (à faire une fois)

Capacitor 8 compile en **Java 21**. Si `java -version` affiche 17 ou moins, le build
échoue avec `error: invalid source release: 21`.

Android Studio embarque déjà un JDK 21 — il suffit de le désigner :

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```
→ puis **fermer et rouvrir PowerShell**. Vérifier :
```powershell
& "$env:JAVA_HOME\bin\java.exe" -version   # doit afficher 21.x
```

Dans Android Studio (pour le bouton ▶️ Run) :
**Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK → jbr-21**.

> ⚠️ En PowerShell, les commandes Gradle s'écrivent `.\gradlew` (avec le `.\`),
> pas `gradlew`.

## 1. Créer ta clé de signature (une seule fois, à vie)

⚠️ **Cette clé signe ton app pour toujours.** Si tu la perds, tu ne pourras plus jamais mettre à jour l'app sur le Play Store. Sauvegarde le fichier `.jks` ET le mot de passe à deux endroits (cloud + clé USB).

```powershell
cd C:\Users\abitb\campconnect-app
keytool -genkey -v -keystore campconnect-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias campconnect
```

Réponds aux questions (nom, organisation…), choisis un **mot de passe solide** et note-le.
`keytool` est fourni avec Android Studio ; si la commande est introuvable, utilise :
`& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" ...`

> Ne mets JAMAIS ce fichier dans git. Il est déjà couvert par `.gitignore` (`*.jks`).

## 2. Déclarer la clé dans le projet

Crée le fichier `android/keystore.properties` (jamais commité) :

```properties
storeFile=../../campconnect-release.jks
storePassword=TON_MOT_DE_PASSE
keyAlias=campconnect
keyPassword=TON_MOT_DE_PASSE
```

`storePassword` et `keyPassword` reçoivent la même valeur : celle saisie à la
création du keystore. Elles ne diffèrent que si un mot de passe distinct a été
donné à la clé, ce que la touche Entrée à la dernière question de `keytool`
évite justement.

> ⚠️ **Ne pas créer ce fichier avec `Set-Content -Encoding UTF8`** sous Windows
> PowerShell : cette option écrit un marqueur d'ordre des octets, que Java
> rattache au nom de la première propriété. `storeFile` devient alors
> introuvable et le build échoue sur `Cannot convert 'null' to File`, un
> message qui ne désigne pas la cause. `android/app/build.gradle` retire
> désormais ce marqueur, mais autant écrire le fichier proprement :
>
> ```powershell
> $mdp = "TON_MOT_DE_PASSE"
> [IO.File]::WriteAllText("$PWD\android\keystore.properties",
>   "storeFile=../../campconnect-release.jks`nstorePassword=$mdp`nkeyAlias=campconnect`nkeyPassword=$mdp",
>   (New-Object Text.UTF8Encoding $false))
> ```

Le `android/app/build.gradle` du projet lit ce fichier automatiquement (config `release` ci-dessous, déjà en place) :

```gradle
// En haut du fichier
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

## 3. Builder l'AAB signé

**Depuis la racine du projet**, pas depuis `android/` — `cap sync` et le
fichier `.env` s'y attendent :

```powershell
cd C:\Users\abitb\campconnect-app
npm run build
npx cap sync android
cd android
.\gradlew bundleRelease
```

Le fichier à uploader est :
`android\app\build\outputs\bundle\release\app-release.aab`

## 4. Créer la fiche Play Store

1. [play.google.com/console](https://play.google.com/console) → compte
   développeur (25 $ une fois).
2. **Créer une application** → « CampConnect », français, **gratuite**
   (irréversible).
3. Éléments visuels, tous déjà produits :

| Élément | Fichier |
|---|---|
| Icône 512×512 | `assets/store/icon-512.png` |
| Bannière 1024×500 | `assets/store/feature-graphic-1024x500.png` |
| Captures téléphone | `assets/store/screenshots/01→06` |

4. Textes, questionnaires de classification, sécurité des données, instructions
   d'accès pour le testeur : tout est prêt dans `docs/FICHE_PLAY_STORE.md`.

## 5. Le test fermé, avant la production

**Le compte est passé en Organisation**, ce qui change tout ici.

La règle des **12 testeurs pendant 14 jours** ne vise que les comptes
**personnels** créés après novembre 2023. Un compte organisation, validé par un
numéro D-U-N-S, en est exempté : les seuils affichés par Play Console sont
tombés à **0 testeur** et **0 jour**.

Il reste néanmoins une condition, et une seule :

> **Publier au moins une version sur le canal de test fermé.**

Tant qu'aucune release n'y a été publiée, le bouton « Demander à publier en
production » reste grisé. Une fois la release en ligne, les trois puces se
cochent d'elles-mêmes et l'accès à la production s'ouvre immédiatement.

### La marche à suivre

1. **Tests → Tests fermés** → ton canal → **Créer une release**
2. Téléverser `app-release.aab` (étape 3)
3. Publier — inutile d'inscrire le moindre testeur
4. **Demander à publier en production** : quelques questions sur le test, puis
   l'accès est accordé
5. **Production → Créer une release** → le même AAB

> Historique, pour mémoire : avant la bascule en organisation, ce projet était
> soumis aux 12 testeurs et aux 14 jours. La conversion du compte a supprimé
> cette contrainte d'un coup, et c'est de loin le chemin le plus court — la
> validation d'identité prend quelques jours là où le recrutement de douze
> personnes en prend plusieurs semaines.

## 6. Notifications push

Elles fonctionnent, et sont vérifiées de bout en bout sur les deux plateformes.
Voir `docs/PUSH_NOTIFICATIONS.md` pour l'architecture et le dépannage.

⚠️ **Le seul piège de publication** : `android/app/build.gradle` n'applique le
plugin Google Services que si `google-services.json` est présent. Ce fichier
est **gitignoré** — il ne voyage donc pas avec le dépôt.

Conséquence : un build lancé depuis une machine neuve, un clone frais ou un
runner d'intégration continue produit une application **aux notifications
muettes**, sans que rien n'échoue. Le build réussit, l'app s'installe, et Logcat
se contente d'une ligne discrète :

```
google-services.json not found, google-services plugin not applied.
Push Notifications won't work
```

**Avant chaque `bundleRelease`, vérifier que le fichier est là :**

```powershell
Test-Path android\app\google-services.json   # doit renvoyer True
```

Et le sauvegarder ailleurs que sur cette seule machine, au même titre que le
keystore.

## 7. Mises à jour suivantes

Refaire l'étape 3, et c'est tout : le `versionCode` se calcule seul.

`android/app/build.gradle` le dérive du nombre de minutes écoulées depuis 1970.
Il croît de lui-même, ne redescend jamais, et vaut une trentaine de millions —
loin du plafond de Play (2 100 000 000), qui ne serait atteint qu'au quarantième
siècle. Le build l'affiche au passage :

```
──▶ versionCode = 29775834
```

C'est le seul chiffre à retenir si Play Console conteste un envoi.

`versionName`, lui, reste à la main : c'est la version que voient les
utilisateurs, elle ne change qu'à une vraie livraison.

> Le passage à ce calcul est sans retour : après un envoi à 29 775 834, Play
> n'acceptera plus jamais un numéro inférieur. C'est voulu — c'est ce qui rend
> l'oubli impossible.

> Pour rejouer un build à l'identique, ou reprendre une numérotation existante :
> `CC_VERSION_CODE=42 .\gradlew bundleRelease`.

## Rappels

- L'app charge Supabase via `.env` au build : vérifier que `.env` est présent
  **avant** `npm run build`, sinon l'app s'ouvre sur « Configuration manquante ».
- Ne jamais commiter `campconnect-release.jks` ni `android/keystore.properties` :
  les deux sont couverts par `.gitignore`, vérifié.
