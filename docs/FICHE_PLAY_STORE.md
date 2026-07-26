# Fiche Play Store — textes & réponses à recopier

Tout ce qui suit est prêt à copier-coller dans la Play Console.

---

## 1. Identité de l'app

- **Nom de l'application** (30 car. max) : `CampConnect`
- **Catégorie** : Voyages et infos locales (ou « Réseaux sociaux »)
- **Type** : Application · Gratuite
- **Adresse e-mail développeur** : abitboljohan@gmail.com
- **Site web** : https://www.campconnect.fr

---

## 2. Description courte (80 car. max)

```
La vie de votre camping en direct : rencontres, animations, plan et chat.
```

*(alternative : « Rencontrez d'autres vacanciers, suivez les animations et le plan du camping. »)*

---

## 3. Description longue (4000 car. max)

```
CampConnect, c'est l'appli qui reconnecte les vacanciers de votre camping.

Fini de rester chacun sur son emplacement : rejoignez la vie du camping en un geste, sans créer de compte ni donner votre e-mail.

🏕️ REJOIGNEZ VOTRE CAMPING EN 10 SECONDES
Scannez le QR code de la réception ou entrez le nom de votre camping. Choisissez un pseudo, un avatar, et c'est parti. Aucune adresse e-mail requise.

👥 CRÉEZ ET REJOIGNEZ DES GROUPES SPONTANÉS
Envie d'une partie de pétanque, d'une rando, d'un apéro ou d'un barbecue entre voisins ? Créez un groupe en un instant ou rejoignez ceux déjà lancés. Chaque groupe a son propre chat en temps réel.

💬 DISCUTEZ EN DIRECT
Messagerie instantanée par groupe pour s'organiser, se donner rendez-vous et faire connaissance.

🗓️ NE RATEZ PLUS AUCUNE ANIMATION
Retrouvez toutes les animations du camping, voyez le nombre de participants et inscrivez-vous d'un tap. Une nouvelle animation ? Vous êtes prévenu.

🗺️ UNE CARTE POUR TOUT TROUVER
Plan interactif du camping : repérez la piscine, le snack, les sanitaires, la pétanque… et laissez-vous guider jusqu'au bon endroit.

📖 LE LIVRET D'ACCUEIL NUMÉRIQUE
Horaires, wifi, règlement, laverie, urgences : toutes les infos pratiques de votre camping, toujours dans votre poche.

🔒 RESPECTUEUX DE VOTRE VIE PRIVÉE
Pas de compte, pas d'e-mail, pas de pub. Vos données restent cloisonnées à votre camping et sont automatiquement supprimées à la fin de votre séjour.

CampConnect est proposé par les campings à leurs vacanciers. Demandez-le à votre réception !

Un camping intéressé ? Rendez-vous sur www.campconnect.fr
```

---

## 4. Sécurité des données (Data safety) — réponses

**L'app collecte-t-elle des données ?** → **Oui**
**Les données sont-elles chiffrées en transit ?** → **Oui**
**Peut-on demander la suppression des données ?** → **Oui**
→ **URL de suppression** : `https://www.campconnect.fr/suppression-donnees.html`

**Types de données collectées** (tout : « collecté », chiffré en transit, non partagé avec des tiers, non utilisé pour la pub) :

| Donnée | Catégorie Play | But | Facultatif ? |
|--------|----------------|-----|--------------|
| Pseudo + avatar | Informations personnelles → Nom | Fonctionnalité de l'app | Non (requis) |
| Messages du chat | Messages → Autres messages intégrés | Fonctionnalité de l'app | Oui |
| **Photos** (signalements, annonces) | **Photos et vidéos → Photos** | Fonctionnalité de l'app | **Oui** |
| Position approximative | Position → Position approximative | Fonctionnalité de l'app (présence au camping, carte) | Oui |
| Identifiant d'appareil | Identifiants → ID de l'appareil | Fonctionnalité de l'app | Non |
| Contenus utilisateur (signalements, annonces) | Messages → Autres messages intégrés | Fonctionnalité de l'app | Oui |

- **Données partagées avec des tiers** : Non
- **Données utilisées pour la publicité** : Non
- **Collecte facultative** : position, photos, messages et annonces ne sont collectés que si l'utilisateur les fournit volontairement.

> ⚠️ **Ne pas oublier les photos.** L'app permet de joindre une photo à un signalement
> ou à une petite annonce. Omettre la catégorie « Photos et vidéos » est un motif
> classique de rejet ou de suspension par Google.

### Permissions déclarées dans l'app
| Permission | Pourquoi |
|---|---|
| `INTERNET` | Communication avec le serveur |
| `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` | Vérifier la présence au camping, afficher la carte |
| `POST_NOTIFICATIONS` | Notifications de groupe et d'animations (Android 13+) |
| Appareil photo (via sélecteur système) | Joindre une photo à un signalement / une annonce |

---

## 5. Classification du contenu (IARC) — réponses

- **Catégorie d'app** : Réseau social / communication
- **Violence, contenu sexuel, grossièretés, drogue, jeux d'argent** : Non à tout
- **L'app permet-elle aux utilisateurs d'interagir / communiquer entre eux ?** → **Oui** (chat de groupe, petites annonces)
- **Les utilisateurs peuvent-ils partager des images ou du contenu créé par eux ?** → **Oui** (photos jointes aux signalements et aux annonces)
- **Partage de la position de l'utilisateur avec d'autres ?** → **Non** (la position sert à la carte/au contrôle d'accès, elle n'est pas diffusée aux autres vacanciers)
- **Contenu généré par les utilisateurs modérable ?** → **Oui** (le gérant peut supprimer messages, statuts, annonces et bannir un vacancier)
- **Le contenu est-il limité à un groupe fermé ?** → **Oui** : seuls les vacanciers présents dans le même camping voient les contenus (accès par QR code, GPS ou code horaire)
- Résultat attendu : **PEGI 3 / Tout public**

---

## 6. Public cible & contenu

- **Tranche d'âge cible** : 18 ans et plus (app grand public, pas destinée aux enfants)
- **L'app est-elle destinée aux enfants ?** → **Non**
- **Contient des publicités ?** → **Non**
- **Politique de confidentialité** (obligatoire) : `https://www.campconnect.fr/confidentialite.html`

---

## 7. Assets (rappel)

- ✅ Icône 512×512 — `assets/store/icon-512.png`
- ✅ Bannière 1024×500 (feature graphic) — la tienne
- ✅ Captures téléphone (min. 2) — dossier `screenshots/` du site
- Politique de confidentialité + suppression de données : **doivent être en ligne** sur campconnect.fr

---

## 8. Diffusion recommandée

1. **Tests internes** d'abord (diffusion immédiate à tes appareils, sans review complète)
2. Valider en réel quelques jours
3. **Production** → review Google (quelques heures à quelques jours)
