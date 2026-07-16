-- ═══════════════════════════════════════════════════════════════
-- REMISE À ZÉRO PRODUCTION — ⚠️ DESTRUCTIF, IRRÉVERSIBLE
-- Supprime TOUTES les données (campings, gérants, vacanciers, contenus).
-- Chaque camping devra être recréé via le signup gérant (/admin).
-- ═══════════════════════════════════════════════════════════════

BEGIN;

TRUNCATE messages, membres_groupes, inscriptions, positions, statuts,
         groupes, animations, vacanciers, candidatures, gerants, campings
  CASCADE;

-- Comptes gérants (auth) : supprime aussi les logins existants
DELETE FROM auth.users;

COMMIT;

-- ─── Contrainte : 1 compte gérant = 1 camping ───────────────────
-- Un même login ne peut pas gérer plusieurs campings ; chaque camping
-- différent exige la création d'un nouveau compte.
ALTER TABLE gerants ADD CONSTRAINT gerants_user_unique UNIQUE (user_id);
