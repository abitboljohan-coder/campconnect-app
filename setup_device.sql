-- ============================================================
-- SETUP DEVICE ID — CampConnect
-- Copiez ce SQL dans Supabase → SQL Editor → Run
-- ============================================================

-- Colonne device_id sur les vacanciers (identifiant unique par appareil)
ALTER TABLE vacanciers
  ADD COLUMN IF NOT EXISTS device_id text;

-- Index pour les lookups rapides (recherche par device_id + camping_id)
CREATE INDEX IF NOT EXISTS idx_vacanciers_device_id
  ON vacanciers(device_id, camping_id);
