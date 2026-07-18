# Publier CampConnect sur Google Play — pas-à-pas

Tout se fait sur **ta machine Windows** (PowerShell), dans le dossier du projet.

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

```powershell
npm run build
npx cap sync android
cd android
.\gradlew bundleRelease
```

Le fichier à uploader est :
`android\app\build\outputs\bundle\release\app-release.aab`

## 4. Créer la fiche Play Store

1. [play.google.com/console](https://play.google.com/console) → compte développeur (25 $ une fois).
2. **Créer une application** → nom « CampConnect », français, gratuite.
3. Renseigner la fiche :
   - **Description courte/longue** (reprendre le site).
   - **Captures d'écran** : celles du dossier `screenshots/` du site (min. 2, format téléphone).
   - **Icône 512×512** : exporter depuis `assets/icon-only.png` (déjà au bon design).
   - **Bannière 1024×500** (feature graphic) — obligatoire.
4. **Questionnaires obligatoires** :
   - Classification du contenu (app sociale, tout public avec chat modéré).
   - Sécurité des données : déclarer pseudo/messages/position approximative, chiffrement en transit ✔, **URL de suppression : `https://www.campconnect.fr/suppression-donnees.html`**.
   - Politique de confidentialité : `https://www.campconnect.fr/confidentialite.html`.
5. **Production → Créer une release** → uploader l'AAB → soumettre en review (quelques heures à quelques jours).

## 5. Mises à jour suivantes

À chaque mise à jour : incrémenter `versionCode` (+1) et `versionName` dans `android/app/build.gradle`, puis refaire l'étape 3 et uploader le nouvel AAB.

## Rappels

- L'app charge Supabase via `.env` au build : vérifier que `.env` est présent **avant** `npm run build`.
- Tester l'AAB en interne d'abord : Play Console → « Tests internes » (diffusion immédiate à tes propres appareils, sans review complète).
