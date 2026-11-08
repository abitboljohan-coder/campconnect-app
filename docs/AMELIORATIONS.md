# Amélioration continue

Chaque dimanche à 22 h 21 (heure de Paris), la routine « 0⃣ Direction · Amélioration
continue » relit la semaine. Elle rassemble les points négatifs et en déduit 1 à 3
améliorations, chacune confiée à un pôle. Elle applique elle-même celles qui sont sûres,
consigne tout ici, puis envoie à Johan un résumé court.

## Mission du directeur (fixée par Johan le 28/10/2026)

Deux objectifs, par ordre de priorité :

1. **Ramener le plus de prospects possible.** Mesures :
   - nouveaux campings dans le fichier ;
   - réponses ;
   - « oui » ;
   - appels utiles ;
   - aperçus demandés ;
   - campings clients.
2. **Faire croître les vues et les impressions de CampConnect.** Mesures :
   - vues TikTok et Instagram ;
   - impressions LinkedIn ;
   - visiteurs du site et demandes de démo ;
   - appareils actifs de l'app dans Supabase.

Chaque dimanche, il part des analyses mises en place par Johan :

- les relevés du PC (mails, Google Analytics, Play Console, réseaux) ;
- le fichier de prospects ;
- la Vidéothèque ;
- Supabase ;
- le tableau de bord.

Il transmet ensuite chaque conclusion au pôle concerné, en l'écrivant là où ce pôle la
lira à son prochain passage :

| Pôle | Où il écrit |
|---|---|
| Prospection | prompts des routines campings, brouillons et appels ; modèles de mail ; `.claude/agents/commercial.md` |
| Social & contenu | « Ce qui marche en ce moment » en tête de `docs/CAMPAGNES.md` ; prompt de la routine vidéo ; `.claude/agents/creative-studio.md` |
| Produit | une proposition à Johan (jamais de changement de `src/` sans lui) |
| Opérations | prompts des routines ; tableau de bord : chiffres `kpi/global` et dates clés de la collection `agenda` ({date, heure?, titre}), à ajouter ou retirer chaque dimanche (retours de congés, relances à faire, salons, décisions à prendre) |

Une conclusion qui n'est écrite nulle part n'est pas transmise.

## Règles du directeur

- Il part des preuves : CRM, Make, Vidéothèque, Supabase, routines et ce que Johan envoie.
  Il n'invente rien. Quand une source manque, il l'écrit.
- Il ne change qu'une seule chose à la fois par pôle, pour qu'on puisse mesurer l'effet
  la semaine suivante.
- Pour les mails, il ne juge une version qu'après au moins 50 envois de cette version
  (environ deux semaines). En dessous, 0 ou 1 réponse ne prouve rien : il attend au lieu
  de changer.
- **Pas de retour, on change.** Si une version de mail atteint 50 envois sans aucune
  réponse positive, le directeur la remplace la semaine même. Il change d'objet,
  d'accroche, de ciblage (départements, taille de camping, gérant nommé) ou de rythme
  (plus d'appels, moins de mails), une chose à la fois. Il note dans le journal ce qu'il
  essaie et pourquoi.
- **Les vues décident du contenu.** Chaque dimanche, il relit les vues par vidéo et met à
  jour « Ce qui marche en ce moment » dans `docs/CAMPAGNES.md` : on refait ce qui a le
  plus de vues, on arrête ce qui en a le moins.
- Les vidéos produites par la routine (sessions sans droit d'écriture sur le dépôt) ne
  sont notées que dans la Vidéothèque. Chaque dimanche, il reporte celles de la semaine
  dans `docs/CAMPAGNES.md`.
- Il relit la semaine précédente et tranche pour chaque changement : on le garde, on
  l'ajuste ou on l'annule.
- Il relit `docs/IDEES.md` (les idées de Johan à garder) et en rappelle une à Johan quand
  le moment s'y prête.
- Il applique seul ce qui est sûr :
  - les prompts des routines ;
  - `.claude/agents/*.md` ;
  - `docs/CAMPAGNES.md` ;
  - les modèles de mail ;
  - la cadence.
- Il propose sans appliquer, et attend l'accord de Johan, pour :
  - toute dépense ;
  - un nouveau canal ;
  - le prix ou l'offre ;
  - une suppression ;
  - toute modification de `src/`.
- Il n'assouplit jamais une règle de sécurité ou de conduite :
  - aucun mail envoyé, seulement des brouillons ;
  - LinkedIn sur la page CampConnect uniquement ;
  - rien d'inventé ;
  - le cloisonnement par camping ;
  - la règle n° 1 vidéo.

## Les données de la semaine

Trois tâches planifiées de Claude Desktop, sur le PC de Johan, relèvent automatiquement
les chiffres le dimanche entre 21 h 07 et 21 h 47 :

- les mails ;
- Google Analytics et les stores ;
- Instagram, TikTok et LinkedIn.

Elles les déposent dans des Google Docs « CampConnect Relevé … ». Installation et
consignes : `docs/RELEVES_AUTOMATIQUES.md`. Il suffit que le PC soit allumé, avec Claude
Desktop et Chrome ouverts.

Johan n'a plus qu'à écrire, s'il y en a :

- une phrase par appel passé ;
- les rencontres (salon, ami, gérant) ;
- ce qui lui a fait perdre du temps.

## Objectif vues (demande de Johan, 28/10/2026)

Faire monter les vues chaque semaine. Chaque dimanche, le directeur :

1. Compare les vues de la semaine, réseau par réseau, au point de départ et à la
   semaine précédente.
2. Repère les 2 vidéos qui ont le mieux marché et les 2 qui ont le moins marché, et dit
   pourquoi : accroche, format, sujet, durée, temps de visionnage.
3. Écrit en tête de `docs/CAMPAGNES.md` une rubrique « Ce qui marche en ce moment » :
   - formats à refaire ;
   - formats à abandonner ;
   - accroches gagnantes.

   La routine vidéo la lit avant chaque production. Les vidéos de la semaine suivante
   suivent donc les gagnantes.
4. Change une seule chose à la fois : la cadence, l'heure de publication, la longueur
   ou le type d'accroche.

**Point de départ (relevé du 28/10, 7 jours)**

| Réseau | Chiffres |
|---|---|
| TikTok | 742 vues, 3 nouveaux abonnés, 12 abonnés |
| Instagram | 334 vues, 180 comptes touchés, 19 abonnés |
| LinkedIn (page) | 43 impressions, 4 abonnés ; vidéos du 25 et 27/10 à 4 et 1 impressions |
| Site | 6 visiteurs, 0 demande de démo |

Meilleure vidéo : « la sonnette de l'accueil en août » (humour, 300 vues TikTok et 411
vues Instagram).

**Décision de Johan (28/10/2026)**

- Jamais de publication sur son profil LinkedIn personnel.
- Pas de publication automatique sur Instagram ou TikTok sans un son tendance qui
  colle à la vidéo.

Ces deux règles ne se reproposent pas.

**Instagram et TikTok : publication manuelle par Johan (28/10/2026)**

Le circuit Higgsfield est abandonné : il n'était qu'à moitié automatique et ne permettait
pas de choisir la couverture. Ne plus le proposer.

À la place, chaque vidéo de la Vidéothèque se télécharge sans musique, avec sa légende
prête à copier. Johan publie lui-même et choisit dans l'app le son tendance et la
couverture.

**App Store Connect (28/10/2026)** : Johan ne veut plus s'en occuper. Le relevé « Site et
stores » affichera « connexion demandée » pour Apple. C'est normal : ne pas le signaler et
ne jamais lui demander de se reconnecter. Les installations se suivent avec Google Play
et Supabase :

- nouveaux vacanciers (hors démos) ;
- appareils par plateforme, à relever chaque dimanche :
  `select platform, count(distinct device_id), count(*) filter (where created_at > now()-interval '7 days') from push_tokens group by platform`.

Point de départ au 28/10 : 4 iPhone et 1 Android, aucun nouveau depuis le 16/10.

Supabase ne voit que les personnes qui ouvrent l'app et acceptent les notifications. Une
installation jamais ouverte n'y apparaît pas.

**Suivi des publications** : dans la Vidéothèque, Johan coche « J'ai posté sur
Instagram » ou « J'ai posté sur TikTok » (champs `publie_instagram` et `publie_tiktok`).
Une vidéo avec `en_attente` est mise de côté : elle n'est jamais publiée et elle est
refaite. Chaque dimanche, le directeur compte combien de vidéos sont publiées par réseau
et combien attendent d'être postées.

## Propositions en attente

- **Offre pilote dans la relance J+4** (proposée le 28/10/2026, Johan : « on laisse, on
  comparera après »). Les mails restent tels quels pour l'instant, et cette période sert
  de point de comparaison.
  - **Mesure** : chaque dimanche, le taux de réponse aux relances « en une phrase »
    actuelles.
  - **Décision** : au bout de deux semaines (revue du 8 novembre), soumettre à Johan les
    chiffres et le passage à la relance pilote :
    > « Pour la saison 2027, je cherche 3 à 5 campings pilotes, à qui CampConnect sera
    > offert toute la saison (ensuite, vous décidez)… Répondez juste "pilote". »
  - Ne pas l'appliquer sans son accord.

## Ce qui marche

*Rubrique alimentée chaque dimanche par la revue de direction : taux de réponse et taux de oui par angle, par objet, par type de mail, par région et par taille de camping, avec le nombre d'envois de chaque groupe. Première mesure : à partir de 15 envois par angle (fin novembre 2026).*

État au 5/11/2026 : 0 réponse positive sur 183 envois. Réponses reçues : 1 STOP (Les Ourmes), 2 refus parce qu'une appli ou un livret existe déjà (Le Tiradou, Le Picard), 2 absences.

## Journal

Le plus récent est en haut.

### Relevés du dimanche 8/11/2026 (lancés à la main par Johan)

- Site (1–7/11) : 19 visiteurs (+27 %), 38 sessions, 3 clics « demande de démo », 3 clics « télécharger l'app », 1 formulaire (« Jojinours camping », probablement un test). Sources : direct 25, Google 10.
- Play Store : 2 installations, 1 désinstallation, 0 plantage, 0 avis.
- TikTok : 1,7 k vues (−28 %), +3 abonnés (15). Meilleure vidéo : « Le camping où tu connais personne le 1er jour… » (776 vues), mais 2,65 s de visionnage moyen et 0,9 % vont au bout : l'accroche décroche.
- Instagram : 85 comptes touchés, 282 vues. Meilleur Reel : le même thème (« POV : t'arrives et tu connais personne », 312 vues).
- LinkedIn : 61 impressions sur la semaine, 0 commentaire, 4 abonnés.
- Mails : relevé non fait (onglet Infomaniak absent). Le bilan des 50 envois reste en attente.
- Décision pôle 2 : le thème « tu connais personne » gagne sur TikTok et sur Instagram, on le garde. À corriger : la première seconde (texte choc dès l'image 1) et des vidéos plus courtes (10–15 s).
- Piste : message Instagram de Camping Canoë Gorges du Tarn (réponse automatique), à relancer par téléphone au 05 65 59 85 17.

### Bilan des 50 envois, dimanche 8/11/2026 (routine « Bilan mails 50 envois », reportée du 4/11)

- Version « question sur une animation + aperçu » : **non mesurable**. Aucune fiche n'a encore de `version_mail` (suivi ajouté le 8/11). Le seul envoi daté depuis le 28/10 avec un type renseigné est 1 (type « générique »).
- Envois réels : **donnée manquante**. Les brouillons partent depuis l'Infomaniak de Johan, à la main. Le relevé Mails de dimanche 8/11 n'existe pas dans Drive (la tâche était en pause, « appareil absent »).
- Réponses positives : 0. Seule réponse notée au total : 1 « perdu » (refus).
- Seuil de 50 envois confirmés : **non atteint**, donc on garde. Aucun changement de mail.
- Prochaine étape : relevé Mails à réactiver (PC allumé dimanche 21h), puis rebilan quand le nombre d'envois confirmé atteint 50.

 Chaque revue contient :

- les chiffres de la semaine ;
- les points négatifs et leur cause ;
- les décisions appliquées, par pôle ;
- les propositions en attente de Johan ;
- ce qu'on mesure la semaine suivante.

### Revue du dimanche 8 novembre 2026 (faite à la demande de Johan, avant les relevés)

**Chiffres de la semaine (2 au 8/11)**

- 17 nouveaux campings (objectif 50), 17 premiers mails et 20 relances en brouillon (37), Make : 0 échec.
- Réponses : 2, deux « déjà équipé » (Le Tiradou : appli Flower ; Le Picard : livret numérique). Aucun oui. Clients : 0.
- Total : 230 fiches, ~175 mails partis, 6 réponses depuis le début (1 « pourquoi pas », 2 STOP, 3 refus).
- Contact chaud : Les Étangs Mina, recommandé par Samy (mail du 5/11) ; appel prévu le 10/11 au 05 46 22 82 61 si pas de réponse.
- Envois réels de la semaine : donnée manquante (Johan envoie à la main ; relevé Mails non fait, voir plus bas).

**Ce qui a marché** : la recommandation (Mina, via Samy) est le seul contact chaud de la semaine. Aucun angle mesurable (2 envois avec angle).

**Points négatifs et cause**

1. **La recherche de campings tourne au ralenti** (17 au lieu de 50). Cause prouvée : les routines créées par Johan tournent dans l'environnement cloud « Default », réseau limité ; les sites des campings y sont bloqués (« outside the session's allowed network domains »). L'environnement « Par défaut » est en accès complet.
2. **La phrase personnalisée n'entrait pas dans les mails** jusqu'au 6/11 (le script cherchait « Bonjour » en tête, alors que la tête est « Objet : »). Corrigé le 6/11.
3. **Relevés du PC** : « Relevé 1 Mails » et « Relevé 2 Site et stores » ont été mis en pause le 8/11 (« appareil absent ») : le PC n'était pas connecté à 21 h. Aucun relevé depuis le 2/11.
4. **Objection « déjà équipé »** : 3 refus sur 6 réponses ; Le Tiradou et 15 fiches du fichier sont dans le réseau Flower.
5. Revue du 6/11 (test de la routine) : push GitHub impossible, son journal est resté dans le tableau de bord (taches/direction-journal) ; sa décision (suivi `version_mail` + `angle`) est réappliquée ici.

**Décisions appliquées**

- Pôle 4 : `brouillons_du_jour.py` écrit `version_mail` et `angle` dans chaque fiche au moment du brouillon (suivi seulement, pas de changement de texte).
- Pôle 4 : routines en double coupées le 6/11 (brouillons et revue) ; celles de Johan, avec connecteurs, restent.
- Pôle 1 : aucun changement de mail (moins de 50 envois confirmés de la version actuelle).

**Propositions en attente de Johan**

- Passer l'environnement « Default » en accès réseau complet (ou mettre la routine de recherche sur « Par défaut ») : condition pour revenir à 10 campings par jour.
- Passer la routine de recherche de 5 à 10 campings par jour.
- Campings Flower : ajouter une phrase « ça complète l'app Flower » ou les mettre de côté.
- Réactiver les relevés 1 et 2 et laisser le PC allumé le dimanche soir.

**À mesurer la semaine prochaine** : nombre de campings trouvés par jour après le changement de réseau, envois par version et par angle, réponse de Mina.

### Revue du dimanche 1er novembre 2026

**Chiffres de la semaine (25/10 → 31/10)**

- Prospection : 213 campings dans le fichier, 63 mails envoyés dans la semaine (209 au
  total). Réponses : 1 STOP (Les Ourmes), 3 absences (Kérantérec jusqu'au 5/11, Cabestan
  ×2 jusqu'au 1/11). Aucune réponse positive, aucune erreur d'adresse, 0 brouillon restant.
- Réseaux : TikTok 2 400 vues (+106 %), 1 abonné de plus (12) ; Instagram 431 vues,
  196 comptes touchés ; LinkedIn page 25 impressions (−48 %), 4 abonnés.
- Site : 16 visiteurs (contre 3), dont 7 venus d'assistants IA et 7 de Google ; /tarifs.html
  vue 11 fois ; 4 clics vers le contact (événement `demande_demo`, qui ne compte que le clic
  vers #contact, pas une demande envoyée) ; 0 demande de démo reçue par mail.
- App : 2 installations Android, 1 désinstallation ; Supabase : 0 nouveau vacancier réel,
  0 candidature, 1 nouvel appareil Android (6 appareils au total : 4 iPhone, 2 Android).
- Vidéos : 4 publiées sur LinkedIn (25, 27, 29, 30/10) ; 3 nouvelles vidéos validées
  (doudou, piscine, poubelles), 2 mises de côté et remplacées. Make : aucun échec.
- Démo : le cron `rafraichir-demo` a réussi 7 fois sur 7.

**Points négatifs et cause**

1. **LinkedIn ne touche personne** : 1 à 5 impressions par vidéo. Cause : la page n'a que
   4 abonnés, et la file publiait les vidéos les plus anciennes ; les 3 vidéos faites selon
   les nouvelles règles n'étaient pas encore passées.
2. **Les relevés ont échoué au premier essai** : quand le directeur les lance à la main
   depuis le cloud, ils ne tournent pas sur le PC de Johan (pas d'approbation de l'appareil),
   donc sans Chrome. Seuls les passages programmés tournent sur le PC. Ils ont marché à
   21 h.
3. **Le temps de visionnage TikTok est court** (2,1 à 2,2 s sur les deux meilleures vidéos).
4. **Aucune réponse positive aux mails** : la nouvelle version (question sur une animation,
   depuis le 28/10) n'a que 30 envois. Sous la barre des 50 : on attend.
5. Les cases « posté sur Instagram / TikTok » de la Vidéothèque ne sont pas cochées, alors
   que des vidéos sont en ligne : on ne peut pas suivre le stock à poster.

**Décisions appliquées**

- Pôle 2 : la routine LinkedIn publie d'abord la vidéo la plus récente faite selon les
  règles n° 2 et n° 3 (avec storyboard), au lieu de la plus ancienne. Une seule variable.
- Pôle 2 : « Ce qui marche en ce moment » mis à jour dans `docs/CAMPAGNES.md` (première
  seconde = la situation en grand) ; vidéos de la semaine reportées.
- Pôle 1 : aucun changement de mail (30 envois de la nouvelle version, sous 50). Cabestan
  passé en « relance » au 3/11, gérant Laurent Devismes noté.
- Pôle 4 : horaires du dimanche décalés à la demande de Johan (rappel 20 h 37, relevés
  21 h 07 / 21 h 27 / 21 h 47, revue 22 h 21). Ne plus lancer les relevés à la main.
  Agenda : Cabestan au 3/11.

**Propositions à Johan**

- Inviter ses relations LinkedIn à suivre la page CampConnect (bouton gratuit « Inviter à
  suivre » de la page). Rien n'est publié sur son profil ; c'est le seul moyen rapide de
  sortir des 4 abonnés.
- Offre pilote : revue toujours prévue le 8/11.

**À mesurer la semaine prochaine** : impressions LinkedIn par vidéo (objectif : plus de 5),
temps moyen TikTok (objectif : plus de 2,5 s), réponses à la version « question sur une
animation » une fois 50 envois atteints.


### Bilan mails, mercredi 4/11/2026 (check-up demandé par Johan)

- **Envois de la version actuelle** (« question sur une animation + je vous prépare un aperçu », depuis le 28/10) : 25 brouillons créés dans le fichier de prospects, et 30 mails partis du 28 au 30/10 d'après le relevé du 1/11. Le relevé du 4/11 (PC de Johan, 21 h 07) était absent à 21 h 46 : les envois du 2 au 4/11 ne sont pas recoupés. Relances J+4 : 20 fiches dans la collection « relances » (5 créées aujourd'hui).
- **Réponses depuis le 28/10** : aucune réponse positive, aucune question ni demande d'aperçu. Un STOP (Les Ourmes, avant le 28/10), des absences (Kérantérec jusqu'au 5/11, Cabestan jusqu'au 1/11).
- **Décision : on garde le mail tel quel.** Moins de 50 envois confirmés de cette version : la règle « pas de retour, on change » ne s'applique pas encore. On ne change rien aujourd'hui.
- **Bilan reporté au dimanche 8/11**, après les relevés de 21 h, une fois les envois du 2 au 7/11 comptés. Si toujours aucune réponse positive à 50 envois : changer UNE seule chose (l'objet, ou l'accroche, ou le ciblage), jamais l'offre ni le prix.
