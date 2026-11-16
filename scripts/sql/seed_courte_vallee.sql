-- ============================================================================
-- ESPACE DE DÉMONSTRATION — « Camping de Courte Vallée » (Airvault, 79)
-- ----------------------------------------------------------------------------
-- Prospect ayant répondu « yes please send it » (16/11/2026). Ce n'est PAS un
-- client. Camping tenu par des Britanniques, clientèle anglophone : contenu en
-- anglais (l'interface suit la langue du téléphone). Faits tirés de
-- caravanningfrance.com (Facilities, Food & Drink, Places to Visit).
-- Vacanciers, groupes, messages et les jours du quiz / fish 'n' chips / wine
-- tasting sont des EXEMPLES. Réels : BBQ du vendredi, Chef's menu dim-mer.
--
-- IDEMPOTENT : purge puis recrée le contenu de ce seul camping. Relancer la
-- veille d'une démo.
-- Lien : https://app.campconnect.fr/join/courte-vallee
-- ============================================================================

DO $$
DECLARE
  v_camping uuid;
  v_lat numeric := 46.83293;   -- OpenStreetMap (way 902618649)
  v_lng numeric := -0.14904;
  d_ven date; d_dim date; d_mar date; d_mer date; d_jeu date;
  g_boules uuid; g_ping uuid; g_walk uuid; g_fish uuid; g_futuro uuid; g_cycle uuid;
  a_bbq uuid; a_quiz uuid; a_wine uuid; a_fish uuid;
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid; v6 uuid; v7 uuid; v8 uuid; v9 uuid; v10 uuid;
BEGIN
  d_ven := CURRENT_DATE + ((5 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_dim := CURRENT_DATE + ((7 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_mar := CURRENT_DATE + ((2 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_mer := CURRENT_DATE + ((3 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_jeu := CURRENT_DATE + ((4 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);

  INSERT INTO campings (slug, nom, description, couleur_principale, couleur_secondaire)
  VALUES ('courte-vallee', 'Camping de Courte Vallée',
          'British owned and run, on 10 acres by the Thouet, a 15-minute stroll from medieval Airvault.',
          '#1f4e79', '#3a6b35')
  ON CONFLICT (slug) DO UPDATE
    SET nom = EXCLUDED.nom, description = EXCLUDED.description,
        couleur_principale = EXCLUDED.couleur_principale,
        couleur_secondaire = EXCLUDED.couleur_secondaire;

  SELECT id INTO v_camping FROM campings WHERE slug = 'courte-vallee';

  DELETE FROM messages   WHERE groupe_id IN (SELECT id FROM groupes WHERE camping_id = v_camping);
  DELETE FROM groupes    WHERE camping_id = v_camping;
  DELETE FROM animations WHERE camping_id = v_camping;
  DELETE FROM vacanciers WHERE camping_id = v_camping AND device_id LIKE 'demo-%';

  UPDATE campings SET infos = '[
    {"id":"bar","emoji":"🍺","titre":"Bar & Bistro Route 36","contenu":"On-site bar and bistro: speciality coffees, beers and wines.\nFreshly prepared food, sourced locally.\nChef''s menu on Sunday, Monday, Tuesday and Wednesday nights.\nChildren''s menu and snacks available."},
    {"id":"soirees","emoji":"🎉","titre":"Evenings on site","contenu":"Communal BBQ on Friday night (weather permitting).\nTheme nights, including fish ''n'' chips.\nQuiz nights and musical soirées.\nFrequent wine tastings and vineyard tours."},
    {"id":"piscine","emoji":"🏊","titre":"Swimming pool","contenu":"Outdoor swimming pool, shaded terrace next to the bar."},
    {"id":"shop","emoji":"🥖","titre":"Shop & bread","contenu":"Small shop on site.\nBread to order."},
    {"id":"wifi","emoji":"📶","titre":"Internet","contenu":"Internet access is free.\nSporting events shown on the big screen at the bar."},
    {"id":"jeux","emoji":"🛝","titre":"Play & games","contenu":"Children''s play area.\nBoules and ping-pong."},
    {"id":"laverie","emoji":"👕","titre":"Laundry","contenu":"Coin-operated laundry facilities."},
    {"id":"chiens","emoji":"🐾","titre":"Dogs","contenu":"Dogs welcome."},
    {"id":"visiter","emoji":"🗺️","titre":"Places to visit","contenu":"Medieval Airvault: 15-minute stroll.\nRiverside walks, cycle rides, fishing in the Thouet.\nFuturoscope, Puy du Fou, Terra Botanica, Vallée des Singes, Zoo de Doué.\nLoire châteaux, Saumur, Chinon, Marais Poitevin within an easy drive."},
    {"id":"restaurants","emoji":"🍽️","titre":"Restaurants nearby","contenu":"Le 12, Airvault (15 min walk): 05 49 63 99 50.\nL''Hôtel du Cygne, Airvault (10 min walk): 05 49 63 30 58."},
    {"id":"urgences","emoji":"🚨","titre":"Contact & emergencies","contenu":"Reception: +33 (0)5 49 64 70 65\nMobile: +33 (0)6 30 01 87 73\nEuropean emergency number: 112 (SAMU 15, police 17, fire 18)"}
  ]'::jsonb
  WHERE id = v_camping;

  IF (SELECT coalesce(jsonb_array_length(carte_config->'perimeter'), 0) FROM campings WHERE id = v_camping) > 4 THEN
    RAISE NOTICE 'Carte déjà calibrée à la main : conservée.';
  ELSE
    UPDATE campings SET carte_config = jsonb_build_object(
      'acces_libre', true,   -- démo à distance ; À RETIRER si ce camping devient client
      'center', jsonb_build_object('lat', v_lat, 'lng', v_lng),
      'lat', v_lat, 'lng', v_lng,
      'perimeter', jsonb_build_array(            -- emprise OpenStreetMap
        jsonb_build_array(46.83407, -0.15174), jsonb_build_array(46.83407, -0.14742),
        jsonb_build_array(46.83181, -0.14742), jsonb_build_array(46.83181, -0.15174)),
      'pins', jsonb_build_array(
        jsonb_build_object('ref_id','lieu_bar','ref_type','lieu','label','Bar Route 36','emoji','🍺','color','#60a5fa','lat',v_lat+0.0003,'lng',v_lng+0.0006),
        jsonb_build_object('ref_id','lieu_piscine','ref_type','lieu','label','Swimming pool','emoji','🏊','color','#60a5fa','lat',v_lat+0.0002,'lng',v_lng+0.0002),
        jsonb_build_object('ref_id','lieu_jeux','ref_type','lieu','label','Play area','emoji','🛝','color','#60a5fa','lat',v_lat-0.0002,'lng',v_lng+0.0004),
        jsonb_build_object('ref_id','lieu_boules','ref_type','lieu','label','Boules','emoji','🎯','color','#60a5fa','lat',v_lat-0.0004,'lng',v_lng-0.0004))
    ) WHERE id = v_camping;
  END IF;

  INSERT INTO vacanciers (camping_id, device_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, date_depart) VALUES
    (v_camping,'demo-cv-1','Sarah','🌞','12','36-45','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-cv-2','Mike','🚴','4','46-60','couple',ARRAY['velo','petanque'],CURRENT_DATE+60),
    (v_camping,'demo-cv-3','Emma','🧘‍♀️','21','26-35','couple',ARRAY['piscine','rando'],CURRENT_DATE+60),
    (v_camping,'demo-cv-4','Tom','🎣','8','60+','couple',ARRAY['nature','peche'],CURRENT_DATE+60),
    (v_camping,'demo-cv-5','Lotte','🌷','15','36-45','famille',ARRAY['enfants','velo'],CURRENT_DATE+60),
    (v_camping,'demo-cv-6','Dave','🏓','30','36-45','famille',ARRAY['sport','petanque'],CURRENT_DATE+60),
    (v_camping,'demo-cv-7','Claire','🍷','2','46-60','couple',ARRAY['apero','soirees'],CURRENT_DATE+60),
    (v_camping,'demo-cv-8','Pieter','⛺','19','46-60','famille',ARRAY['rando','nature'],CURRENT_DATE+60),
    (v_camping,'demo-cv-9','Jenny','🌺','11','26-35','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-cv-10','Rob','🎸','25','60+','couple',ARRAY['musique','soirees'],CURRENT_DATE+60);

  SELECT id INTO v1 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-1';
  SELECT id INTO v2 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-2';
  SELECT id INTO v3 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-3';
  SELECT id INTO v4 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-4';
  SELECT id INTO v5 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-5';
  SELECT id INTO v6 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-6';
  SELECT id INTO v7 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-7';
  SELECT id INTO v8 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-8';
  SELECT id INTO v9 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-9';
  SELECT id INTO v10 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-cv-10';

  INSERT INTO groupes (camping_id, titre, emoji, lieu, heure, actif) VALUES
    (v_camping,'Boules before the BBQ','🎯','Boules pitch',to_char(CURRENT_DATE+interval '18 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Ping-pong doubles','🏓','Ping-pong table',to_char(CURRENT_DATE+interval '16 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Stroll into old Airvault','🏰','Reception',to_char(CURRENT_DATE+interval '1 day 10 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Fishing on the Thouet','🎣','Riverside',to_char(CURRENT_DATE+interval '17 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Day out at Futuroscope','🎢','Car park',to_char(CURRENT_DATE+interval '2 days 9 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Riverside cycle ride','🚲','Reception',to_char(CURRENT_DATE+interval '1 day 9 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true);

  SELECT id INTO g_boules FROM groupes WHERE camping_id=v_camping AND titre='Boules before the BBQ';
  SELECT id INTO g_ping   FROM groupes WHERE camping_id=v_camping AND titre='Ping-pong doubles';
  SELECT id INTO g_walk   FROM groupes WHERE camping_id=v_camping AND titre='Stroll into old Airvault';
  SELECT id INTO g_fish   FROM groupes WHERE camping_id=v_camping AND titre='Fishing on the Thouet';
  SELECT id INTO g_futuro FROM groupes WHERE camping_id=v_camping AND titre='Day out at Futuroscope';
  SELECT id INTO g_cycle  FROM groupes WHERE camping_id=v_camping AND titre='Riverside cycle ride';

  INSERT INTO membres_groupes (groupe_id, vacancier_id) VALUES
    (g_boules,v2),(g_boules,v6),(g_boules,v7),(g_boules,v10),(g_boules,v1),
    (g_ping,v6),(g_ping,v5),(g_ping,v9),
    (g_walk,v3),(g_walk,v7),(g_walk,v8),
    (g_fish,v4),(g_fish,v2),
    (g_futuro,v1),(g_futuro,v5),(g_futuro,v9),(g_futuro,v6),
    (g_cycle,v2),(g_cycle,v8),(g_cycle,v3)
  ON CONFLICT DO NOTHING;

  INSERT INTO messages (groupe_id, auteur_id, contenu, created_at) VALUES
    (g_boules,v2,'Quick game of boules at 6 before the BBQ? Beginners welcome 😄',now()-interval '4 hours'),
    (g_boules,v7,'Count us in! We''ll bring a bottle of the local white 🍷',now()-interval '3 hours 30 minutes'),
    (g_boules,v10,'I''ve got a spare set of boules if anyone needs one',now()-interval '2 hours 50 minutes'),
    (g_boules,v6,'Coming after the pool with the kids 🙌',now()-interval '1 hour 40 minutes'),
    (g_fish,v4,'Heading down to the Thouet around 5, anyone fancy joining?',now()-interval '5 hours'),
    (g_fish,v2,'Yes! Does anyone know where to get a fishing permit?',now()-interval '4 hours 20 minutes'),
    (g_futuro,v1,'Off to Futuroscope on Wednesday, 3 seats left in our car',now()-interval '20 hours'),
    (g_futuro,v5,'Wij gaan mee! (We''re in, with our two boys 🎢)',now()-interval '18 hours'),
    (g_walk,v3,'Walking into the old town tomorrow at 10 for the market, join us!',now()-interval '6 hours');

  INSERT INTO animations (camping_id, titre, emoji, description, lieu, debut, fin, places_max, publiee) VALUES
    (v_camping,'Communal BBQ','🍖','Our Friday night communal barbecue (weather permitting). Bring your own food, we light the grills.','Terrace',d_ven+interval '19 hours',d_ven+interval '22 hours',60,true),
    (v_camping,'Chef''s menu','👨‍🍳','Chef''s menu at Bar Route 36, freshly prepared with local produce.','Bar Route 36',d_dim+interval '19 hours',d_dim+interval '21 hours 30 minutes',40,true),
    (v_camping,'Quiz night','❓','Teams of 4, prizes for the winners.','Bar Route 36',d_mar+interval '20 hours 30 minutes',d_mar+interval '22 hours 30 minutes',NULL,true),
    (v_camping,'Wine tasting','🍷','Taste wines from local caves and châteaux.','Terrace',d_mer+interval '18 hours',d_mer+interval '19 hours 30 minutes',20,true),
    (v_camping,'Fish ''n'' chips night','🐟','Theme night: proper fish ''n'' chips at the bistro.','Bar Route 36',d_jeu+interval '19 hours',d_jeu+interval '21 hours 30 minutes',50,true);

  SELECT id INTO a_bbq  FROM animations WHERE camping_id=v_camping AND titre='Communal BBQ';
  SELECT id INTO a_quiz FROM animations WHERE camping_id=v_camping AND titre='Quiz night';
  SELECT id INTO a_wine FROM animations WHERE camping_id=v_camping AND titre='Wine tasting';
  SELECT id INTO a_fish FROM animations WHERE camping_id=v_camping AND titre='Fish ''n'' chips night';

  INSERT INTO inscriptions (animation_id, vacancier_id) VALUES
    (a_bbq,v1),(a_bbq,v2),(a_bbq,v3),(a_bbq,v5),(a_bbq,v6),(a_bbq,v7),(a_bbq,v9),(a_bbq,v10),
    (a_quiz,v7),(a_quiz,v10),(a_quiz,v2),(a_quiz,v8),
    (a_wine,v7),(a_wine,v3),(a_wine,v8),
    (a_fish,v1),(a_fish,v4),(a_fish,v6),(a_fish,v9),(a_fish,v10)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Camping « Courte Vallée » prêt — id %', v_camping;
END $$;

SELECT c.nom, c.slug,
  (SELECT count(*) FROM groupes g WHERE g.camping_id=c.id) AS groupes,
  (SELECT count(*) FROM animations a WHERE a.camping_id=c.id) AS animations,
  (SELECT count(*) FROM vacanciers v WHERE v.camping_id=c.id) AS vacanciers,
  jsonb_array_length(c.infos) AS fiches_livret
FROM campings c WHERE c.slug='courte-vallee';
