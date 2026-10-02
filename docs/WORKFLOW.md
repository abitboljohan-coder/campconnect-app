# Le workflow CampConnect avec Claude

Comment le projet tourne au quotidien : qui fait quoi, quand, et où trouver
le résultat. Mis en place le 2 octobre 2026.

**La règle de tout le système : rien ne part au nom de Johan sans lui.**
Claude prépare (emails, posts, relances, versions), Johan valide et envoie.

## Le fichier de prospects

Page privée : **https://claude.ai/artifact/VgpzkinKBa3Ym831cmX1P4**

- **Aujourd'hui** : les relances et appels du jour, et les nouveaux campings
  à contacter.
- **Tous les campings** : le pipeline, par étape.
- **Brouillons** : posts LinkedIn, relances préparées, bilans.
- **Ajouter** : un camping rencontré ailleurs (salon, recommandation).

Après chaque contact, Johan ouvre la fiche du camping, change l'étape, fixe
la date de la prochaine action et note ce qui s'est dit. Les routines s'en
servent pour préparer la suite.

Étapes : À contacter → Email envoyé → Relancé → Appelé → Démo faite →
Pilote ✓ (ou « Pas pour l'instant »).

Données : collections `prospects` et `brouillons` de la base de l'artifact
(outil ArtifactData). Champs d'un prospect : `nom, ville, departement,
etoiles, emplacements, telephone, email, site, etape, prochaine_date
(AAAA-MM-JJ), prochaine_action, notes, fiche, accroche, email_brouillon,
source, cree_le, maj_le`. Brouillon : `type (linkedin | email | bilan |
veille), titre, date, texte`.

## Les routines (heure de Paris)

| Quand | Routine | Ce qu'elle produit |
|---|---|---|
| Chaque jour, 6 h 52 | Santé de l'app | « ✅ Tout va bien », ou l'alerte et quoi faire |
| Lundi, 8 h 41 | 5 prospects de la semaine | 5 campings normands qualifiés, avec fiche, accroche et email |
| Mardi → vendredi, 8 h 47 | Relances du jour | Les emails et appels du jour, prêts (onglet Brouillons) |
| Mercredi, 9 h 53 | Post LinkedIn | Un post pour la page CampConnect (onglet Brouillons) |
| Vendredi, 17 h 48 | Bilan de la semaine | Chiffres, ce qui a marché, les 3 priorités de lundi |

Chaque routine envoie une notification sur le téléphone de Johan à la fin.
On les gère sur claude.ai, dans la section Routines : les mettre en pause,
changer l'heure, les relancer à la main.

**La routine Santé a besoin des connecteurs Supabase et Vercel.** Ils
s'ajoutent depuis claude.ai, dans la section Routines, en modifiant cette
routine. Sans eux, elle ne peut rien vérifier et le dit.

## Les commandes (dans une session Claude Code)

| Commande | Usage |
|---|---|
| `/commercial` | Préparer un appel, répondre à une objection, qualifier un camping |
| `/livraison` | Sortir une nouvelle version sur l'App Store et Google Play |

## L'équipe d'agents

Neuf agents spécialisés vivent dans `.claude/agents/`. Dans une session Claude
Code, il suffit de dire par exemple « demande au testeur de vérifier la
version », « que la sécurité audite les signalements », ou « le support
regarde ce message de Charline ». Chacun connaît les règles et les pièges du
projet dans son domaine.

| Agent | Rôle | Ce qu'il modifie |
|---|---|---|
| `developpeur` | Corrige et construit l'app | Le code, jusqu'à `main` |
| `testeur` | Tests, build, écrans à 320/375/402 px | Les petits défauts qu'il trouve, et les tests |
| `data` | Base Supabase, stats, démo, crons | La base, par migration testée |
| `securite` | RLS, cloisonnement, secrets, dépendances | Les failles qu'il a prouvées |
| `commercial` | Prospects, appels, emails, objections | Le fichier de prospects |
| `marketing` | LinkedIn, stores, site, vidéo | Les textes du projet (fiches, site) |
| `operations` | Livraison, Xcode Cloud, surveillance | Versions, livraisons, routines |
| `support` | Retours utilisateurs : diagnostic et réponse | La correction, quand la cause est claire |
| `designer` | UI/UX : 3 directions en images, puis la refonte choisie | Le code de l'écran choisi |

Tous peuvent modifier. Aucun ne fait sans l'accord de Johan ce qui est
irréversible ou public : supprimer des données, publier sur un store ou un
réseau social, envoyer un email, dépenser de l'argent.

Un enchaînement type pour un bug signalé par un testeur : `support`
(diagnostic) → `developpeur` (correction) → `testeur` (vérification) →
`securite` si la correction touche aux données → `operations` (livraison).

## Le circuit produit

1. Johan décrit le problème dans une session Claude Code (une capture ou une
   vidéo suffit).
2. Claude corrige, teste, fusionne dans `main`.
3. Xcode Cloud envoie sur TestFlight ; la version s'affiche en bas du Profil.
4. Pour les stores : `/livraison`.

## La semaine type de Johan (environ 1 h par jour)

- **Lundi** : relire et envoyer les 5 emails (15 min).
- **Mardi → vendredi** : 3 à 5 relances ou appels (45 min), puis mettre à
  jour les fiches.
- **Mercredi** : publier le post LinkedIn (2 min).
- **Vendredi** : lire le bilan.
