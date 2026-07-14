-- ============================================================
-- CAMPCONNECT — MIGRATION COMPLÈTE
-- À jouer une fois sur un nouveau projet Supabase (SQL Editor)
-- Ordre : schéma → storage → realtime → seed démo
-- ============================================================

-- === 1. EXTENSIONS ===========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === 2. TABLES ===============================================

-- Campings (multi-tenant)
CREATE TABLE IF NOT EXISTS campings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz DEFAULT now(),
  slug                text UNIQUE NOT NULL,
  nom                 text NOT NULL,
  description         text,
  couleur_principale  text DEFAULT '#639922',
  couleur_secondaire  text DEFAULT '#1a4d1a',
  logo_url            text,
  plan_url            text,
  plan_bounds         jsonb,               -- { nw:[lat,lng], ne:[...], se:[...], sw:[...] }
  carte_config        jsonb DEFAULT '{}'::jsonb,
  infos               jsonb DEFAULT '{}'::jsonb
);

-- Gérants (auth Supabase)
CREATE TABLE IF NOT EXISTS gerants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  camping_id  uuid REFERENCES campings(id) ON DELETE CASCADE,
  email       text
);

-- Vacanciers (pas d'auth, device_id + camping_id)
CREATE TABLE IF NOT EXISTS vacanciers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  camping_id    uuid REFERENCES campings(id) ON DELETE CASCADE,
  device_id     text,
  pseudo        text NOT NULL,
  avatar_emoji  text DEFAULT '🙂',
  emplacement   text,
  tranche_age   text,
  avec          text,
  interests     text[]
);
CREATE INDEX IF NOT EXISTS idx_vacanciers_device ON vacanciers(device_id, camping_id);
CREATE INDEX IF NOT EXISTS idx_vacanciers_camping ON vacanciers(camping_id);

-- Animations
CREATE TABLE IF NOT EXISTS animations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  camping_id   uuid REFERENCES campings(id) ON DELETE CASCADE,
  titre        text NOT NULL,
  emoji        text DEFAULT '🎉',
  description  text,
  lieu         text,
  debut        timestamptz,
  fin          timestamptz,
  places_max   int,
  publiee      boolean DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_animations_camping ON animations(camping_id, debut);

-- Groupes spontanés
CREATE TABLE IF NOT EXISTS groupes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  camping_id  uuid REFERENCES campings(id) ON DELETE CASCADE,
  titre       text NOT NULL,
  emoji       text DEFAULT '👥',
  lieu        text,
  heure       text,
  actif       boolean DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_groupes_camping ON groupes(camping_id, actif);

-- Membres de groupes
CREATE TABLE IF NOT EXISTS membres_groupes (
  groupe_id     uuid REFERENCES groupes(id) ON DELETE CASCADE,
  vacancier_id  uuid REFERENCES vacanciers(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (groupe_id, vacancier_id)
);

-- Inscriptions animations
CREATE TABLE IF NOT EXISTS inscriptions (
  animation_id  uuid REFERENCES animations(id) ON DELETE CASCADE,
  vacancier_id  uuid REFERENCES vacanciers(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (animation_id, vacancier_id)
);

-- Messages (chat temps réel)
CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  groupe_id     uuid REFERENCES groupes(id) ON DELETE CASCADE,
  vacancier_id  uuid REFERENCES vacanciers(id) ON DELETE CASCADE,
  contenu       text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_groupe ON messages(groupe_id, created_at);

-- Positions live (pour la carte type Snap Map)
CREATE TABLE IF NOT EXISTS positions (
  vacancier_id  uuid PRIMARY KEY REFERENCES vacanciers(id) ON DELETE CASCADE,
  camping_id    uuid REFERENCES campings(id) ON DELETE CASCADE,
  lat           double precision,
  lng           double precision,
  mode          text DEFAULT 'visible', -- 'visible' | 'emplacement' | 'ghost'
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_positions_camping ON positions(camping_id, updated_at);

-- Candidatures (site vitrine → email)
CREATE TABLE IF NOT EXISTS candidatures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  nom           text,
  email         text,
  camping       text,
  emplacements  int,
  message       text
);

-- === 3. STORAGE ==============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('camping-assets', 'camping-assets', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
DROP POLICY IF EXISTS "public read camping-assets" ON storage.objects;
CREATE POLICY "public read camping-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'camping-assets');

-- Upload/update/delete par gérants authentifiés
DROP POLICY IF EXISTS "auth write camping-assets" ON storage.objects;
CREATE POLICY "auth write camping-assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'camping-assets')
  WITH CHECK (bucket_id = 'camping-assets');

-- === 3.5 RLS DÉSACTIVÉE (comme l'ancien projet — à sécuriser plus tard)
ALTER TABLE campings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE gerants          DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacanciers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE animations       DISABLE ROW LEVEL SECURITY;
ALTER TABLE groupes          DISABLE ROW LEVEL SECURITY;
ALTER TABLE membres_groupes  DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions     DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions        DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidatures     DISABLE ROW LEVEL SECURITY;

-- === 4. REALTIME =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE campings;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE positions;
ALTER PUBLICATION supabase_realtime ADD TABLE groupes;
ALTER PUBLICATION supabase_realtime ADD TABLE inscriptions;

-- === 5. SEED DÉMO : Camping "Les Pins Verts" =================
DO $$
DECLARE
  cid uuid;
BEGIN
  INSERT INTO campings (slug, nom, description, couleur_principale, couleur_secondaire)
  VALUES ('les-pins-verts', 'Camping Les Pins Verts',
          'Camping familial au cœur des pins', '#639922', '#1a4d1a')
  ON CONFLICT (slug) DO UPDATE SET nom = EXCLUDED.nom
  RETURNING id INTO cid;

  IF cid IS NULL THEN
    SELECT id INTO cid FROM campings WHERE slug = 'les-pins-verts';
  END IF;

  -- 4 groupes actifs
  INSERT INTO groupes (camping_id, titre, emoji, lieu, actif) VALUES
    (cid, 'Rando du matin',   '🥾', 'Accueil',           true),
    (cid, 'Apéro plage',      '🍹', 'Plage',             true),
    (cid, 'Pétanque',         '🎳', 'Terrain pétanque',  true),
    (cid, 'BBQ soirée',       '🍖', 'Zone BBQ',          true)
  ON CONFLICT DO NOTHING;

  -- 12 animations pré-créées
  INSERT INTO animations (camping_id, titre, emoji, lieu, debut, places_max, publiee, description) VALUES
    (cid, 'Tournoi pétanque',      '🎳', 'Terrain pétanque',  now() + interval '1 day' + interval '10h', 30,   true, 'Par équipes de 2'),
    (cid, 'Soirée barbecue',       '🍖', 'Zone BBQ',          now() + interval '2 days' + interval '19h', NULL, true, 'Musique live'),
    (cid, 'Randonnée découverte',  '🥾', 'Accueil',           now() + interval '3 days' + interval '9h',  20,   true, '8 km, débutant'),
    (cid, 'Atelier poterie kids',  '🎨', 'Salle activités',   now() + interval '4 days' + interval '14h', 15,   true, '6-12 ans'),
    (cid, 'Yoga du matin',         '🧘', 'Pelouse centrale',  now() + interval '5 days' + interval '8h',  25,   true, 'Tapis conseillé'),
    (cid, 'Aqua-gym',              '🏊', 'Piscine',           now() + interval '1 day' + interval '11h',  20,   true, ''),
    (cid, 'Karaoké',               '🎤', 'Bar',               now() + interval '3 days' + interval '21h', NULL, true, ''),
    (cid, 'Cours de tennis',       '🎾', 'Court tennis',      now() + interval '2 days' + interval '17h', 8,    true, ''),
    (cid, 'Concert acoustique',    '🎸', 'Snack',             now() + interval '6 days' + interval '20h', NULL, true, ''),
    (cid, 'Chasse au trésor',      '🗺️', 'Camping',          now() + interval '4 days' + interval '10h', 40,   true, 'Familles'),
    (cid, 'Tournoi ping-pong',     '🏓', 'Espace jeux',       now() + interval '5 days' + interval '15h', 16,   true, ''),
    (cid, 'Marché nocturne',       '🌙', 'Entrée',            now() + interval '7 days' + interval '18h', NULL, true, 'Producteurs locaux')
  ON CONFLICT DO NOTHING;
END $$;

-- === 6. GÉRANT DÉMO ==========================================
-- À faire manuellement dans Dashboard → Authentication → Users → Add user :
--   Email    : gerant@les-pins-verts.fr
--   Password : PinsVerts2026!
-- Puis lier au camping :
--
-- INSERT INTO gerants (user_id, camping_id, email)
-- SELECT
--   (SELECT id FROM auth.users WHERE email = 'gerant@les-pins-verts.fr'),
--   (SELECT id FROM campings WHERE slug = 'les-pins-verts'),
--   'gerant@les-pins-verts.fr';

-- === FIN =====================================================
