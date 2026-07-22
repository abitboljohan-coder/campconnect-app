-- ═══════════════════════════════════════════════════════════════════════════
-- RESET VACANCIERS — Script pratique
-- ───────────────────────────────────────────────────────────────────────────
-- Supprime TOUS les vacanciers + données en cascade (messages, groupes joins, etc)
-- Préserve: campings, gerants, animations, groupes (empty), chats (orphelins)
--
-- Usage: Coller dans Supabase SQL Editor et exécuter
-- ⚠️ À utiliser UNIQUEMENT en dev/test, JAMAIS en production
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérification pré-reset
SELECT
  (SELECT COUNT(*) FROM vacanciers) as vacanciers_avant,
  (SELECT COUNT(*) FROM gerants) as gerants_preserves,
  (SELECT COUNT(*) FROM campings) as campings_preserves,
  (SELECT COUNT(*) FROM inscriptions) as inscriptions_avant,
  (SELECT COUNT(*) FROM membres_groupes) as membres_avant;

-- RESET (cascade automatique via FK)
BEGIN;
  DELETE FROM vacanciers;

  -- Vérification immédiate
  SELECT COUNT(*) as vacanciers_apres FROM vacanciers;
  SELECT COUNT(*) as gerants_OK FROM gerants;

COMMIT;

-- Confirmation post-reset
SELECT
  (SELECT COUNT(*) FROM vacanciers) as vacanciers_apres,
  (SELECT COUNT(*) FROM gerants) as gerants_OK,
  (SELECT COUNT(*) FROM campings) as campings_OK,
  (SELECT COUNT(*) FROM inscriptions) as inscriptions_apres,
  (SELECT COUNT(*) FROM membres_groupes) as membres_apres;

-- ═══════════════════════════════════════════════════════════════════════════
-- RESET PAR CAMPING (garder autres campings intacts)
-- ───────────────────────────────────────────────────────────────────────────

-- Example: supprimer vacanciers du camping avec slug 'camping-a'
-- BEGIN;
--   DELETE FROM vacanciers
--     WHERE camping_id = (SELECT id FROM campings WHERE slug = 'camping-a');
-- COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- RESET PAR DATE (ex: données créées aujourd'hui)
-- ───────────────────────────────────────────────────────────────────────────

-- Supprimer vacanciers créés depuis 24h
-- BEGIN;
--   DELETE FROM vacanciers
--     WHERE created_at >= (NOW() - interval '1 day');
-- COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- INSPECTION FINE — Avant/Après per Camping
-- ───────────────────────────────────────────────────────────────────────────

-- SELECT
--   c.slug,
--   c.nom,
--   COUNT(v.id) as vacanciers,
--   COUNT(DISTINCT g.id) as groupes_actifs,
--   COUNT(DISTINCT a.id) as animations,
--   COUNT(DISTINCT gr.id) as gerants_ce_camping
-- FROM campings c
--   LEFT JOIN vacanciers v ON v.camping_id = c.id
--   LEFT JOIN groupes g ON g.camping_id = c.id AND g.actif = true
--   LEFT JOIN animations a ON a.camping_id = c.id AND a.publiee = true
--   LEFT JOIN gerants gr ON gr.camping_id = c.id
-- GROUP BY c.id, c.slug, c.nom
-- ORDER BY c.slug;
