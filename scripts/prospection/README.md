# Prospection : brouillons Infomaniak

Les deux scripts créent des **brouillons** dans la boîte contact@campconnect.fr par le
scénario Make 9909743. Ils n'envoient rien : Johan relit et envoie lui-même.

- `brouillons_du_jour.py MMJJ AAAA-MM-JJ` : premier mail des campings ajoutés le matin
  (fiches exportées du fichier de prospects dans `crm-MMJJ/prospects/`).
- `relances_du_jour.py AAAA-MM-JJ <prospects> <relances> [5] [--essai]` : relance J+4
  (« en une phrase ») puis mail de clôture J+15, 5 par jour au maximum. L'état est gardé
  dans la collection `relances` du fichier de prospects. `--essai` affiche sans rien créer.

La clé et l'URL du webhook ne sont **jamais** dans le dépôt : elles sont lues dans
`cle-brouillon.txt` et `hook-brouillon.txt` à côté du script (ou dans les fichiers
désignés par `CLE_BROUILLON_FICHIER` et `HOOK_BROUILLON_FICHIER`). Si elles sont perdues,
les reprendre dans le scénario Make 9909743 (filtre du module 2 et adresse du webhook).
