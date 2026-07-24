-- ═══════════════════════════════════════════════════════════════════════════
-- SIGNALEMENTS + PETITES ANNONCES
-- ───────────────────────────────────────────────────────────────────────────
-- • signalements : le vacancier signale un problème (fuite, poubelle pleine…)
--   avec photo optionnelle → le gérant le traite depuis son dashboard.
-- • annonces : petites annonces et objets trouvés entre vacanciers.
--
-- Les deux tables sont cloisonnées par camping (mêmes règles RLS que le reste).
-- Usage : coller dans Supabase SQL Editor et exécuter.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. SIGNALEMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signalements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  camping_id   uuid REFERENCES campings(id)   ON DELETE CASCADE,
  vacancier_id uuid REFERENCES vacanciers(id) ON DELETE SET NULL,
  categorie    text NOT NULL DEFAULT 'autre',  -- proprete | panne | securite | bruit | autre
  description  text NOT NULL,
  lieu         text,
  photo_url    text,
  lat          double precision,
  lng          double precision,
  statut       text NOT NULL DEFAULT 'nouveau', -- nouveau | en_cours | resolu
  traite_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_signalements_camping ON signalements(camping_id, statut, created_at DESC);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON signalements TO authenticated;
REVOKE ALL ON signalements FROM anon;

DROP POLICY IF EXISTS sig_select ON signalements;
DROP POLICY IF EXISTS sig_insert ON signalements;
DROP POLICY IF EXISTS sig_update ON signalements;
DROP POLICY IF EXISTS sig_delete ON signalements;

-- Le vacancier voit ses propres signalements ; le gérant voit ceux de son camping.
CREATE POLICY sig_select ON signalements FOR SELECT TO authenticated
  USING (vacancier_id = my_vacancier_id() OR is_gerant(camping_id));
CREATE POLICY sig_insert ON signalements FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id() AND camping_id = my_camping_id());
-- Seul le gérant change le statut.
CREATE POLICY sig_update ON signalements FOR UPDATE TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));
CREATE POLICY sig_delete ON signalements FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id() OR is_gerant(camping_id));

-- ── 2. ANNONCES (petites annonces / objets trouvés) ─────────────────────────
CREATE TABLE IF NOT EXISTS annonces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  camping_id   uuid REFERENCES campings(id)   ON DELETE CASCADE,
  vacancier_id uuid REFERENCES vacanciers(id) ON DELETE CASCADE,
  type         text NOT NULL DEFAULT 'annonce', -- annonce | trouve | perdu
  titre        text NOT NULL,
  description  text,
  photo_url    text,
  resolu       boolean DEFAULT false,
  expire_at    timestamptz DEFAULT (now() + interval '14 days')
);
CREATE INDEX IF NOT EXISTS idx_annonces_camping ON annonces(camping_id, created_at DESC);

ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON annonces TO authenticated;
REVOKE ALL ON annonces FROM anon;

DROP POLICY IF EXISTS ann_select ON annonces;
DROP POLICY IF EXISTS ann_insert ON annonces;
DROP POLICY IF EXISTS ann_update ON annonces;
DROP POLICY IF EXISTS ann_delete ON annonces;

-- Tous les vacanciers du camping voient les annonces (c'est le but) ; gérant aussi.
CREATE POLICY ann_select ON annonces FOR SELECT TO authenticated
  USING (camping_id = my_camping_id() OR is_gerant(camping_id));
CREATE POLICY ann_insert ON annonces FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id() AND camping_id = my_camping_id());
-- L'auteur marque son annonce comme résolue ; le gérant peut modérer.
CREATE POLICY ann_update ON annonces FOR UPDATE TO authenticated
  USING (vacancier_id = my_vacancier_id() OR is_gerant(camping_id))
  WITH CHECK (vacancier_id = my_vacancier_id() OR is_gerant(camping_id));
CREATE POLICY ann_delete ON annonces FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id() OR is_gerant(camping_id));

-- ── 3. STORAGE : cloisonner les dépôts de photos ────────────────────────────
-- Avant : tout utilisateur authentifié (donc tout vacancier) pouvait écrire
-- n'importe où dans « camping-assets » — y compris écraser le logo du camping.
-- Après : les vacanciers ne peuvent déposer que dans signalements/ et annonces/ ;
-- le reste du bucket reste réservé aux gérants.

DROP POLICY IF EXISTS "auth write camping-assets" ON storage.objects;

-- Gérants : accès complet au bucket
DROP POLICY IF EXISTS "gerant write camping-assets" ON storage.objects;
CREATE POLICY "gerant write camping-assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'camping-assets' AND EXISTS (SELECT 1 FROM gerants g WHERE g.user_id = (SELECT auth.uid())))
  WITH CHECK (bucket_id = 'camping-assets' AND EXISTS (SELECT 1 FROM gerants g WHERE g.user_id = (SELECT auth.uid())));

-- Vacanciers : dépôt uniquement dans signalements/ et annonces/
DROP POLICY IF EXISTS "vacancier upload photos" ON storage.objects;
CREATE POLICY "vacancier upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'camping-assets'
    AND (name LIKE 'signalements/%' OR name LIKE 'annonces/%')
  );

-- ── 4. Vérification ─────────────────────────────────────────────────────────
SELECT
  to_regclass('public.signalements') AS table_signalements,
  to_regclass('public.annonces')     AS table_annonces,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'signalements') AS policies_signalements,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'annonces')     AS policies_annonces;
