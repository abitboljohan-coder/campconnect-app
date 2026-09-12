# Réponse à l'App Review — refus du 20 août 2026

> Build examiné : **1.0 (81)**, sur **iPad Air 11-inch (M3)**.
> Submission ID : `3eb90f96-7ffb-4567-a56b-9dcc058fdbd1`

Le 20 août, **2.1 et 2.1(b) sont tombés** : le contenu et le modèle
économique ont satisfait Apple. Il ne reste que **2.1(a)** — l'accès gérant.

Vérifié en base le 20 août :

| Fait | Valeur |
|---|---|
| `appreview@campconnect.fr` existe et est confirmé | oui |
| rattaché à Camping Les Flots Bleus | oui |
| **dernière connexion réussie** | **19 août 16 h 12** — vous, pas le contrôleur |
| Les Flots Bleus | 6 événements, 6 groupes, 3 annonces, 26 points, 13 vacanciers |

Le compte est bon. Le contrôleur ne s'est jamais connecté avec — parce qu'on ne
lui a jamais montré les identifiants.

## La cause : deux champs vides dans App Store Connect

Le contrôleur **a trouvé l'écran de connexion gérant** — sa capture du 20 août
le montre dessus, à 10 h 23. Les deux champs y affichent leurs placeholders en
gris (`gerant@camping.fr` et `••••••••`) : le formulaire est **vide**. Il est
arrivé devant la porte sans rien à taper.

Les identifiants **avaient bien été fournis**, mot de passe compris, dans la
réponse au Resolution Center. Ce n'est pas un oubli.

Mais le panneau où le contrôleur lit un compte de démonstration est alimenté par
la case **Sign-In Required** et les champs **User Name** / **Password** de la
version — et par rien d'autre. Case décochée, son outil enregistre « no demo
account provided » et envoie le gabarit correspondant. C'est pourquoi la phrase
revient à l'identique depuis deux tours : elle est déclenchée par un état, pas
rédigée après lecture du texte.

Second piège, du même ordre : Apple demande *« reply to this message »*, donc la
réponse part dans le **Resolution Center**. Ce fil n'est pas le champ **Notes**
de la version. Les deux s'appellent « notes » dans la conversation courante, ce
ne sont pas les mêmes champs.

**Rien à corriger dans le code ni dans la base.** Vérifié le 20 août :

| Contrôle | Résultat |
|---|---|
| email identique dans `auth.users` et `gerants` | ✅ |
| `user_id` correctement lié | ✅ |
| mot de passe posé, email confirmé | ✅ |
| compte ni banni ni supprimé | ✅ |
| rattaché à Camping Les Flots Bleus | ✅ |
| connexion réussie le 19 août 16 h 12 | ✅ (par le propriétaire) |

> Ce que j'avais écrit la veille — « la porte gérant se referme derrière le
> contrôleur » — était faux : il l'a trouvée. Le trou existe quand même (le
> bouton ne vit que sur l'écran de recherche) et le correctif reste utile pour
> le prochain build, mais **ce n'est pas ce qui a causé ce refus**.

Apple écrit par ailleurs noir sur blanc : *« providing a demo video showing the
app in use is not sufficient »*. Pas de vidéo à tourner, pas de build à envoyer.

---

## 1 et 2 — déjà faits, vérifiés en base

Le compte existe, est confirmé, et est rattaché à Les Flots Bleus. Le script
`scripts/sql/revue_apple.sql` a bien tourné : 6 événements à venir, 6 groupes,
3 annonces. **Rien à refaire de ce côté.**

## 3. Le geste qui débloque tout

App Store Connect → **My Apps** → CampConnect → dans la colonne de gauche, la
version **1.0** sous « iOS App » → descendre jusqu'à la section
**App Review Information**

| Champ | Valeur |
|---|---|
| **Sign-In Required** | ☑ **à cocher — c'est ce qui manquait** |
| **User Name** | `appreview@campconnect.fr` |
| **Password** | celui que vous avez posé le 19 août |
| **Notes** | le texte ci-dessous (3 441 caractères, limite 4 000) |

Cocher la case fait apparaître les deux champs : tant qu'elle est décochée, ils
n'existent pas, et c'est exactement ce qui s'est passé.

Puis **Save**, et répondre dans le Resolution Center :

```
Hello,

The demo account was already supplied, with its password, in our previous
reply. We believe it did not reach your review panel because the
"Sign-In Required" box on the version was not ticked, which leaves the
User Name and Password fields empty regardless of what the notes contain.

That is now done: Sign-In Required is ticked, and the credentials are filled
in the App Review Information section of the version.

  User name: appreview@campconnect.fr
  Password:  [LE MOT DE PASSE]

Please sign in from the app's first screen, at the bottom:
"Je suis gerant de camping" (I'm a campsite manager). The account opens the
console for Camping Les Flots Bleus, which holds 6 upcoming events, 6 active
groups with conversations, 3 notices, 13 holidaymaker profiles and 26 map
points of interest.

Full instructions are in the Notes field. Thank you for your patience.
```

---

## Texte à coller

```
DEMO ACCOUNT (Camp Manager)

  User name: appreview@campconnect.fr
  Password:  [LE MOT DE PASSE]

HOW TO REACH EACH MODE

The app ships two modes in a single binary.

A. Camp Manager - START HERE, before anything else

   1. Launch the app.
   2. On the very first screen, scroll to the bottom and tap
      "Je suis gerant de camping" (I'm a campsite manager).
   3. Sign in with the credentials above.
   You will land on the console for Camping Les Flots Bleus: events,
   attendance, statistics, site map, appearance, welcome booklet and
   moderation, all with real content.

   IMPORTANT - please do this FIRST. In this build, that manager link sits
   on the campsite-search screen, which stops being shown once you have
   joined a campsite as a holidaymaker. If you have already joined, use
   Profile tab > "Delete my account" to return to that first screen. We are
   sorry for the detour; the next build puts a permanent "Espace gerant"
   entry in the Profile tab.

B. Holidaymaker - no account, no password, nothing to type

   1. On the first screen, type "Flots" in the search field.
   2. Select "Camping Les Flots Bleus" - please pick this one exactly. It is
      the campsite prepared for review, and the only one open without an
      on-site check.
   3. Tick the terms checkbox, pick an avatar, enter any nickname.
   Tabs: Home, Groups, Events, Map, Notices, Welcome booklet, Profile.
   Moderation: open a group, press and hold a message written by someone
   else, then "Report this content" or "Block".
   Account deletion: Profile tab > "Delete my account".

1. PRE-POPULATED CONTENT

Camping Les Flots Bleus currently holds 6 upcoming events, 6 active groups
with conversations, 3 notices, 13 holidaymaker profiles, 26 map points of
interest and a welcome booklet. The manager account opens that same
campsite, so every console screen is populated too.

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
