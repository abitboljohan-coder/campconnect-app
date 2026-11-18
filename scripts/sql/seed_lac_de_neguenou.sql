-- ============================================================================
-- ESPACE DE DÉMONSTRATION — « Camping du Lac de Néguenou » (Prayssas, 47)
-- ----------------------------------------------------------------------------
-- Prospect ayant répondu OUI (Chrystelle, 13/11/2026). Ce n'est PAS un client :
-- c'est un espace de démo à son nom, avec ses vraies soirées et ses vrais
-- équipements (source : lacdeneguenou.fr). Vacanciers, groupes et messages
-- sont des exemples.
--
-- IDEMPOTENT : purge puis recrée le contenu de ce seul camping. Relancer la
-- veille de la démo : les soirées retombent sur leurs vrais jours de la
-- semaine à venir (lundi mini-marché … jeudi paëlla).
--
-- Utilisation : Supabase → SQL Editor → coller → Run.
-- Lien : https://app.campconnect.fr/join/lac-de-neguenou
-- ============================================================================

DO $$
DECLARE
  v_camping uuid;
  v_lat numeric := 44.2905;   -- estimation, à recaler dans l'admin → Carte
  v_lng numeric := 0.5170;
  d_lun date; d_mar date; d_mer date; d_jeu date;
  g_petanque uuid; g_paddle uuid; g_peche uuid; g_pingpong uuid; g_waly uuid; g_balade uuid;
  a_paella uuid; a_danse uuid; a_loto uuid; a_karaoke uuid;
  v_julie uuid; v_marc uuid; v_sophie uuid; v_lucas uuid; v_lea uuid;
  v_pierre uuid; v_anais uuid; v_romain uuid; v_sarah uuid; v_jade uuid;
BEGIN
  -- Prochaine occurrence de chaque jour (aujourd'hui compris).
  d_lun := CURRENT_DATE + ((1 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_mar := CURRENT_DATE + ((2 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_mer := CURRENT_DATE + ((3 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_jeu := CURRENT_DATE + ((4 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);

  -- 1. Le camping ------------------------------------------------------------
  INSERT INTO campings (slug, nom, description, couleur_principale, couleur_secondaire, logo_url)
  VALUES (
    'lac-de-neguenou',
    'Camping du Lac de Néguenou',
    'Au bord d''un lac de 9 hectares, dans un parc boisé à Prayssas, près d''Agen.',
    '#7a2e3b', '#4f8a2a',
    'https://www.lacdeneguenou.fr/wp-content/uploads/2018/04/Logo_12.04_2.png'
  )
  ON CONFLICT (slug) DO UPDATE
    SET nom = EXCLUDED.nom, description = EXCLUDED.description,
        couleur_principale = EXCLUDED.couleur_principale,
        couleur_secondaire = EXCLUDED.couleur_secondaire,
        logo_url = EXCLUDED.logo_url;

  SELECT id INTO v_camping FROM campings WHERE slug = 'lac-de-neguenou';

  DELETE FROM messages   WHERE groupe_id IN (SELECT id FROM groupes WHERE camping_id = v_camping);
  DELETE FROM groupes    WHERE camping_id = v_camping;
  DELETE FROM animations WHERE camping_id = v_camping;
  DELETE FROM vacanciers WHERE camping_id = v_camping AND device_id LIKE 'demo-%';

  -- 2. Livret d'accueil (faits tirés du site du camping) ---------------------
  UPDATE campings SET infos = '[
    {"id":"soirees","emoji":"🎉","titre":"Les soirées de la semaine","contenu":"Lundi : mini-marché local sur la terrasse du snack.\nMardi : auberge espagnole et karaoké avec DJ Dimitri.\nMercredi : loto pour tous.\nJeudi : paëlla maison puis soirée dansante, piscine chauffée en nocturne."},
    {"id":"piscine","emoji":"🏊","titre":"Piscines","contenu":"Grand bassin chauffé et couvert, avec abri télescopique.\nPataugeoire chauffée du 4 juillet au 30 août."},
    {"id":"lac","emoji":"🛶","titre":"Le lac","contenu":"Lac de 9 hectares dans un parc boisé de 19 hectares.\nPédalos, canoës, kayaks et paddles en location sur le site."},
    {"id":"peche","emoji":"🎣","titre":"Pêche","contenu":"Pêche dans le lac.\nCannes prêtées gracieusement pour la pêche aux écrevisses."},
    {"id":"jeux","emoji":"🛝","titre":"Jeux et sports","contenu":"Trampoline et modules de jeux pour les enfants.\nBoulodrome, ping-pong, tennis, billard et appareils de sport.\nJeux de société à l''accueil."},
    {"id":"massages","emoji":"💆","titre":"Massages","contenu":"Le dimanche après-midi, et toute la journée du lundi au jeudi."},
    {"id":"feux","emoji":"🎆","titre":"Feux d''artifice","contenu":"Le 14 juillet et le 15 août, au-dessus du lac."},
    {"id":"alentours","emoji":"🗺️","titre":"À visiter près d''ici","contenu":"Agen : environ 18 km.\nWalygator, Aqualand et Z''animoland à proximité.\nBillets à tarif réduit à l''accueil."},
    {"id":"urgences","emoji":"🚨","titre":"Urgences","contenu":"Accueil : 05 24 29 70 96\nSAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112"}
  ]'::jsonb
  WHERE id = v_camping;

  -- 3. Carte (sauf si déjà tracée à la main dans l'admin) --------------------
  IF (SELECT coalesce(jsonb_array_length(carte_config->'perimeter'), 0)
        FROM campings WHERE id = v_camping) > 4 THEN
    RAISE NOTICE 'Carte déjà calibrée à la main : conservée.';
  ELSE
    UPDATE campings SET carte_config = jsonb_build_object(
      -- Accès libre : démo montrée à distance, pas de contrôle GPS.
      -- À RETIRER si ce camping devient client.
      'acces_libre', true,
      'center', jsonb_build_object('lat', v_lat, 'lng', v_lng),
      'lat', v_lat, 'lng', v_lng,
      'perimeter', jsonb_build_array(
        jsonb_build_array(v_lat + 0.0020, v_lng - 0.0030),
        jsonb_build_array(v_lat + 0.0020, v_lng + 0.0030),
        jsonb_build_array(v_lat - 0.0020, v_lng + 0.0030),
        jsonb_build_array(v_lat - 0.0020, v_lng - 0.0030)),
      'pins', jsonb_build_array(
        jsonb_build_object('ref_id','lieu_accueil','ref_type','lieu','label','Accueil','emoji','🏠','color','#60a5fa','lat',v_lat-0.0006,'lng',v_lng-0.0018),
        jsonb_build_object('ref_id','lieu_piscine','ref_type','lieu','label','Piscine chauffée','emoji','🏊','color','#60a5fa','lat',v_lat+0.0003,'lng',v_lng-0.0010),
        jsonb_build_object('ref_id','lieu_snack','ref_type','lieu','label','Snack et terrasse','emoji','🍽️','color','#60a5fa','lat',v_lat-0.0001,'lng',v_lng-0.0002),
        jsonb_build_object('ref_id','lieu_lac','ref_type','lieu','label','Plage du lac','emoji','🏖️','color','#60a5fa','lat',v_lat+0.0009,'lng',v_lng+0.0012),
        jsonb_build_object('ref_id','lieu_boules','ref_type','lieu','label','Boulodrome','emoji','🎯','color','#60a5fa','lat',v_lat-0.0009,'lng',v_lng+0.0004),
        jsonb_build_object('ref_id','lieu_jeux','ref_type','lieu','label','Aire de jeux','emoji','🛝','color','#60a5fa','lat',v_lat-0.0004,'lng',v_lng+0.0016))
    ) WHERE id = v_camping;
  END IF;

  -- 4. Vacanciers fictifs (device_id « demo- ») ------------------------------
  INSERT INTO vacanciers (camping_id, device_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, date_depart) VALUES
    (v_camping,'demo-julie','Julie','🌞','B12','36-45','famille',ARRAY['piscine','petanque','apero'],CURRENT_DATE+60),
    (v_camping,'demo-marc','Marc','🚴','A03','36-45','famille',ARRAY['velo','petanque','apero'],CURRENT_DATE+60),
    (v_camping,'demo-sophie','Sophie','🧘‍♀️','C21','36-45','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-lucas','Lucas','🎸','D08','18-25','amis',ARRAY['musique','soirees'],CURRENT_DATE+60),
    (v_camping,'demo-lea','Léa','🏊‍♀️','B16','26-35','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-pierre','Pierre','🎣','A11','60+','couple',ARRAY['nature','petanque'],CURRENT_DATE+60),
    (v_camping,'demo-anais','Anaïs','🌻','B18','26-35','famille',ARRAY['piscine','apero'],CURRENT_DATE+60),
    (v_camping,'demo-romain','Romain','🏓','A07','36-45','couple',ARRAY['sport','petanque'],CURRENT_DATE+60),
    (v_camping,'demo-sarah','Sarah','🌺','B09','36-45','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-jade','Jade','🦋','C02','46-60','couple',ARRAY['rando','nature'],CURRENT_DATE+60);

  SELECT id INTO v_julie  FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-julie';
  SELECT id INTO v_marc   FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-marc';
  SELECT id INTO v_sophie FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-sophie';
  SELECT id INTO v_lucas  FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lucas';
  SELECT id INTO v_lea    FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lea';
  SELECT id INTO v_pierre FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-pierre';
  SELECT id INTO v_anais  FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-anais';
  SELECT id INTO v_romain FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-romain';
  SELECT id INTO v_sarah  FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-sarah';
  SELECT id INTO v_jade   FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-jade';

  -- 5. Groupes (heure ISO sans fuseau, comme Groupes.jsx) --------------------
  INSERT INTO groupes (camping_id, titre, emoji, lieu, heure, actif) VALUES
    (v_camping,'Pétanque au boulodrome','🎯','Boulodrome',to_char(CURRENT_DATE+interval '18 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Paddle sur le lac','🏄','Plage du lac',to_char(CURRENT_DATE+interval '1 day 10 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Pêche aux écrevisses','🦞','Bord du lac',to_char(CURRENT_DATE+interval '17 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Tournoi de ping-pong','🏓','Table de ping-pong',to_char(CURRENT_DATE+interval '16 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Sortie à Walygator','🎢','Parking du camping',to_char(CURRENT_DATE+interval '2 days 9 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Balade autour du lac','🥾','Accueil',to_char(CURRENT_DATE+interval '1 day 9 hours','YYYY-MM-DD"T"HH24:MI:SS'),true);

  SELECT id INTO g_petanque FROM groupes WHERE camping_id=v_camping AND titre='Pétanque au boulodrome';
  SELECT id INTO g_paddle   FROM groupes WHERE camping_id=v_camping AND titre='Paddle sur le lac';
  SELECT id INTO g_peche    FROM groupes WHERE camping_id=v_camping AND titre='Pêche aux écrevisses';
  SELECT id INTO g_pingpong FROM groupes WHERE camping_id=v_camping AND titre='Tournoi de ping-pong';
  SELECT id INTO g_waly     FROM groupes WHERE camping_id=v_camping AND titre='Sortie à Walygator';
  SELECT id INTO g_balade   FROM groupes WHERE camping_id=v_camping AND titre='Balade autour du lac';

  INSERT INTO membres_groupes (groupe_id, vacancier_id) VALUES
    (g_petanque,v_marc),(g_petanque,v_julie),(g_petanque,v_pierre),(g_petanque,v_romain),(g_petanque,v_anais),
    (g_paddle,v_lucas),(g_paddle,v_lea),(g_paddle,v_julie),
    (g_peche,v_pierre),(g_peche,v_sophie),(g_peche,v_sarah),
    (g_pingpong,v_romain),(g_pingpong,v_lucas),(g_pingpong,v_marc),
    (g_waly,v_sarah),(g_waly,v_lea),(g_waly,v_sophie),(g_waly,v_anais),
    (g_balade,v_jade),(g_balade,v_pierre)
  ON CONFLICT DO NOTHING;

  -- 6. Messages ---------------------------------------------------------------
  INSERT INTO messages (groupe_id, auteur_id, contenu, created_at) VALUES
    (g_petanque,v_marc,'Partie ce soir au boulodrome vers 18h30, débutants bienvenus 😄',now()-interval '4 hours'),
    (g_petanque,v_julie,'Partante ! On passe prendre l''apéro au snack avant',now()-interval '3 hours 30 minutes'),
    (g_petanque,v_pierre,'J''ai deux jeux de boules, je les ramène',now()-interval '3 hours'),
    (g_petanque,v_romain,'Je vous rejoins après la piscine 🙌',now()-interval '1 hour 40 minutes'),
    (g_paddle,v_lucas,'Qui vient faire du paddle sur le lac demain matin ? On loue sur place',now()-interval '2 hours 30 minutes'),
    (g_paddle,v_lea,'Moi ! Jamais essayé, on verra bien 😅',now()-interval '2 hours'),
    (g_peche,v_pierre,'Les cannes à écrevisses sont prêtées à l''accueil, rendez-vous 17h au bord du lac',now()-interval '5 hours'),
    (g_peche,v_sarah,'Super, je viens avec les enfants 🦞',now()-interval '4 hours 20 minutes'),
    (g_waly,v_sarah,'Sortie Walygator, il reste 3 places dans nos voitures. Billets moins chers à l''accueil !',now()-interval '20 hours'),
    (g_waly,v_anais,'On en est, avec les deux petits 🎢',now()-interval '18 hours');

  -- 7. Animations : leurs vraies soirées, sur les bons jours ------------------
  INSERT INTO animations (camping_id, titre, emoji, description, lieu, debut, fin, places_max, publiee) VALUES
    (v_camping,'Paëlla maison','🥘','La paëlla du jeudi, préparée sur place. Inscription conseillée.','Terrasse du snack',d_jeu+interval '19 hours 30 minutes',d_jeu+interval '21 hours 30 minutes',60,true),
    (v_camping,'Soirée dansante, piscine en nocturne','💃','Après la paëlla, on danse. La piscine chauffée reste ouverte en nocturne.','Terrasse du snack',d_jeu+interval '21 hours 30 minutes',d_jeu+interval '23 hours 59 minutes',NULL,true),
    (v_camping,'Mini-marché local','🧺','Producteurs du coin sur la terrasse du snack.','Terrasse du snack',d_lun+interval '18 hours',d_lun+interval '20 hours',NULL,true),
    (v_camping,'Auberge espagnole et karaoké','🎤','Chacun apporte un plat à partager, puis karaoké avec DJ Dimitri.','Terrasse du snack',d_mar+interval '19 hours 30 minutes',d_mar+interval '23 hours',NULL,true),
    (v_camping,'Loto pour tous','🎱','Loto pour petits et grands.','Terrasse du snack',d_mer+interval '21 hours',d_mer+interval '23 hours',NULL,true);

  SELECT id INTO a_paella  FROM animations WHERE camping_id=v_camping AND titre='Paëlla maison';
  SELECT id INTO a_karaoke FROM animations WHERE camping_id=v_camping AND titre='Auberge espagnole et karaoké';
  SELECT id INTO a_loto    FROM animations WHERE camping_id=v_camping AND titre='Loto pour tous';

  INSERT INTO inscriptions (animation_id, vacancier_id) VALUES
    (a_paella,v_julie),(a_paella,v_marc),(a_paella,v_sophie),(a_paella,v_lea),(a_paella,v_pierre),(a_paella,v_anais),(a_paella,v_sarah),
    (a_karaoke,v_lucas),(a_karaoke,v_julie),(a_karaoke,v_romain),
    (a_loto,v_jade),(a_loto,v_pierre),(a_loto,v_sarah)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Camping « Lac de Néguenou » prêt — id %', v_camping;
END $$;

-- Vérification
SELECT c.nom, c.slug,
  (SELECT count(*) FROM groupes g WHERE g.camping_id=c.id) AS groupes,
  (SELECT count(*) FROM animations a WHERE a.camping_id=c.id) AS animations,
  (SELECT count(*) FROM vacanciers v WHERE v.camping_id=c.id) AS vacanciers,
  jsonb_array_length(c.infos) AS fiches_livret
FROM campings c WHERE c.slug='lac-de-neguenou';

-- ACCÈS GÉRANT (démo de l'espace gérant) : même procédure que
-- seed_flots_bleus.sql — créer l'utilisateur dans Authentication (Auto Confirm),
-- puis :
--   INSERT INTO gerants (user_id, camping_id, email)
--   SELECT u.id, c.id, u.email FROM auth.users u, campings c
--    WHERE u.email = 'neguenou-demo@campconnect.fr' AND c.slug = 'lac-de-neguenou';
