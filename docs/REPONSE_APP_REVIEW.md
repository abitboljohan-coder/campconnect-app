# Réponse à l'App Review — Guideline 2.1

> À coller dans **App Review Information → Notes** *et* dans le Resolution
> Center. Apple demande deux fois que ce soit dans le champ Notes.
>
> **Chaque phrase décrit ce que la vidéo montre.** Les deux premiers refus
> viennent d'écarts entre ce qui était écrit et ce qui existait.

---

## 1. Vérifier le build AVANT de filmer

| À vérifier | Où | Si absent |
|---|---|---|
| « Supprimer mon compte » | Profil, tout en bas | relancer un build |
| Accès sans code | recherche « Flots » → clic | ne pas filmer, me le dire |
| Agenda non vide | onglet Agenda | relancer le décalage des animations |

Le camping de démonstration est en accès libre : **aucune demande de code, aucun
écran GPS**. Si l'un des deux apparaît, le build est antérieur au correctif.

---

## 2. Ce qu'il faut filmer, dans l'ordre

Un seul enregistrement continu, sur iPhone physique, sans coupure.

1. **Lancement de l'app** — l'enregistrement doit commencer là.
2. Recherche « **Flots** », sélectionner « Camping Les Flots Bleus ».
3. **S'arrêter deux secondes sur le bloc « Règles de la communauté »** — le
   texte doit être lisible à l'image.
4. Tenter de valider **sans cocher** la case → le refus s'affiche.
5. Cocher, choisir un avatar, saisir un pseudo, valider.
6. Parcourir : **Accueil**, **Groupes**, **Agenda**, **Carte**, **Infos**.
7. Ouvrir un groupe. **Appui long** sur un message écrit par quelqu'un d'autre
   (tenir une seconde pleine).
8. « **Signaler ce contenu** » → choisir un motif → la confirmation apparaît.
9. **Appui long** à nouveau → « **Bloquer** » → le message disparaît
   immédiatement à l'écran.
10. Onglet **Profil** → « **Supprimer mon compte** » → la confirmation →
    **Supprimer** → retour à l'écran d'entrée.

Les étapes **9** et **10** sont celles qu'Apple veut voir de ses yeux.

> Aucune demande d'autorisation n'apparaît dans ce parcours, et c'est normal :
> le camping de démonstration a la vérification de présence désactivée, et la
> photo d'un signalement est facultative. Le texte l'explique au point 1 plutôt
> que de promettre un écran que la vidéo ne montre pas — c'est précisément
> l'écart qui a valu les deux premiers refus.

---

## 3. Texte à coller

```
Hello,

Please find below the information requested. A screen recording is attached.

1. SCREEN RECORDING

Attached, captured on a physical iPhone running the latest iOS. It begins
with the app launch and shows, in one continuous take:

  - Account registration: the Community Rules panel, and the required terms
    checkbox that blocks sign-up until it is ticked
  - The core flow: home, groups, group chat, events, map, welcome booklet
  - User-generated content moderation: long press on a message, then
    "Report this content" with its five categories, then "Block", showing
    the blocked person's content disappear immediately
  - Account deletion, from Profile > Delete my account

There is no login step and no paid content: see points 3 and 4.

PERMISSION PROMPTS - why none appears in the recording

The app declares three purpose strings. None of them is triggered along the
demo path shown in the video, and we would rather say so than describe a
screen you will not see:

  - Location (NSLocationWhenInUseUsageDescription) is requested only to
    verify that a holidaymaker is physically on the campsite they are
    joining. The demo campsite provided for review has that check disabled
    so that you can reach the app from anywhere, so the prompt does not
    appear. String: "Votre position sert uniquement a verifier que vous etes
    bien dans le camping lors de l'inscription."
  - Camera (NSCameraUsageDescription) and Photo Library
    (NSPhotoLibraryUsageDescription) are requested only when a user chooses
    to attach a photo to an issue report or to a small ad. Both are optional
    and are not part of the core flow. Strings: "L'appareil photo sert a
    joindre une photo a un signalement ou a une annonce." and "Vos photos
    servent a illustrer un signalement ou une annonce que vous publiez."

To see the camera prompt: Home tab > "Signaler" card > "Ajouter une photo".

2. DEVICES AND OPERATING SYSTEMS TESTED

  - iPhone [MODÈLE], iOS [VERSION]
  - Layout verified at 320, 390, 768, 820 and 1180 points

3. WHAT THE APP DOES, AND FOR WHOM

CampConnect is a private social app for a single campsite.

The problem: holidaymakers staying on the same campsite have no way to find
each other. Someone looking for a fourth player for pétanque, or parents
hoping their children will meet others, currently rely on notice boards and
chance. Campsite managers announce their activities on paper and never know
how many people will show up.

The app gives each campsite a private space where holidaymakers create
activity groups, chat, sign up for the campsite's events, find their way
around a map of the site, read the welcome booklet, report a problem to the
manager, and post small ads. Managers get a console to publish events, see
attendance, and moderate content.

Target audience: holidaymakers of all ages staying on a campsite, and
campsite managers. Content is scoped to one campsite and is never public.

4. HOW TO ACCESS THE APP

No account, no password, no credentials required. Access is by physical
presence: real campsites verify the holidaymaker is on site, by GPS or by a
QR code displayed at reception.

A demo campsite is open specifically for review, with that check disabled.
It is reachable from anywhere, including outside France:

  1. Launch the app.
  2. On the first screen, type "Flots" in the search field.
  3. Select "Camping Les Flots Bleus".
  4. Tick the terms checkbox, enter any nickname, and the app opens fully.

To see moderation: open any group, then press and hold a message written by
someone else.
To see account deletion: Profile tab, then "Delete my account".

The manager console is a separate mode, not part of the holidaymaker app and
not required for review. Credentials can be provided on request.

5. EXTERNAL SERVICES

  - Supabase - database, anonymous authentication and image storage.
    Authentication is anonymous: no email, no password, no personal
    identifier is collected. https://supabase.com
  - Esri ArcGIS World Imagery - satellite tiles for the campsite map,
    attribution displayed on the map. https://www.esri.com
  - OpenStreetMap Nominatim and Overpass - geocoding a campsite and
    detecting its points of interest, used by the manager console when a
    campsite is first set up. Data under ODbL. https://www.openstreetmap.org
  - Open-Meteo - the campsite weather forecast, no key, no account.
    https://open-meteo.com

No payment processor, no advertising network, no analytics, no AI service,
no third-party tracking. Push notifications are not enabled in this version.

6. REGIONAL DIFFERENCES

None. The app behaves identically everywhere. Its interface is available in
French, English, Spanish and Dutch, selected from the phone's language and
changeable in the Profile tab. Content depends only on which campsite the
user has joined, never on their country.

7. REGULATED INDUSTRY OR PROTECTED MATERIAL

Not applicable. The app operates in no regulated industry and includes no
protected third-party material. Map imagery and map data are used under
their providers' terms, with attribution displayed in the app.

Thank you for your time.
```

---

## 4. L'ordre des opérations

1. Vérifier le build (tableau ci-dessus)
2. Filmer les 11 étapes
3. Coller le texte dans **App Review Information → Notes**, remplir la ligne
   `[MODÈLE]` / `[VERSION]` (Réglages → Général → Informations)
4. Attacher le build à la version, corriger la date de sortie si besoin
5. **Update Review**, avec la vidéo en pièce jointe dans le Resolution Center

---

## Historique des refus

| Refus | Guideline | Cause réelle |
|---|---|---|
| 1er | 1.2 + 4.0 | modération absente ; notes décrivant un geste inexistant |
| 2e | 2.1 | examinateur bloqué à la porte : `acces_libre` jamais posé |
| 3e | 2.1 | idem — le correctif n'était pas encore déployé |
