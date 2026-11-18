-- ESPACE DE DÉMONSTRATION — « Camping Le Lac des Charmilles » (Torigny-les-Villes, 50). Prospect : Eugénie
-- Madelaine (« Pourquoi pas ! », 5/10/2026). Pas un client. Ajoute (18/11/2026) des vacanciers d'exemple, 6 groupes,
-- leurs messages, 1 animation (et ramène la soirée moules-frites existante), puis inscrit le camping dans demo_prospects (groupes avancés chaque nuit).
-- Faits tirés de camping-lacdescharmilles.com (lac, piscine couverte chauffée, bar-restaurant, terrain de sport,
-- club enfants, soirée moules-frites le vendredi) ; vacanciers, groupes et messages = exemples.
-- Insertion seule : s'arrête si les vacanciers d'exemple existent déjà.
-- Lien : https://app.campconnect.fr/join/lac-des-charmilles
DO $$
DECLARE
  v_camping uuid; j date := (now() AT TIME ZONE 'Europe/Paris')::date;
  d_ven date; d_mer date;
  g_lac uuid; g_pisc uuid; g_foot uuid; g_bar uuid; g_chateau uuid; g_run uuid;
  a_moules uuid; a_spectacle uuid;
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid; v6 uuid; v7 uuid; v8 uuid;
BEGIN
  SELECT id INTO v_camping FROM campings WHERE slug='lac-des-charmilles';
  IF v_camping IS NULL THEN RAISE EXCEPTION 'camping lac-des-charmilles introuvable'; END IF;
  IF EXISTS (SELECT 1 FROM vacanciers WHERE camping_id=v_camping AND device_id LIKE 'demo-lc-%') THEN
    RAISE EXCEPTION 'vacanciers d''exemple déjà présents';
  END IF;
  d_ven := j + ((5 - extract(isodow FROM j)::int + 7) % 7);
  d_mer := j + ((3 - extract(isodow FROM j)::int + 7) % 7);

  UPDATE campings SET carte_config = coalesce(carte_config,'{}'::jsonb) || '{"acces_libre": true}'::jsonb WHERE id=v_camping;

  INSERT INTO vacanciers (camping_id, device_id, pseudo, avatar_emoji, emplacement, tranche_age, avec, interests, date_depart) VALUES
    (v_camping,'demo-lc-1','Claire','🌞','7','36-45','famille',ARRAY['piscine','enfants'],j+7),
    (v_camping,'demo-lc-2','Patrick','🥾','14','60+','couple',ARRAY['rando','nature'],j+7),
    (v_camping,'demo-lc-3','Julien','⚽','22','36-45','famille',ARRAY['sport','enfants'],j+7),
    (v_camping,'demo-lc-4','Sanne','🚲','31','26-35','famille',ARRAY['velo','piscine'],j+7),
    (v_camping,'demo-lc-5','Martine','🍷','5','46-60','couple',ARRAY['apero','soirees'],j+7),
    (v_camping,'demo-lc-6','Thomas','🏃','18','26-35','amis',ARRAY['sport','rando'],j+7),
    (v_camping,'demo-lc-7','Nathalie','📸','26','46-60','couple',ARRAY['photo','culture'],j+7),
    (v_camping,'demo-lc-8','Bram','🎸','40','36-45','famille',ARRAY['musique','soirees'],j+7);
  SELECT id INTO v1 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-1';
  SELECT id INTO v2 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-2';
  SELECT id INTO v3 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-3';
  SELECT id INTO v4 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-4';
  SELECT id INTO v5 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-5';
  SELECT id INTO v6 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-6';
  SELECT id INTO v7 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-7';
  SELECT id INTO v8 FROM vacanciers WHERE camping_id=v_camping AND device_id='demo-lc-8';

  -- heure : ISO strict en UTC, comme l'app (toISOString).
  INSERT INTO groupes (camping_id, createur_id, titre, emoji, lieu, heure, actif) VALUES
    (v_camping,v1,'Piscine couverte avec les enfants','🏊','Piscine',to_char(((j+interval '15 hours') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true),
    (v_camping,v3,'Foot au terrain de sport','⚽','Terrain de sport',to_char(((j+interval '17 hours') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true),
    (v_camping,v5,'Apéro au bar','🍹','Bar',to_char(((j+interval '18 hours 30 minutes') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true),
    (v_camping,v6,'Footing au bord du lac','🏃','Lac',to_char(((j+interval '1 day 8 hours') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true),
    (v_camping,v2,'Balade autour du lac','🥾','Accueil',to_char(((j+interval '1 day 9 hours 30 minutes') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true),
    (v_camping,v7,'Visite du château des Matignon','🏰','Accueil',to_char(((j+interval '1 day 14 hours') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),true);
  SELECT id INTO g_pisc FROM groupes WHERE camping_id=v_camping AND titre='Piscine couverte avec les enfants';
  SELECT id INTO g_foot FROM groupes WHERE camping_id=v_camping AND titre='Foot au terrain de sport';
  SELECT id INTO g_bar FROM groupes WHERE camping_id=v_camping AND titre='Apéro au bar';
  SELECT id INTO g_run FROM groupes WHERE camping_id=v_camping AND titre='Footing au bord du lac';
  SELECT id INTO g_lac FROM groupes WHERE camping_id=v_camping AND titre='Balade autour du lac';
  SELECT id INTO g_chateau FROM groupes WHERE camping_id=v_camping AND titre='Visite du château des Matignon';

  INSERT INTO membres_groupes (groupe_id, vacancier_id) VALUES
    (g_pisc,v1),(g_pisc,v4),(g_pisc,v3),(g_foot,v3),(g_foot,v6),(g_foot,v8),(g_bar,v5),(g_bar,v8),(g_bar,v2),(g_bar,v7),
    (g_run,v6),(g_run,v4),(g_lac,v2),(g_lac,v7),(g_lac,v1),(g_chateau,v7),(g_chateau,v5)
  ON CONFLICT DO NOTHING;

  INSERT INTO messages (groupe_id, auteur_id, contenu, created_at) VALUES
    (g_pisc,v1,'Il pleut un peu, on file à la piscine couverte à 15 h avec les petits, qui vient ? 🏊',now()-interval '3 hours'),
    (g_pisc,v4,'Wij komen! On arrive avec nos deux garçons 😄',now()-interval '2 hours 30 minutes'),
    (g_foot,v3,'Petit foot à 17 h au terrain, parents et enfants bienvenus ⚽',now()-interval '4 hours'),
    (g_foot,v6,'Je ramène un ballon !',now()-interval '3 hours 40 minutes'),
    (g_bar,v5,'Apéro au bar vers 18 h 30 ? 🍷',now()-interval '2 hours'),
    (g_bar,v8,'Avec plaisir, on garde une table en terrasse',now()-interval '1 hour 30 minutes'),
    (g_lac,v2,'Tour du lac demain matin, départ de l''accueil à 9 h 30, tranquille',now()-interval '5 hours'),
    (g_chateau,v7,'Quelqu''un pour visiter le château des Matignon demain après-midi ? 📸',now()-interval '6 hours');

  -- La soirée moules-frites existe déjà (créée le 5/10) : on la ramène au prochain vendredi.
  UPDATE animations SET debut=(d_ven+interval '19 hours') AT TIME ZONE 'Europe/Paris', fin=(d_ven+interval '22 hours') AT TIME ZONE 'Europe/Paris'
   WHERE camping_id=v_camping AND titre='Soirée moules-frites';
  INSERT INTO animations (camping_id, titre, emoji, description, lieu, debut, fin, places_max, publiee) VALUES
    (v_camping,'Dîner-spectacle','🎭','Dîner-spectacle au restaurant (exemple : jour et horaire à confirmer).','Restaurant du camping',
       (d_mer+interval '19 hours 30 minutes') AT TIME ZONE 'Europe/Paris',(d_mer+interval '23 hours') AT TIME ZONE 'Europe/Paris',60,true);
  SELECT id INTO a_moules FROM animations WHERE camping_id=v_camping AND titre='Soirée moules-frites' LIMIT 1;
  SELECT id INTO a_spectacle FROM animations WHERE camping_id=v_camping AND titre='Dîner-spectacle';
  INSERT INTO inscriptions (animation_id, vacancier_id) VALUES
    (a_moules,v1),(a_moules,v2),(a_moules,v5),(a_moules,v7),(a_moules,v8),(a_moules,v3),
    (a_spectacle,v5),(a_spectacle,v2),(a_spectacle,v7)
  ON CONFLICT DO NOTHING;

  INSERT INTO demo_prospects (camping_id) VALUES (v_camping) ON CONFLICT DO NOTHING;
END $$;
SELECT public.rafraichir_demos_prospects();
SELECT c.slug,(SELECT count(*) FROM groupes g WHERE g.camping_id=c.id) groupes,
  (SELECT count(*) FROM animations a WHERE a.camping_id=c.id AND a.fin > now()) animations_a_venir,
  (SELECT count(*) FROM vacanciers v WHERE v.camping_id=c.id) vacanciers
FROM campings c WHERE slug='lac-des-charmilles';
