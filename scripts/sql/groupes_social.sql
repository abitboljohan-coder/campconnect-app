-- ═══════════════════════════════════════════════════════════════════════════
-- GROUPES : colonnes manquantes (createur + capacité max)
-- ───────────────────────────────────────────────────────────────────────────
-- Le formulaire vacancier (Groupes.jsx) enregistre le créateur du groupe et un
-- nombre maximum de membres. Ces deux colonnes manquaient → l'insertion échouait
-- silencieusement et le groupe ne se créait pas.
--
-- Usage : coller dans Supabase SQL Editor et exécuter. Sans risque (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE groupes ADD COLUMN IF NOT EXISTS createur_id uuid REFERENCES vacanciers(id) ON DELETE SET NULL;
ALTER TABLE groupes ADD COLUMN IF NOT EXISTS max_membres int;

-- Vérification
SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'groupes'
  ORDER BY ordinal_position;
