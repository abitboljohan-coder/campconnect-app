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

## 5. Le test fermé, obligatoire avant la production

Un compte développeur **personnel** créé après novembre 2023 ne peut pas
publier directement en production. Il faut d'abord :

1. **Tests fermés** → créer une release → uploader l'AAB ;
2. réunir **au moins 12 testeurs** et les maintenir inscrits **14 jours
   consécutifs** ;
3. seulement ensuite, demander l'accès à la production.

C'est le seul délai qu'aucune diligence ne raccourcit : **commencer par là**,
avant même de peaufiner la fiche. Les testeurs se recrutent par adresses Gmail
ou via un groupe Google — proches, collègues, futurs campings pilotes.

> Les « Tests internes » sont plus rapides à mettre en place mais **ne comptent
> pas** pour ces 14 jours. Utiles pour vérifier que l'AAB s'installe, pas pour
> avancer vers la production.

## 6. Notifications push — ce qui ne marchera pas en 1.0

`android/app/build.gradle` n'applique le plugin Google Services que si
`google-services.json` est présent (lignes 70-75). Le fichier étant gitignoré et
absent, le build réussit mais **les notifications push ne fonctionnent pas**.

Ce n'est pas un blocage pour publier : ni la description ni les captures ne les
annoncent. Pour les activer plus tard, il suffit de créer le projet Firebase,
déposer `google-services.json` dans `android/app/`, et refaire un build — sans
rien changer au code.

## 7. Mises à jour suivantes

À chaque envoi : incrémenter `versionCode` (+1) et `versionName` dans
`android/app/build.gradle`, puis refaire l'étape 3. Play Console refuse un AAB
dont le `versionCode` a déjà été utilisé.

## Rappels

- L'app charge Supabase via `.env` au build : vérifier que `.env` est présent
  **avant** `npm run build`, sinon l'app s'ouvre sur « Configuration manquante ».
- Ne jamais commiter `campconnect-release.jks` ni `android/keystore.properties` :
  les deux sont couverts par `.gitignore`, vérifié.
