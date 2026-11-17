-- ESPACE DE DÉMONSTRATION — « Camping L'Étang Bleu » (Vieux-Mareuil, 24). Prospect : Marc Finch a répondu
-- « Yes please do » le 17/11/2026. Pas un client. Contenu en anglais (propriétaires britanniques). Faits tirés de
-- letangbleu.com ; vacanciers, groupes, messages et jours des soirées = exemples. Idempotent.
-- Lien : https://app.campconnect.fr/join/etang-bleu
DO $$
DECLARE
  v_camping uuid; v_lat numeric := 45.44562; v_lng numeric := 0.50978;
  d_ven date; d_mar date; d_jeu date;
  g_fish uuid; g_pool uuid; g_brant uuid; g_walk uuid; g_gym uuid; g_bar uuid;
  a_bbq uuid; a_moules uuid; a_dinner uuid;
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid; v6 uuid; v7 uuid; v8 uuid; v9 uuid; v10 uuid;
BEGIN
  d_ven := CURRENT_DATE + ((5 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_mar := CURRENT_DATE + ((2 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  d_jeu := CURRENT_DATE + ((4 - extract(isodow FROM CURRENT_DATE)::int + 7) % 7);
  INSERT INTO campings (slug, nom, description, couleur_principale, couleur_secondaire)
  VALUES ('etang-bleu', 'Camping L''Étang Bleu',
          'A quiet campsite in the northern Dordogne, run by Marc & Jo Finch since 2000: pool, pool bar, café and a hidden fishing lake.',
          '#1d5c8f', '#4a7c3a')
  ON CONFLICT (slug) DO UPDATE SET nom=EXCLUDED.nom, description=EXCLUDED.description,
    couleur_principale=EXCLUDED.couleur_principale, couleur_secondaire=EXCLUDED.couleur_secondaire;
  SELECT id INTO v_camping FROM campings WHERE slug='etang-bleu';
  DELETE FROM messages WHERE groupe_id IN (SELECT id FROM groupes WHERE camping_id=v_camping);
  DELETE FROM groupes WHERE camping_id=v_camping;
  DELETE FROM animations WHERE camping_id=v_camping;
  DELETE FROM vacanciers WHERE camping_id=v_camping AND device_id LIKE 'demo-%';
  UPDATE campings SET infos='[
    {"id":"dining","emoji":"🍽️","titre":"Café, bar & restaurant","contenu":"Open from the start of the season.\nA lovely variety of homemade meals.\nThemed evenings such as BBQ nights and moules-frites."},
    {"id":"piscine","emoji":"🏊","titre":"Swimming pool & pool bar","contenu":"Outdoor swimming pool, cleaned every day.\nThe pool bar is open every day the sun is out."},
    {"id":"lake","emoji":"🎣","titre":"Private fishing lake","contenu":"A peaceful, hidden-away lake on site.\nFor a walk or an afternoon''s fishing."},
    {"id":"gym","emoji":"🏋️","titre":"Gym","contenu":"On-site private gym."},
    {"id":"pitches","emoji":"⛺","titre":"Pitches","contenu":"Spacious green pitches divided by hedges.\nElectricity close to every pitch.\nBarbecuing allowed.\nRefurbished toilets and showers a short walk away."},
    {"id":"visit","emoji":"🗺️","titre":"Explore the area","contenu":"Walking and cycling paths all around.\nBrantôme, Bourdeilles, St Jean de Côle, Aubeterre, Nontron.\nPérigueux and Angoulême: about 45 min.\nChâteaux, caves and the Lascaux caves."},
    {"id":"season","emoji":"📅","titre":"Season","contenu":"Open from 1 April to 27 September 2026."},
    {"id":"contact","emoji":"🚨","titre":"Contact & emergencies","contenu":"Reception: +33 (0)5 53 60 92 70\nEmail: letangbleu@orange.fr\nEuropean emergency number: 112 (SAMU 15, police 17, fire 18)"}
  ]'::jsonb WHERE id=v_camping;
  UPDATE campings SET carte_config=jsonb_build_object(
    'acces_libre', true,
    'center', jsonb_build_object('lat',v_lat,'lng',v_lng), 'lat',v_lat, 'lng',v_lng,
    'perimeter', jsonb_build_array(jsonb_build_array(45.44702,0.50808),jsonb_build_array(45.44702,0.51180),jsonb_build_array(45.44433,0.51180),jsonb_build_array(45.44433,0.50808)),
    'pins', jsonb_build_array(
      jsonb_build_object('ref_id','lieu_pool','ref_type','lieu','label','Pool & pool bar','emoji','🏊','color','#60a5fa','lat',v_lat+0.0002,'lng',v_lng),
      jsonb_build_object('ref_id','lieu_cafe','ref_type','lieu','label','Café & restaurant','emoji','🍽️','color','#60a5fa','lat',v_lat+0.0003,'lng',v_lng+0.0005),
      jsonb_build_object('ref_id','lieu_lake','ref_type','lieu','label','Fishing lake','emoji','🎣','color','#60a5fa','lat',v_lat-0.0008,'lng',v_lng+0.0012),
      jsonb_build_object('ref_id','lieu_gym','ref_type','lieu','label','Gym','emoji','🏋️','color','#60a5fa','lat',v_lat+0.0001,'lng',v_lng-0.0006))
  ) WHERE id=v_camping AND coalesce(jsonb_array_length(carte_config->'perimeter'),0) <= 4;
  INSERT INTO vacanciers (camping_id, device_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, date_depart) VALUES
    (v_camping,'demo-eb-1','Helen','🌞','7','46-60','couple',ARRAY['piscine','rando'],CURRENT_DATE+60),
    (v_camping,'demo-eb-2','Gary','🎣','12','60+','couple',ARRAY['peche','nature'],CURRENT_DATE+60),
    (v_camping,'demo-eb-3','Sophie','🧘‍♀️','3','26-35','famille',ARRAY['piscine','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-eb-4','Daan','🚲','18','36-45','famille',ARRAY['velo','rando'],CURRENT_DATE+60),
    (v_camping,'demo-eb-5','Kate','🍷','22','46-60','couple',ARRAY['apero','soirees'],CURRENT_DATE+60),
    (v_camping,'demo-eb-6','Tom','⚽','9','36-45','famille',ARRAY['sport','enfants'],CURRENT_DATE+60),
    (v_camping,'demo-eb-7','Anke','🌷','15','26-35','famille',ARRAY['piscine','velo'],CURRENT_DATE+60),
    (v_camping,'demo-eb-8','Pete','🏋️','5','36-45','amis',ARRAY['sport','fitness'],CURRENT_DATE+60),
    (v_camping,'demo-eb-9','Lucy','🌺','11','36-45','famille',ARRAY['enfants','piscine'],CURRENT_DATE+60),
    (v_camping,'demo-eb-10','Brian','🎸','20','60+','couple',ARRAY['musique','soirees'],CURRENT_DATE+60);
  SELECT id INTO v1 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-1';
  SELECT id INTO v2 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-2';
  SELECT id INTO v3 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-3';
  SELECT id INTO v4 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-4';
  SELECT id INTO v5 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-5';
  SELECT id INTO v6 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-6';
  SELECT id INTO v7 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-7';
  SELECT id INTO v8 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-8';
  SELECT id INTO v9 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-9';
  SELECT id INTO v10 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-eb-10';
  INSERT INTO groupes (camping_id, titre, emoji, lieu, heure, actif) VALUES
    (v_camping,'Afternoon fishing at the lake','🎣','Fishing lake',to_char(CURRENT_DATE+interval '15 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Kids pool games','🏊','Swimming pool',to_char(CURRENT_DATE+interval '16 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Market morning in Brantôme','🧺','Car park',to_char(CURRENT_DATE+interval '1 day 9 hours','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Countryside walk','🥾','Reception',to_char(CURRENT_DATE+interval '1 day 8 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Morning gym session','🏋️','Gym',to_char(CURRENT_DATE+interval '1 day 7 hours 30 minutes','YYYY-MM-DD"T"HH24:MI:SS'),true),
    (v_camping,'Drinks at the pool bar','🍹','Pool bar',to_char(CURRENT_DATE+interval '18 hours','YYYY-MM-DD"T"HH24:MI:SS'),true);
  SELECT id INTO g_fish FROM groupes WHERE camping_id=v_camping AND titre='Afternoon fishing at the lake';
  SELECT id INTO g_pool FROM groupes WHERE camping_id=v_camping AND titre='Kids pool games';
  SELECT id INTO g_brant FROM groupes WHERE camping_id=v_camping AND titre='Market morning in Brantôme';
  SELECT id INTO g_walk FROM groupes WHERE camping_id=v_camping AND titre='Countryside walk';
  SELECT id INTO g_gym FROM groupes WHERE camping_id=v_camping AND titre='Morning gym session';
  SELECT id INTO g_bar FROM groupes WHERE camping_id=v_camping AND titre='Drinks at the pool bar';
  INSERT INTO membres_groupes (groupe_id, vacancier_id) VALUES
    (g_fish,v2),(g_fish,v6),(g_pool,v3),(g_pool,v9),(g_pool,v7),(g_brant,v1),(g_brant,v5),(g_brant,v4),
    (g_walk,v1),(g_walk,v4),(g_gym,v8),(g_gym,v6),(g_bar,v5),(g_bar,v10),(g_bar,v1),(g_bar,v2),(g_bar,v8)
  ON CONFLICT DO NOTHING;
  INSERT INTO messages (groupe_id, auteur_id, contenu, created_at) VALUES
    (g_fish,v2,'Off to the lake around 3, anyone fancy an afternoon''s fishing? 🎣',now()-interval '4 hours'),
    (g_fish,v6,'Yes! I''ll bring my lad, he''s never caught anything 😄',now()-interval '3 hours 20 minutes'),
    (g_bar,v5,'Pool bar at 6 while the sun''s still out? 🍹',now()-interval '2 hours 40 minutes'),
    (g_bar,v10,'Count me in, then straight on to the BBQ night',now()-interval '2 hours'),
    (g_brant,v1,'Heading to Brantôme market tomorrow at 9, 2 seats left in our car',now()-interval '6 hours'),
    (g_brant,v4,'Wij gaan mee! (We''re in, with the kids)',now()-interval '5 hours'),
    (g_pool,v3,'Pool games for the little ones at 4, all welcome 🏊',now()-interval '3 hours');
  INSERT INTO animations (camping_id, titre, emoji, description, lieu, debut, fin, places_max, publiee) VALUES
    (v_camping,'BBQ night','🍖','Themed BBQ evening at the café-restaurant.','Café & restaurant',d_ven+interval '19 hours',d_ven+interval '22 hours',50,true),
    (v_camping,'Moules-frites night','🦪','Themed evening: moules-frites, homemade.','Café & restaurant',d_mar+interval '19 hours',d_mar+interval '21 hours 30 minutes',40,true),
    (v_camping,'Homemade dinner at the café','🍽️','A lovely variety of homemade meals at the campsite restaurant.','Café & restaurant',d_jeu+interval '19 hours',d_jeu+interval '21 hours',30,true);
  SELECT id INTO a_bbq FROM animations WHERE camping_id=v_camping AND titre='BBQ night';
  SELECT id INTO a_moules FROM animations WHERE camping_id=v_camping AND titre='Moules-frites night';
  SELECT id INTO a_dinner FROM animations WHERE camping_id=v_camping AND titre='Homemade dinner at the café';
  INSERT INTO inscriptions (animation_id, vacancier_id) VALUES
    (a_bbq,v1),(a_bbq,v2),(a_bbq,v5),(a_bbq,v6),(a_bbq,v9),(a_bbq,v10),(a_bbq,v3),
    (a_moules,v5),(a_moules,v1),(a_moules,v10),(a_moules,v8),(a_dinner,v2),(a_dinner,v4)
  ON CONFLICT DO NOTHING;
END $$;
SELECT c.slug,(SELECT count(*) FROM groupes g WHERE g.camping_id=c.id) groupes,(SELECT count(*) FROM animations a WHERE a.camping_id=c.id) animations,jsonb_array_length(c.infos) livret FROM campings c WHERE slug='etang-bleu';
