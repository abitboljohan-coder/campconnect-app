-- ============================================================================
-- CAMPING DE DÉMONSTRATION — « Les Flots Bleus »
-- ----------------------------------------------------------------------------
-- Camping vitrine, à trois usages :
--   1. démonstration commerciale devant un gérant de camping ;
--   2. lien de revue pour Apple et Google (App Review / App Access) ;
--   3. captures d'écran des fiches Store.
--
-- Le script est IDEMPOTENT : il purge puis recrée tout le contenu du camping
-- « les-flots-bleus ». Relancez-le avant chaque démo ou chaque soumission :
-- les animations sont datées relativement à aujourd'hui, donc l'agenda paraît
-- toujours vivant.
--
-- Aucune autre donnée n'est touchée : tout est filtré sur ce seul camping.
--
-- Utilisation : Supabase → SQL Editor → coller → Run.
-- Lien de revue résultant : https://app.campconnect.fr/join/les-flots-bleus
-- ============================================================================

DO $$
DECLARE
  v_camping uuid;
  -- Argelès-sur-Mer, littoral méditerranéen
  v_lat  numeric := 42.54050;
  v_lng  numeric := 3.03330;

  g_petanque uuid; g_rando uuid; g_apero uuid; g_surf uuid; g_kids uuid; g_marche uuid;
  a_tournoi uuid; a_paella uuid; a_aquagym uuid; a_concert uuid; a_marche uuid; a_cinema uuid;

  v_julie uuid; v_marc uuid; v_sophie uuid; v_tom uuid; v_lea uuid;
  v_karim uuid; v_nadia uuid; v_hugo uuid;
BEGIN

  -- ══════════════════════════════════════════════════════════════════════════
  -- 1. Le camping
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO campings (slug, nom, description, couleur_principale, couleur_secondaire)
  VALUES (
    'les-flots-bleus',
    'Camping Les Flots Bleus',
    'Les pieds dans l''eau, à 200 m de la plage d''Argelès-sur-Mer.',
    '#0e7490',   -- bleu lagon
    '#134e4a'    -- vert profond
  )
  ON CONFLICT (slug) DO UPDATE
    SET nom                = EXCLUDED.nom,
        description        = EXCLUDED.description,
        couleur_principale = EXCLUDED.couleur_principale,
        couleur_secondaire = EXCLUDED.couleur_secondaire;

  SELECT id INTO v_camping FROM campings WHERE slug = 'les-flots-bleus';

  -- ── Purge du contenu précédent (ce camping uniquement) ────────────────────
  -- L'ordre respecte les dépendances ; les ON DELETE CASCADE font le reste.
  DELETE FROM messages   WHERE groupe_id    IN (SELECT id FROM groupes    WHERE camping_id = v_camping);
  DELETE FROM groupes    WHERE camping_id = v_camping;
  DELETE FROM animations WHERE camping_id = v_camping;
  DELETE FROM vacanciers WHERE camping_id = v_camping AND device_id LIKE 'demo-%';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 2. Livret d'accueil
  -- ══════════════════════════════════════════════════════════════════════════
  UPDATE campings SET infos = '[
    {"id":"plage",     "emoji":"🏖️","titre":"Accès plage",       "contenu":"Accès direct par l''allée des Tamaris, 200 m.\nPlage surveillée 10h – 19h en juillet-août.\nDouches et rinçage à l''entrée du camping."},
    {"id":"piscine",   "emoji":"🏊","titre":"Espace aquatique",  "contenu":"Bassin principal chauffé 9h – 20h.\nPataugeoire 9h – 19h.\nToboggans 11h – 13h et 15h – 18h.\nShort de bain interdit."},
    {"id":"reception", "emoji":"🏠","titre":"Réception",         "contenu":"Basse saison : 9h – 12h et 14h – 18h.\nJuillet-août : 8h – 20h en continu.\nUrgence nuit : 06 12 34 56 78."},
    {"id":"wifi",      "emoji":"📶","titre":"Wi-Fi",             "contenu":"Réseau : FlotsBleus-Invites\nCode : lagon2026\nDébit renforcé près de la réception et du snack."},
    {"id":"snack",     "emoji":"🍺","titre":"Bar & snack Le Ponton","contenu":"Petit-déjeuner 8h – 10h30.\nRestauration continue 12h – 22h.\nBar jusqu''à minuit, 1h les soirs d''animation.\nPizzas à emporter sur commande."},
    {"id":"epicerie",  "emoji":"🥖","titre":"Épicerie & dépôt de pain","contenu":"Ouverte 8h – 12h30 et 16h – 19h30.\nPain et viennoiseries sur réservation la veille avant 19h."},
    {"id":"laverie",   "emoji":"👕","titre":"Laverie",           "contenu":"Bloc sanitaire B, 7h – 22h.\nLave-linge 4 € · sèche-linge 3 €.\nJetons à la réception et au bar."},
    {"id":"tri",       "emoji":"♻️","titre":"Tri & poubelles",   "contenu":"Point tri à l''entrée et près du bloc C.\nVerre : conteneur du parking.\nCollecte tous les matins à 7h30."},
    {"id":"animaux",   "emoji":"🐾","titre":"Animaux",           "contenu":"Acceptés tenus en laisse, 4 €/nuit.\nInterdits à l''espace aquatique et au snack.\nSac de ramassage disponible à la réception."},
    {"id":"services",  "emoji":"🚿","titre":"Services",          "contenu":"Aire de vidange camping-car à l''entrée.\nBornes de recharge électrique sur le parking visiteurs.\nLocation de vélos à la réception, 12 €/jour."},
    {"id":"urgences",  "emoji":"🚨","titre":"Urgences",          "contenu":"Réception : 04 68 81 00 00\nSAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112\nPharmacie la plus proche : 900 m, av. de la Plage."}
  ]'::jsonb
  WHERE id = v_camping;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 3. Carte : centre, périmètre et points d'intérêt
  -- ══════════════════════════════════════════════════════════════════════════
  -- Le centre sert au contrôle de présence (rayon de 800 m dans Onboarding.jsx).
  UPDATE campings SET carte_config = jsonb_build_object(
    'center', jsonb_build_object('lat', v_lat, 'lng', v_lng),
    'lat', v_lat,
    'lng', v_lng,
    'perimeter', jsonb_build_array(
      jsonb_build_array(v_lat + 0.0016, v_lng - 0.0020),
      jsonb_build_array(v_lat + 0.0016, v_lng + 0.0021),
      jsonb_build_array(v_lat - 0.0015, v_lng + 0.0021),
      jsonb_build_array(v_lat - 0.0015, v_lng - 0.0020)
    ),
    'pins', jsonb_build_array(
      jsonb_build_object('ref_id','lieu_accueil',  'ref_type','lieu','label','Réception',        'emoji','🏠','color','#60a5fa','lat', v_lat + 0.0012, 'lng', v_lng - 0.0014),
      jsonb_build_object('ref_id','lieu_piscine',  'ref_type','lieu','label','Espace aquatique', 'emoji','🏊','color','#60a5fa','lat', v_lat + 0.0004, 'lng', v_lng - 0.0004),
      jsonb_build_object('ref_id','lieu_snack',    'ref_type','lieu','label','Bar Le Ponton',    'emoji','🍺','color','#60a5fa','lat', v_lat + 0.0007, 'lng', v_lng + 0.0003),
      jsonb_build_object('ref_id','lieu_epicerie', 'ref_type','lieu','label','Épicerie',         'emoji','🥖','color','#60a5fa','lat', v_lat + 0.0009, 'lng', v_lng - 0.0008),
      jsonb_build_object('ref_id','lieu_petanque', 'ref_type','lieu','label','Terrain de pétanque','emoji','🎯','color','#60a5fa','lat', v_lat - 0.0006, 'lng', v_lng + 0.0011),
      jsonb_build_object('ref_id','lieu_sanit_a',  'ref_type','lieu','label','Sanitaires A',     'emoji','🚿','color','#60a5fa','lat', v_lat + 0.0002, 'lng', v_lng - 0.0013),
      jsonb_build_object('ref_id','lieu_sanit_b',  'ref_type','lieu','label','Sanitaires B',     'emoji','🚿','color','#60a5fa','lat', v_lat - 0.0009, 'lng', v_lng - 0.0002),
      jsonb_build_object('ref_id','lieu_laverie',  'ref_type','lieu','label','Laverie',          'emoji','👕','color','#60a5fa','lat', v_lat - 0.0008, 'lng', v_lng - 0.0005),
      jsonb_build_object('ref_id','lieu_jeux',     'ref_type','lieu','label','Aire de jeux',     'emoji','🛝','color','#60a5fa','lat', v_lat - 0.0003, 'lng', v_lng + 0.0006),
      jsonb_build_object('ref_id','lieu_plage',    'ref_type','lieu','label','Accès plage',      'emoji','🏖️','color','#60a5fa','lat', v_lat - 0.0014, 'lng', v_lng + 0.0016),
      jsonb_build_object('ref_id','lieu_parking',  'ref_type','lieu','label','Parking',          'emoji','🅿️','color','#60a5fa','lat', v_lat + 0.0014, 'lng', v_lng - 0.0018)
    )
  )
  WHERE id = v_camping;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 4. Vacanciers fictifs
  -- ══════════════════════════════════════════════════════════════════════════
  -- device_id préfixé « demo- » : c'est ce qui permet à la purge du haut de les
  -- distinguer d'un vrai vacancier, et à purge_vacanciers_partis() de ne pas
  -- les balayer (date_depart volontairement lointaine).
  INSERT INTO vacanciers (camping_id, device_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, date_depart) VALUES
    (v_camping, 'demo-julie',  'Julie',  '🏄‍♀️', 'B12', '25-34', 'en couple',  ARRAY['surf','apéro','plage'],        CURRENT_DATE + 60),
    (v_camping, 'demo-marc',   'Marc',   '🚴',   'A04', '35-44', 'en famille', ARRAY['vélo','rando','pétanque'],     CURRENT_DATE + 60),
    (v_camping, 'demo-sophie', 'Sophie', '🧘‍♀️', 'C21', '45-54', 'entre amis', ARRAY['yoga','marché','lecture'],     CURRENT_DATE + 60),
    (v_camping, 'demo-tom',    'Tom',    '🎸',   'D08', '18-24', 'entre amis', ARRAY['musique','soirées','surf'],    CURRENT_DATE + 60),
    (v_camping, 'demo-lea',    'Léa',    '🏊‍♀️', 'B15', '25-34', 'en famille', ARRAY['natation','enfants','plage'],  CURRENT_DATE + 60),
    (v_camping, 'demo-karim',  'Karim',  '⚽',   'A17', '35-44', 'en famille', ARRAY['sport','pétanque','barbecue'], CURRENT_DATE + 60),
    (v_camping, 'demo-nadia',  'Nadia',  '📚',   'C03', '55+',   'en couple',  ARRAY['lecture','marché','rando'],    CURRENT_DATE + 60),
    (v_camping, 'demo-hugo',   'Hugo',   '🎣',   'D22', '45-54', 'seul',       ARRAY['pêche','vélo','nature'],       CURRENT_DATE + 60);

  SELECT id INTO v_julie  FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-julie';
  SELECT id INTO v_marc   FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-marc';
  SELECT id INTO v_sophie FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-sophie';
  SELECT id INTO v_tom    FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-tom';
  SELECT id INTO v_lea    FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-lea';
  SELECT id INTO v_karim  FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-karim';
  SELECT id INTO v_nadia  FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-nadia';
  SELECT id INTO v_hugo   FROM vacanciers WHERE camping_id = v_camping AND device_id = 'demo-hugo';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 5. Groupes spontanés
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO groupes (camping_id, titre, emoji, lieu, heure, actif) VALUES
    (v_camping, 'Apéro pétanque',        '🍹', 'Terrain de pétanque',    'Ce soir 18h30', true),
    (v_camping, 'Rando calanques',       '🥾', 'Départ parking',         'Demain 8h00',   true),
    (v_camping, 'Session surf débutants','🏄', 'Plage, poste 3',         'Demain 10h00',  true),
    (v_camping, 'Barbecue collectif',    '🍖', 'Aire de pique-nique',    'Samedi 19h30',  true),
    (v_camping, 'Jeux pour les enfants', '🛝', 'Aire de jeux',           'Tous les jours 17h', true),
    (v_camping, 'Marché de Collioure',   '🧺', 'Covoiturage parking',    'Mercredi 9h00', true);

  SELECT id INTO g_apero    FROM groupes WHERE camping_id = v_camping AND titre = 'Apéro pétanque';
  SELECT id INTO g_rando    FROM groupes WHERE camping_id = v_camping AND titre = 'Rando calanques';
  SELECT id INTO g_surf     FROM groupes WHERE camping_id = v_camping AND titre = 'Session surf débutants';
  SELECT id INTO g_petanque FROM groupes WHERE camping_id = v_camping AND titre = 'Barbecue collectif';
  SELECT id INTO g_kids     FROM groupes WHERE camping_id = v_camping AND titre = 'Jeux pour les enfants';
  SELECT id INTO g_marche   FROM groupes WHERE camping_id = v_camping AND titre = 'Marché de Collioure';

  INSERT INTO membres_groupes (groupe_id, vacancier_id) VALUES
    (g_apero, v_marc), (g_apero, v_julie), (g_apero, v_karim), (g_apero, v_tom), (g_apero, v_hugo),
    (g_rando, v_sophie), (g_rando, v_nadia), (g_rando, v_marc),
    (g_surf, v_julie), (g_surf, v_tom),
    (g_petanque, v_karim), (g_petanque, v_lea), (g_petanque, v_marc), (g_petanque, v_julie),
    (g_kids, v_lea), (g_kids, v_karim),
    (g_marche, v_nadia), (g_marche, v_sophie)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 6. Conversations
  -- ══════════════════════════════════════════════════════════════════════════
  -- created_at explicites : les messages doivent apparaître dans l'ordre et
  -- paraître récents, quel que soit le jour où le script est relancé.
  INSERT INTO messages (groupe_id, auteur_id, contenu, created_at) VALUES
    (g_apero, v_marc,  'Salut à tous ! Je propose une partie ce soir vers 18h30, niveau débutant bienvenu 😄', now() - interval '4 hours'),
    (g_apero, v_julie, 'Partante ! J''apporte les chips et une bouteille de rosé 🍷', now() - interval '3 hours 40 minutes'),
    (g_apero, v_karim, 'Nous on ramène les boules, on en a trois jeux', now() - interval '3 hours 10 minutes'),
    (g_apero, v_tom,   'Je vous rejoins après la plage, gardez-moi une place 🙌', now() - interval '2 hours 20 minutes'),
    (g_apero, v_marc,  'Parfait, on se retrouve directement au terrain alors. À ce soir !', now() - interval '1 hour 30 minutes'),

    (g_rando, v_sophie, 'Départ 8h du parking, ça laisse le temps de rentrer avant la chaleur ☀️', now() - interval '6 hours'),
    (g_rando, v_nadia,  'Ça me va. Prévoir combien d''eau selon vous ?', now() - interval '5 hours 20 minutes'),
    (g_rando, v_sophie, '1,5 L par personne minimum, et de bonnes chaussures, ça grimpe un peu au début', now() - interval '5 hours'),
    (g_rando, v_marc,   'Je peux prendre deux personnes en voiture si besoin', now() - interval '4 hours 10 minutes'),

    (g_surf, v_julie, 'J''ai réservé 4 planches à l''école de surf, il en reste 2 si ça tente quelqu''un 🏄', now() - interval '2 hours'),
    (g_surf, v_tom,   'Je prends ! Jamais fait, on verra bien 😅', now() - interval '1 hour 15 minutes'),

    (g_petanque, v_karim, 'Barbecue samedi soir, chacun amène sa viande et un truc à partager ?', now() - interval '20 hours'),
    (g_petanque, v_lea,   'Super idée ! Je fais une salade de pâtes pour tout le monde', now() - interval '19 hours'),
    (g_petanque, v_julie, 'Je m''occupe du dessert 🍰', now() - interval '18 hours 30 minutes'),

    (g_marche, v_nadia, 'Le marché de Collioure c''est le mercredi matin, on part à 9h ?', now() - interval '26 hours'),
    (g_marche, v_sophie,'Parfait, j''ai 3 places dans la voiture', now() - interval '25 hours');

  -- ══════════════════════════════════════════════════════════════════════════
  -- 7. Animations du camping
  -- ══════════════════════════════════════════════════════════════════════════
  -- Dates relatives : l'agenda reste crédible à chaque relance du script.
  INSERT INTO animations (camping_id, titre, emoji, description, lieu, debut, fin, places_max, publiee) VALUES
    (v_camping, 'Aquagym',              '🤸', 'Séance tonique de 45 minutes dans le grand bassin, animée par Chloé. Tous niveaux, matériel fourni.',
      'Espace aquatique',        CURRENT_DATE + interval '10 hours',      CURRENT_DATE + interval '10 hours 45 minutes', 20, true),
    (v_camping, 'Tournoi de pétanque',  '🎯', 'Doublettes formées au tirage. Inscription jusqu''à 17h à la réception. Apéritif offert aux finalistes.',
      'Terrain de pétanque',     CURRENT_DATE + interval '17 hours 30 minutes', CURRENT_DATE + interval '20 hours', 32, true),
    (v_camping, 'Soirée paella',        '🥘', 'Paella géante préparée sur place par Miguel. 14 € adulte, 8 € enfant. Réservation obligatoire avant 15h.',
      'Bar Le Ponton',           CURRENT_DATE + interval '1 day' + interval '19 hours 30 minutes', CURRENT_DATE + interval '1 day' + interval '23 hours', 80, true),
    (v_camping, 'Concert live',         '🎸', 'Duo guitare-voix, reprises pop et chanson française. Entrée libre, restauration au bar.',
      'Bar Le Ponton',           CURRENT_DATE + interval '2 days' + interval '21 hours', CURRENT_DATE + interval '2 days' + interval '23 hours 30 minutes', 120, true),
    (v_camping, 'Marché nocturne',      '🧺', 'Producteurs et artisans du Roussillon devant la réception : miel, charcuterie, poterie, savons.',
      'Allée principale',        CURRENT_DATE + interval '3 days' + interval '18 hours', CURRENT_DATE + interval '3 days' + interval '22 hours', NULL, true),
    (v_camping, 'Cinéma en plein air',  '🎬', 'Projection familiale sur écran géant. Transats installés dès 21h, couverture conseillée.',
      'Aire de jeux',            CURRENT_DATE + interval '4 days' + interval '21 hours 30 minutes', CURRENT_DATE + interval '4 days' + interval '23 hours 15 minutes', 60, true),
    (v_camping, 'Initiation paddle',    '🛶', 'Découverte encadrée par un moniteur diplômé. À partir de 12 ans, savoir nager obligatoire.',
      'Accès plage',             CURRENT_DATE + interval '5 days' + interval '9 hours 30 minutes', CURRENT_DATE + interval '5 days' + interval '11 hours', 12, true),
    (v_camping, 'Club enfants',         '🎨', 'Ateliers créatifs et jeux pour les 4-10 ans, encadrés par l''équipe animation.',
      'Aire de jeux',            CURRENT_DATE + interval '6 days' + interval '10 hours', CURRENT_DATE + interval '6 days' + interval '12 hours', 25, true);

  SELECT id INTO a_aquagym FROM animations WHERE camping_id = v_camping AND titre = 'Aquagym';
  SELECT id INTO a_tournoi FROM animations WHERE camping_id = v_camping AND titre = 'Tournoi de pétanque';
  SELECT id INTO a_paella  FROM animations WHERE camping_id = v_camping AND titre = 'Soirée paella';
  SELECT id INTO a_concert FROM animations WHERE camping_id = v_camping AND titre = 'Concert live';
  SELECT id INTO a_marche  FROM animations WHERE camping_id = v_camping AND titre = 'Marché nocturne';
  SELECT id INTO a_cinema  FROM animations WHERE camping_id = v_camping AND titre = 'Cinéma en plein air';

  -- Inscriptions : donne des compteurs crédibles plutôt que « 0 participant »
  INSERT INTO inscriptions (animation_id, vacancier_id) VALUES
    (a_aquagym, v_sophie), (a_aquagym, v_nadia), (a_aquagym, v_lea),
    (a_tournoi, v_marc), (a_tournoi, v_karim), (a_tournoi, v_julie), (a_tournoi, v_tom), (a_tournoi, v_hugo),
    (a_paella,  v_julie), (a_paella, v_marc), (a_paella, v_lea), (a_paella, v_karim), (a_paella, v_nadia), (a_paella, v_sophie),
    (a_concert, v_tom), (a_concert, v_julie), (a_concert, v_hugo),
    (a_marche,  v_nadia), (a_marche, v_sophie),
    (a_cinema,  v_lea), (a_cinema, v_karim), (a_cinema, v_marc)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Camping « Les Flots Bleus » prêt — slug les-flots-bleus, id %', v_camping;
END $$;

-- ============================================================================
-- Vérification
-- ============================================================================
SELECT c.nom,
       c.slug,
       (SELECT count(*) FROM groupes    g WHERE g.camping_id = c.id) AS groupes,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id) AS animations,
       (SELECT count(*) FROM vacanciers v WHERE v.camping_id = c.id) AS vacanciers,
       (SELECT count(*) FROM messages   m
          JOIN groupes g2 ON g2.id = m.groupe_id
         WHERE g2.camping_id = c.id)                                 AS messages,
       jsonb_array_length(c.infos)                                   AS fiches_livret,
       jsonb_array_length(c.carte_config->'pins')                    AS points_carte
FROM campings c
WHERE c.slug = 'les-flots-bleus';

-- ============================================================================
-- OPTIONNEL — ne garder que ce camping de démonstration
-- ----------------------------------------------------------------------------
-- ⚠️ SUPPRESSION DÉFINITIVE, sans retour possible. Les ON DELETE CASCADE
-- effacent aussi vacanciers, groupes, messages et animations rattachés.
-- Vérifiez d'abord ce qui serait supprimé :
--
--   SELECT slug, nom, created_at FROM campings WHERE slug <> 'les-flots-bleus';
--
-- Puis, seulement si cette liste ne contient aucun camping client réel :
--
--   DELETE FROM campings WHERE slug <> 'les-flots-bleus';
-- ============================================================================
