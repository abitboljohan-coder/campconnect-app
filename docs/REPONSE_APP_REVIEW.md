# Réponses à l'App Review

> À coller dans **App Store Connect → App Review Information → Notes**, et à
> renvoyer dans le Resolution Center. En anglais.
>
> **Chaque affirmation est vérifiée dans le code.** Le premier refus est venu
> d'une note décrivant un geste inexistant : l'examinateur l'a cherché, ne l'a
> pas trouvé, et a refusé. Ne rien ajouter ici qui ne soit pas démontrable.

---

## Historique

| Date | Guideline | Issue |
|---|---|---|
| 1er refus | 1.2 UGC + 4.0 Design | modération absente, mise en page tablette |
| 2e refus | **2.1 Information Needed** | dossier de nouvelle app incomplet |

Le 2.1 ne conteste plus la modération : la réponse précédente est passée. Il
s'agit maintenant du dossier standard exigé de toute nouvelle application.

---

## Avant d'envoyer

1. **Nouveau build** incluant la suppression de compte (ajoutée pour ce refus).
   Sans elle, le prochain refus sera un 5.1.1(v).
2. `scripts/sql/moderation_contenu.sql` exécuté en production :

   ```sql
   select to_regclass('public.blocages') as table_blocages,
          count(*) filter (where column_name = 'cible_texte')       as cible_texte,
          count(*) filter (where column_name = 'auteur_signale_id') as auteur_signale_id
   from information_schema.columns where table_name = 'signalements';
   ```
3. `scripts/sql/seed_flots_bleus.sql` relancé — un agenda vide suffit à faire
   refuser.

---

## Texte à coller

```
Hello,

Please find below the information requested. A screen recording is attached.

1. SCREEN RECORDING

Attached, captured on a physical iPhone running the latest iOS. It starts
with the app launch and shows, in one continuous take:

  - Account registration, including the Community Rules panel and the
    required terms checkbox that blocks sign-up until ticked
  - The location permission prompt, and the fallback access code shown at
    the campsite reception when GPS is unavailable
  - The core flow: groups, group chat, events, map, welcome booklet
  - User-generated content moderation: long press on a message, then
    "Report this content" with its five categories, then "Block", showing
    the blocked person's content disappearing immediately
  - Account deletion, from Profile > Delete my account

There is no login step and no paid content: see points 3 and 4.

2. DEVICES AND OPERATING SYSTEMS TESTED

  - iPhone [MODÈLE], iOS [VERSION]        ← à compléter
  - Layout verified at 320, 390, 768, 820 and 1180 points

3. WHAT THE APP DOES, AND FOR WHOM

CampConnect is a private social app for a single campsite.

The problem: holidaymakers staying on the same campsite have no way to find
each other. Someone looking for a fourth player for pétanque, or parents
hoping their children will meet others, currently rely on notice boards and
chance. Campsite managers, for their part, announce their activities on
paper and never know how many people will show up.

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

A demo campsite is open specifically for review, with no location check. It
is reachable from anywhere:

  1. Launch the app.
  2. On the first screen, search for "Les Flots Bleus".
  3. Select it, tick the terms checkbox, enter any nickname.
  4. The app opens fully.

To see moderation: open any group, then press and hold a message written by
someone else.
To see account deletion: Profile tab, then "Delete my account".

The manager console is a separate mode, not part of the holidaymaker app
and not required for review. Credentials can be provided on request.

5. EXTERNAL SERVICES

  - Supabase - database, anonymous authentication and image storage.
    Authentication is anonymous: no email, no password, no personal
    identifier is collected. https://supabase.com
  - Esri ArcGIS World Imagery - satellite tiles for the campsite map.
    Attribution is displayed on the map. https://www.esri.com
  - OpenStreetMap Nominatim and Overpass - geocoding a campsite and
    detecting its points of interest. Used by the manager console when a
    campsite is first set up. Data under ODbL. https://www.openstreetmap.org
  - Open-Meteo - the campsite weather forecast. No key, no account.
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

## Le tournage

Un seul enregistrement continu, sur iPhone physique. Ne pas couper : une
coupure au mauvais endroit fait douter que le geste marche vraiment.

1. Lancement, recherche « Les Flots Bleus », sélection.
2. **Le bloc « Règles de la communauté »** — s'y arrêter deux secondes.
3. Tenter de valider **sans** cocher → le refus s'affiche.
4. Cocher, saisir un pseudo, valider.
5. **La demande d'autorisation de localisation** — la montrer à l'écran.
6. Parcourir : groupes, agenda, carte, infos.
7. Ouvrir un groupe. **Appui long** sur un message d'un autre.
8. « Signaler ce contenu » → un motif → la confirmation.
9. **Appui long** → « Bloquer » → le message disparaît immédiatement.
10. Onglet **Profil** → **« Supprimer mon compte »** → la feuille de
    confirmation → **Supprimer** → retour à l'écran d'entrée.

Les étapes 9 et 10 sont celles qu'Apple veut voir de ses yeux.
