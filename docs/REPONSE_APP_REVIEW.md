# Réponse à l'App Review — refus du 19 août 2026

> Build examiné : **1.0 (81)**, sur **iPad Air 11-inch (M3)**.
> Submission ID : `3eb90f96-7ffb-4567-a56b-9dcc058fdbd1`

Ce n'est pas le même refus que les précédents. Le contrôleur **est entré dans
l'app** : il a parcouru le parcours vacancier, et ses trois demandes sont
concrètes. Aucune ne porte sur le code.

| Point | Ce qu'Apple demande | Ce qu'il faut faire |
|---|---|---|
| 2.1 | du contenu dans Events, Groups, Notices | exécuter `scripts/sql/revue_apple.sql` |
| 2.1(a) | un compte **gérant** avec identifiants | créer le compte, le mettre dans App Review Information |
| 2.1(b) | le modèle économique | répondre aux 8 questions (texte ci-dessous) |

**Pas de nouveau build à envoyer, pas de vidéo à tourner.** Apple écrit noir sur
blanc : *« providing a demo video showing the app in use is not sufficient »*.
Ce qu'il veut, c'est un identifiant et un mot de passe dans **App Review
Information**.

Le refus 2.1(a) vient de ma formulation précédente — *« Credentials can be
provided on request »*. C'est exactement ce qui déclenche ce refus.

---

## 1. Créer le compte gérant du contrôleur

Supabase → **Authentication → Users → Add user → Create new user**

| Champ | Valeur |
|---|---|
| Email | `appreview@campconnect.fr` |
| Password | celui que vous mettrez dans App Review Information |
| **Auto Confirm User** | ☑ **à cocher** — sinon la connexion est refusée |

Le compte ne peut pas être créé en SQL : `auth.users` contient un hachage et
une dizaine de champs internes que Supabase gère lui-même.

## 2. Exécuter le script

`scripts/sql/revue_apple.sql`, d'un bloc, dans l'éditeur SQL Supabase. Il pose
`acces_libre`, décale les animations sur les jours à venir, insère trois
annonces (une par type) et rattache le compte ci-dessus à Les Flots Bleus —
**sans toucher au vôtre** : `is_gerant()` teste le couple (user_id, camping_id),
deux gérants peuvent partager un camping.

La dernière requête du script est un contrôle : **aucune colonne ne doit être
nulle ou à zéro.**

## 3. Remplir App Review Information

App Store Connect → la version → **App Review Information**

- **Sign-In Required** : ☑
- **User Name** : `appreview@campconnect.fr`
- **Password** : celui choisi à l'étape 1
- **Notes** : le texte ci-dessous (2 400 caractères, la limite est à 4 000)

Puis **répondre dans le Resolution Center** avec le même texte.

---

## Texte à coller

```
DEMO ACCOUNT (Camp Manager)

  User name: appreview@campconnect.fr
  Password:  [LE MOT DE PASSE]

HOW TO REACH EACH MODE

The app ships two modes in a single binary.

A. Holidaymaker - no account, no password, nothing to type
   1. Launch the app.
   2. Type "Flots" in the search field.
   3. Select "Camping Les Flots Bleus".
   4. Tick the terms checkbox, pick an avatar, enter any nickname.
   The demo campsite has the on-site presence check disabled, so it opens
   from anywhere, including outside France.
   Tabs: Home, Groups, Events, Map, Notices, Welcome booklet, Profile.
   Moderation: open a group, press and hold a message written by someone
   else, then "Report this content" or "Block".
   Account deletion: Profile tab > "Delete my account".

B. Camp Manager - the account above
   From the very first screen, tap "Je suis gerant de camping"
   (I'm a campsite manager), at the bottom. Then sign in with the
   credentials above.
   If you have already joined the campsite as a holidaymaker, that first
   screen no longer appears. Either reinstall the app, or use Profile tab >
   "Delete my account", which returns you to it.

1. PRE-POPULATED CONTENT

Camping Les Flots Bleus now holds upcoming Events, active Groups with
conversations, Notices (small ads, lost and found), holidaymaker profiles,
a site map with points of interest, and a welcome booklet. The manager
account opens that same campsite, so every console screen - events,
attendance, statistics, moderation - is populated as well.

2. BUSINESS MODEL

- Is the app an extension of an existing online service?
  Yes. It is the mobile client of CampConnect, a service a campsite
  subscribes to as a business.

- Does this service have a cost?
  Not for users. The campsite pays an annual subscription, between EUR 490
  and EUR 1290 per year depending on how many pitches it has.

- What are the paid content or services?
  None inside the app. There is no in-app purchase, no paywall, no
  subscription screen, no unlockable feature, and no external purchase
  link. Everything a user can see is free.

- Do individual professionals pay for the content or services?
  No.

- Does a company or organization pay for the content or services?
  Yes: the campsite, which is a business.

- Where do they pay, and what's the payment method?
  Never in the app, and never on any page the app links to. The campsite
  signs a contract with us directly and is invoiced annually, offline. For
  the 2026 season the service is provided free of charge to the pilot
  campsites, so no payment is collected at all today.

- If users create an account to use your app, are there fees involved?
  Holidaymakers do not create an account. Authentication is anonymous: no
  email, no password, no personal identifier is collected. There are no
  fees of any kind, ever.

- How do users obtain an account?
  Holidaymakers do not need one, as described above. Camp manager accounts
  are created by us for the campsite once its subscription is signed, and
  attached to that campsite.

Thank you for your time.
```

---

## Historique des refus

| Refus | Guideline | Cause réelle |
|---|---|---|
| 1er | 1.2 + 4.0 | modération absente ; notes décrivant un geste inexistant |
| 2e | 2.1 | examinateur bloqué à la porte : `acces_libre` jamais posé |
| 3e | 2.1 | idem — le correctif n'était pas encore déployé |
| 4e | 2.1 + 2.1(a) + 2.1(b) | il est entré ; contenu vide, pas d'accès gérant, modèle économique non expliqué |

Le fil rouge des trois premiers : **j'avais décrit des états qui n'existaient
pas.** Chaque phrase du texte ci-dessus décrit ce que le contrôle du script
vérifie.
