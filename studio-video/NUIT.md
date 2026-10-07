# Mode nuit du studio vidéo

Chaque nuit, une routine produit **une vidéo courte** (15 à 25 s) à partir des
vrais écrans de l'app, capturés dans la démo, et la dépose dans la
**Vidéothèque** avec son texte de publication.

Vidéothèque : https://claude.ai/artifact/VT8te1PUR49rX2F94Mqj5Y

## Produire la vidéo

```bash
git clone https://github.com/abitboljohan-coder/campconnect-app
cd campconnect-app
bash studio-video/nuit.sh                  # thème du jour
bash studio-video/nuit.sh --liste          # thèmes et prochaines dates
bash studio-video/nuit.sh --theme pub-en   # un thème précis
```

Le script installe ses dépendances (npm, numpy/scipy/pillow, Chromium si
`/opt/pw-browsers` est absent), lance la démo, rejoue les gestes du thème dans
la vraie interface, rend la vidéo, compose la musique et contrôle la qualité.
Il échoue avec « ÉCHEC nuit : … » et un code non nul si une étape rate.

Sorties dans `studio-video/out/nuit/` (jamais dans git) :

| Fichier | Contenu |
|---|---|
| `campconnect-<date>-<thème>.mp4` | la vidéo web (H.264, ≤ 8 Mo) |
| `vignette.jpg` | une image d'aperçu |
| `planche.jpg` | une image toutes les 0,5 s, pour le contrôle visuel |
| `fiche.json` | titre, thème, format, durée, langue, légende, `doc_id` |
| `qc.txt` | durée, poids, loudness, plans, verdict |

## Thèmes

`studio-video/nuit/themes.json`. Seuls les thèmes marqués `"verifie": true`
entrent dans la rotation : le thème du jour est
`thèmes_vérifiés[(jours depuis rotation_depuis) % leur nombre]`.
Chaque thème décrit une accroche, 1 à 3 plans (écran de la démo + gestes), une
phrase « valeur pour le gérant », sa langue et son format. Structure d'un film :
accroche 4 s, plans 6 à 14 s (total pair, pour tomber sur la mesure),
valeur 2 s, fin 4 s, soit 16 à 24 s.

**Un thème nouveau ou modifié se teste à la main** (`--theme <slug>`) en
regardant la planche, et ne reçoit `"verifie": true` qu'ensuite. Pour en tester
plusieurs à la fois : `NUIT_OUT=/tmp/essai-<slug> bash studio-video/nuit.sh
--theme <slug> --port <port libre>`.

### Moteur visuel

Le téléphone occupe environ les deux tiers de la largeur en 9:16. Pendant un
plan, trois effets se déclarent dans les actions du thème (ils sont dessinés
par-dessus la capture, l'interface n'est jamais retouchée) :

| Effet | Ce qu'il fait | Quand l'utiliser |
|---|---|---|
| `zoom` | la caméra s'approche d'un élément et le surligne en saumon | le geste important : un champ qu'on remplit, un bouton |
| `loupe` | l'élément sort de l'écran, agrandi, sur fond assombri | le détail qui compte : un compteur, une mention, un numéro |
| `notif` | une notification push descend sur l'écran | seulement avec le texte réel envoyé par l'app (`supabase/functions/send-push`) : « Nouvelle animation 🎉 » + titre, ou titre du groupe + « Pseudo : message » |

Pas de notification pour les signalements : le gérant n'en reçoit pas
(pastille dans l'espace gérant seulement).

### Thèmes vérifiés (5 octobre 2026)

| Thème | Côté | Valeur pour le gérant |
|---|---|---|
| `gerant-publier-animation` | gérant | publier en quelques secondes, les présents sont notifiés : plus d’affichettes |
| `creer-un-groupe` | vacanciers | la convivialité se crée sans que le camping organise |
| `animations-pleines` | business | places et inscrits en temps réel : préparer juste ce qu’il faut |
| `changer-cle-qr` | gérant | un QR qui circule se désactive en un appui : sécurité |
| `mini-fiche` | vacanciers | les points communs font naître les rencontres |
| `livret-accueil` | business | le livret dans la poche : moins de questions à l’accueil |
| `gerant-signalements` | gérant | signalement en direct, pastille, suivi jusqu’à résolu |
| `notif-message` | vacanciers | les rendez-vous de groupe ont vraiment lieu |
| `entree-verifiee` | business | code de l’heure et position : pas d’intrus |
| `dupliquer-animation` | gérant | une animation recopiée une semaine plus tard, en un appui |
| `petites-annonces` | vacanciers | objets perdus et trouvés réglés entre vacanciers |
| `a-vos-couleurs` | business | logo et couleurs du camping : image soignée |
| `gerant-moderation` | gérant | bannir depuis le signalement, tout modérer au même endroit |
| `statuts` | vacanciers | un camping qui vit et qui se voit |
| `quatre-langues` | business | interface en FR, EN, ES, NL pour la clientèle étrangère |
| `vue-ensemble` | gérant | présents, départs, groupes, inscriptions en un coup d’œil |
| `supprimer-message` | vacanciers | une messagerie qui se tient seule (supprimer, signaler, bloquer) |
| `urgences` | business | les numéros d’urgence dans chaque poche |
| `console-mobile` | gérant | tout l’espace gérant sur le téléphone |
| `rejoindre-un-groupe` | vacanciers | les vacanciers seuls trouvent leur bande |
| `statistiques-export` | business | connaître sa clientèle, exporter sa liste en CSV |
| `qr-code-entree` | gérant | l’affiche QR imprimable : tout le monde entre dès l’arrivée |
| `profil-carte-postale` | vacanciers | format 1:1 ; profil et points communs |
| `pub-en` | business | présentation en anglais |
| `animations-un-clic` | vacanciers | s’inscrire d’un appui, retrouver ses inscriptions |
| `sans-compte` | business | ni compte ni mot de passe : inscription sans l’accueil |
| `quitter-groupe` | vacanciers | quitter un groupe plutôt que couper les notifications |
| `pub-16x9` | business | présentation au format paysage, pour les rendez-vous |

Tous ont été rendus avec `nuit.sh --theme <slug>`, `QC OK`, planche regardée.
La carte (fonds satellite venus d’Internet) n’est dans aucun thème.

## Ligne éditoriale

- **Varier les sujets.** La rotation alterne côté gérant, côté vacanciers et
  bénéfice business ; deux nuits de suite ne parlent pas du même écran.
  Les petites fonctions comptent autant que les grandes : dupliquer une
  animation, changer la clé du QR code, la rubrique Urgences, l'export CSV.
- **Toujours finir sur la valeur pour le gérant** (phrase `valeur`) : temps
  gagné, moins de questions à l'accueil, animations préparées au plus juste,
  sécurité, image soignée. Une phrase concrète, pas un slogan.
- **Jamais de chiffre ni de client inventé** : pas de « +30 % », pas de
  « déjà adopté par… ». Les seuls nombres sont ceux de l'interface de démo.
- **Ne jamais dire que les messages sont traduits automatiquement** : seule
  l'interface existe en 4 langues (français, anglais, espagnol, néerlandais).
- Ne montrer que ce que la démo montre. La carte n'apparaît pas : ses fonds
  satellite viennent d'Internet et peuvent manquer pendant la capture.

## Contrôle avant livraison

1. `qc.txt` dit `QC OK`.
2. Regarder `planche.jpg` : textes lisibles et non coupés, vrais écrans,
   pas d'écran vide ou figé, fin avec le logo et « Demandez une démonstration ».
3. Relire `legende` : aucun chiffre ni client inventé, rien sur une
   fonctionnalité absente (les messages ne sont pas traduits automatiquement).

Si l'un des trois échoue, ne rien livrer : réessayer une fois avec le thème du
lendemain (`--date <demain>`), sinon s'arrêter et dire précisément ce qui ne va
pas.

## Livrer dans la Vidéothèque

1. Lire la Vidéothèque une fois : outil Artifact, `action: "read"`,
   `url` = la Vidéothèque.
2. Envoyer le MP4 : outil Artifact, `url` = la Vidéothèque, `file_path` = le
   MP4, `asset: true`. Noter l'`id` renvoyé.
3. Écrire la fiche : outil ArtifactData, `action: "set"`, `collection: "videos"`,
   `doc_id` = celui de `fiche.json`, avec les champs `titre`, `date`
   (AAAA-MM-JJ), `format` (« 9:16 », « 1:1 » ou « 16:9 »), `duree` (secondes),
   `langue` (« FR », « EN »…), `theme`, `asset_id`, `asset_url` (`/_blob/<id>`),
   `legende`. Modèle : le document `2026-10-03-creer-un-groupe`.

Rien n'est publié sur un réseau social : Johan publie lui-même.
