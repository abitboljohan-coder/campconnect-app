# Réponse à envoyer dans le Resolution Center

> Texte à copier tel quel dans App Store Connect → Resolution Center, avec la
> vidéo en pièce jointe. En anglais : c'est la langue des équipes de revue.
>
> **Chaque phrase décrit une fonctionnalité vérifiée dans le code.** Le premier
> refus vient d'une note qui décrivait un geste inexistant ; l'examinateur l'a
> cherché, ne l'a pas trouvé, et a refusé. Ne rien ajouter ici qui ne soit pas
> démontrable à l'écran.

---

## À vérifier AVANT d'envoyer

1. Le nouveau build est sur TestFlight et **contient** la case CGU et l'appui
   long → Signaler / Bloquer. Si l'un des deux manque, ne pas envoyer.
2. `scripts/sql/moderation_contenu.sql` a été exécuté en production. Sans la
   table `blocages` et les colonnes ajoutées à `signalements`, le signalement
   et le blocage échouent **silencieusement** — et cette réponse décrirait à
   nouveau une fonctionnalité introuvable.

   ```sql
   select to_regclass('public.blocages') as table_blocages,
          count(*) filter (where column_name = 'cible_texte')       as cible_texte,
          count(*) filter (where column_name = 'auteur_signale_id') as auteur_signale_id
   from information_schema.columns
   where table_name = 'signalements';
   ```
   Attendu : `blocages` non nul, et les deux colonnes à 1.
3. `scripts/sql/seed_flots_bleus.sql` relancé, pour que l'agenda du camping de
   démonstration ne soit pas vide.

---

## Texte de la réponse

```
Hello,

Thank you for the detailed review. We have addressed both points and
submitted a new build.

GUIDELINE 1.2 — SAFETY, USER-GENERATED CONTENT

We want to be straightforward about the previous submission: our review
notes described a reporting gesture that was not actually implemented.
That was our mistake, and we understand why the app was rejected. The
functionality now exists and is demonstrated in the attached screen
recording, captured on a physical iPhone.

1. Terms with a zero-tolerance policy, accepted before account creation

   The sign-up screen displays a "Community rules" panel stating that no
   offensive content or abusive behaviour is tolerated, and that such
   content leads to immediate removal and exclusion. A required checkbox
   below it links to the full Terms (https://www.campconnect.fr/cgu.html)
   and the Privacy Policy. The account cannot be created until it is
   ticked; the acceptance timestamp is stored with the profile.

2. Reporting objectionable content

   A long press on any message in a group chat, or on any status on the
   home screen, opens a moderation sheet. "Report this content" offers
   five categories: harassment, hate speech, sexual content, scam, other.
   The report is sent to the campsite manager with a copy of the reported
   text, so it remains reviewable even if the author deletes it.

3. Blocking abusive users

   The same sheet offers "Block". The effect is immediate and local to the
   reporting user: every message and status from the blocked person
   disappears from their view at once, with no reload and no server round
   trip required.

   Blocking also files a report to the campsite manager, including the
   blocked author and the content concerned. A block is therefore never
   silent to us: it always reaches a moderator.

4. Acting on reports

   Each campsite has a moderation console. The manager sees every reported
   message and status, deletes content, and bans an author outright. A
   banned user can no longer post. We commit to acting on reports within
   24 hours.

   Content is scoped to a single campsite and is not public: only
   holidaymakers verified as present on that campsite can see or post it.

GUIDELINE 4 — DESIGN

The app is submitted for iPhone only (TARGETED_DEVICE_FAMILY = 1). On the
wider viewport used during your review, the interface no longer stretches
its phone layout across the full width: content is now capped at a
readable column and centred, and the navigation bar follows the same
column. We verified this at 320, 390, 768, 820 and 1180 points.

DEMO ACCESS

No account or password is required. Real campsites verify that the
holidaymaker is physically on site (GPS or a QR code shown at reception).
A demo campsite is open specifically for review, with no location check —
it is reachable from anywhere.

  1. Launch the app.
  2. On the first screen, search for "Les Flots Bleus".
  3. Select it, enter any nickname, accept the terms, and the app opens
     fully: groups, chat, events, map and welcome booklet.

To see moderation: open any group, then press and hold a message from
another person.

Thank you for your time.
```

---

## Ce que la vidéo doit montrer, dans cet ordre

Un seul enregistrement continu, sur iPhone physique. Ne pas couper : une
coupure au mauvais endroit fait douter que le geste marche vraiment.

1. Lancement, recherche « Les Flots Bleus », sélection.
2. **Le bloc « Règles de la communauté »** — s'y arrêter deux secondes, le
   texte doit être lisible à l'image.
3. Tenter de valider **sans** cocher la case → le refus s'affiche.
4. Cocher, valider, l'app s'ouvre.
5. Ouvrir un groupe. **Appui long** sur un message de quelqu'un d'autre.
6. « Signaler ce contenu » → choisir un motif → la confirmation apparaît.
7. **Appui long** à nouveau → « Bloquer » → le message disparaît
   immédiatement à l'écran.

Le point 7 est le plus important : c'est celui qu'Apple veut voir de ses yeux.
