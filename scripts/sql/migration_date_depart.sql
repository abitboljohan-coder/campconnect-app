-- ═══════════════════════════════════════════════════════════════
-- Migration : dates de séjour + purge RGPD
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE vacanciers ADD COLUMN IF NOT EXISTS date_depart date;

CREATE INDEX IF NOT EXISTS idx_vacanciers_depart ON vacanciers(camping_id, date_depart);

-- ─── Purge RGPD : 30 jours après le départ ──────────────────────
-- Anonymise les messages (le fil de discussion reste cohérent) puis
-- supprime le profil. Nécessite l'extension pg_cron (Dashboard →
-- Database → Extensions → pg_cron).

CREATE OR REPLACE FUNCTION purge_vacanciers_partis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Messages : détacher l'auteur (auteur_id NULL = « Vacancier parti »)
  UPDATE messages SET auteur_id = NULL
  WHERE auteur_id IN (
    SELECT id FROM vacanciers
    WHERE date_depart IS NOT NULL AND date_depart < current_date - 30
  );

  -- Profils : suppression (membres_groupes / inscriptions / positions
  -- suivent via ON DELETE CASCADE)
  DELETE FROM vacanciers
  WHERE date_depart IS NOT NULL AND date_depart < current_date - 30;
END;
$$;

-- messages.auteur_id doit tolérer NULL après purge
ALTER TABLE messages ALTER COLUMN auteur_id DROP NOT NULL;

SELECT cron.schedule(
  'purge-vacanciers-partis',
  '15 4 * * *',  -- tous les jours à 4h15 UTC
  $$SELECT purge_vacanciers_partis()$$
);
