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

`studio-video/nuit/themes.json`. Le thème du jour est
`themes[(jours depuis rotation_depuis) % nombre de thèmes]`. Chaque thème décrit
une accroche, 1 à 3 plans (écran de la démo + gestes) et sa langue et son format.
**Un thème nouveau ou modifié se teste à la main** (`--theme <slug>`) en
regardant la planche avant d'entrer dans la rotation.

Au 3 octobre 2026, seul `creer-un-groupe` a été produit et vérifié de bout en
bout. Les autres sont décrits mais pas encore rendus : la routine les
rencontrera au fil des nuits et le signalera s'ils échouent.

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
