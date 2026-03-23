-- ============================================================
-- SETUP MAP — CampConnect
-- Copiez ce SQL dans Supabase → SQL Editor → Run
-- ============================================================

-- 1. Ajouter la colonne carte_config si elle n'existe pas
ALTER TABLE campings
  ADD COLUMN IF NOT EXISTS carte_config jsonb DEFAULT '{}'::jsonb;

-- 2. Activer le Realtime sur la table campings
--    (permet la mise à jour automatique côté vacancier quand l'admin sauvegarde)
ALTER PUBLICATION supabase_realtime ADD TABLE campings;
