# Fiche App Store Connect — textes à recopier

Tout ce qui suit est prêt à copier-coller. Les longueurs ont été vérifiées
contre les limites d'Apple. Les réponses sensibles sont justifiées par une
référence au code, comme dans `docs/FICHE_PLAY_STORE.md`.

---

## 1. Informations sur l'app (onglet « Informations générales »)

| Champ | Valeur |
|---|---|
| Nom (30) | `CampConnect` |
| Sous-titre (30) | `La vie de votre camping` |
| Bundle ID | `com.campconnect.ios` |
| Catégorie principale | Voyages |
| Catégorie secondaire | Réseaux sociaux |
| Droits d'auteur | `2026 Johan Abitbol` |
| Âge minimum | 17+ *(voir §5)* |

---

## 2. Version 1.0 — les champs de l'écran actuel

### Texte promotionnel (170)

```
Nouveau : la carte satellite de votre camping, avec tous les points utiles repérés. Et une messagerie de groupe en temps réel pour organiser vos journées à plusieurs.
```

> Modifiable sans soumettre de nouvelle version — c'est le seul champ dans ce cas.

### Description (4000)

```
CampConnect, c'est l'application qui recrée le lien entre les vacanciers de votre camping.

En camping, trois heures suffisent pour passer d'inconnus à complices. Encore faut-il se croiser. CampConnect vous donne les outils pour que ça arrive : voir qui propose quoi, rejoindre en un geste, discuter, et se retrouver.

CES VACANCES, VOUS N'ÊTES PLUS SEULS

• GROUPES SPONTANÉS
Randonnée demain matin, pétanque à 18h, apéro sur la plage, soirée barbecue… Créez un groupe en quelques secondes, ou rejoignez ceux des autres vacanciers. Tout le monde les voit, tout le monde peut participer.

• MESSAGERIE EN TEMPS RÉEL
Une conversation par groupe. Plus besoin d'échanger son numéro maladroitement : on discute directement dans l'app, on s'organise, on se donne rendez-vous.

• AGENDA DES ANIMATIONS
Le programme complet publié par l'équipe du camping : tournois, spectacles, ateliers, soirées. Inscription en un geste, avec le nombre de participants déjà inscrits. Vous ne ratez plus rien.

• CARTE INTERACTIVE DU CAMPING
Le plan de votre camping en vue satellite, avec tous les points utiles repérés : piscine, bar, sanitaires, terrains de sport, laverie, parking. Vous vous repérez dès le premier jour.

• LIVRET D'ACCUEIL NUMÉRIQUE
Horaires de la piscine, code Wi-Fi, règlement, services, numéros utiles : tout est dans l'app, consultable à toute heure sans déranger la réception.

• PROFIL SIMPLE, SANS PRISE DE TÊTE
Un pseudo, un avatar, votre numéro d'emplacement. Pas d'adresse e-mail, pas de mot de passe, pas de formulaire interminable. Vous êtes dans l'app en trente secondes.

RÉSERVÉ AUX VACANCIERS DE VOTRE CAMPING

CampConnect n'est pas un réseau social ouvert. Chaque camping a son espace, accessible uniquement aux personnes présentes sur place, via le QR code affiché à la réception ou un code d'accès communiqué par l'équipe. Vous ne discutez qu'avec vos voisins de vacances, personne d'autre.

MODÉRATION

Chaque contenu publié peut être signalé depuis l'application. L'équipe du camping supprime messages, annonces et statuts, et peut exclure un participant. Les signalements sont traités sous 24 heures.

POUR LES CAMPINGS

Chaque camping dispose de son propre espace aux couleurs de l'établissement, avec son logo et son plan. L'équipe publie ses animations, suit les inscriptions et met à jour son livret d'accueil depuis une interface dédiée.

Vous gérez un camping et souhaitez proposer CampConnect à vos vacanciers ? Rendez-vous sur www.campconnect.fr

VIE PRIVÉE

Aucune donnée n'est revendue. Pas de publicité. Les échanges restent au sein de votre camping, et vos données sont supprimées à la fin de votre séjour.

Politique de confidentialité : https://www.campconnect.fr/confidentialite.html
```

> Le paragraphe MODÉRATION n'existe pas dans la fiche Play Store. Il est ajouté
> ici parce que la règle 1.2 d'Apple (contenu généré par les utilisateurs) exige
> un moyen de signaler, un moyen de bloquer et une action sous 24 h. L'annoncer
> dans la description évite l'aller-retour.

### Mots-clés (100)

```
camping,vacances,animation,groupe,rencontre,plan,activité,séjour,mobil-home,camping-car,village
```

> Séparés par des virgules **sans espace** — chaque espace consomme un caractère
> pour rien. Ne pas y remettre « CampConnect » ni les mots du sous-titre : le nom
> et le sous-titre sont déjà indexés, les répéter gaspille des caractères.

### URL

| Champ | Valeur |
|---|---|
| URL de l'assistance | `https://www.campconnect.fr/apropos.html` |
| URL marketing | `https://www.campconnect.fr` |

> La page « À propos » affiche bien `contact@campconnect.fr`. Une URL
> d'assistance sans moyen de contact visible est un motif de rejet.

### Version et droits d'auteur

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Copyright | `2026 Johan Abitbol` |

---

## 3. Captures d'écran

L'écran indique **6/10** : les captures sont déjà en place, au format 6,5"
(`assets/store/screenshots-ios/`, 1284×2778). Aucune autre taille n'est
obligatoire — Apple décline automatiquement vers les autres tailles d'iPhone.

Ordre conseillé : Carte → Groupes → Chat → Agenda → Accueil → Infos.

Les **aperçus vidéo (0/3) sont facultatifs**. Ne pas s'en occuper pour la 1.0.

---

## 4. Informations pour l'examen (« App Review Information »)

Pas de compte de démonstration à fournir : l'application n'a pas d'écran de
connexion pour les vacanciers. Cocher **« Connexion requise : Non »**, puis
coller ceci dans les notes :

```
Aucun identifiant ni mot de passe n'est requis.

Les campings réels vérifient que le vacancier est présent sur place
(position GPS, ou QR code affiché à la réception). Un camping de
démonstration a été ouvert spécialement pour la revue, sans aucune
vérification de position : il est accessible depuis n'importe où.

1. Lancez l'application.
2. Sur le premier écran, cherchez « Les Flots Bleus ».
3. Sélectionnez-le, saisissez un pseudo, et l'application s'ouvre
   entièrement : groupes, messagerie, agenda, carte et livret d'accueil.

Signalement et modération : appui long sur un message, ou bouton
« Signaler » sur une annonce. Les contenus signalés sont traités par
l'équipe du camping sous 24 heures.
```

> Le lien `https://app.campconnect.fr/join/les-flots-bleus` fonctionne dans un
> navigateur mais **pas** dans l'app installée : Capacitor sert toujours l'app
> depuis `/`, donc le test de chemin d'`Onboarding.jsx` ne peut pas voir
> `/join/`. D'où la recherche par nom, qui marche partout.

> **Prérequis** : relancer `scripts/sql/seed_flots_bleus.sql` en production avant
> la soumission. Il date les animations relativement à aujourd'hui ; un agenda
> vide suffirait à faire rejeter l'app.

---

## 5. Âge minimum — répondre 17+, pas 4+

Le questionnaire d'Apple comporte, depuis les règles sur le contenu généré par
les utilisateurs, une question sur les **fonctionnalités sociales sans
restriction**. CampConnect propose une messagerie libre entre inconnus ; la
réponse honnête classe l'app en **17+**.

Se déclarer 4+ avec une messagerie ouverte est un motif de rejet fréquent, et
un motif de retrait après publication.

Le cloisonnement par camping est une circonstance atténuante à mentionner dans
les notes de revue, pas une raison de baisser la classification.

---

## 6. Confidentialité (« App Privacy »)

Mêmes réponses que le formulaire Data Safety de Google, dans le vocabulaire
d'Apple. Détail et justifications : `docs/FICHE_PLAY_STORE.md` §6.

| Type de donnée | Collectée | Liée à l'utilisateur | Suivi publicitaire |
|---|---|---|---|
| Nom (pseudo) | Oui | Oui | Non |
| Adresse e-mail *(gérants)* | Oui | Oui | Non |
| Position approximative | Oui | Non | Non |
| Position précise | Oui | Non | Non |
| Messages | Oui | Oui | Non |
| Photos | Oui | Oui | Non |
| Identifiant d'appareil | Oui | Oui | Non |

**Suivi publicitaire : Non partout.** L'app n'utilise aucun SDK publicitaire, ne
demande donc pas l'autorisation de suivi (ATT) et ne doit surtout pas la
déclarer.

**Position précise à déclarer**, même si elle reste locale dans la plupart des
cas : quand un camping n'a pas encore de centre calibré, les coordonnées exactes
sont écrites en base dans `campings.carte_config.center` (`Onboarding.jsx`,
lignes 73-82). Il y a donc bien transmission hors appareil.

---

## 7. Chiffrement

`ITSAppUsesNonExemptEncryption` est déjà positionné à `false` dans
`Info.plist`. La question « Documents sur le chiffrement des apps » ne doit donc
plus apparaître. Si elle réapparaît : l'app n'utilise que HTTPS, ce qui relève
de l'exemption standard.

---

## 8. Reste à faire avant de cliquer sur « Ajouter pour vérification »

- [ ] Un build Xcode Cloud entièrement vert, visible dans TestFlight — les
      exports Ad Hoc et Development échouaient faute d'appareil enregistré sur
      le compte développeur
- [ ] Relancer `scripts/sql/seed_flots_bleus.sql` en production
- [ ] Vérifier que les notifications push iOS ne sont pas annoncées comme
      fonctionnelles : `send-push` passe encore par FCM, qui rejette les jetons
      APNs. Elles ne sont mentionnées ni dans la description ni dans les
      captures — à laisser ainsi jusqu'à l'implémentation APNs.
