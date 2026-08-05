-- ═══════════════════════════════════════════════════════════════════════════
-- SIGNALEMENT DE CONTENU ET BLOCAGE ENTRE VACANCIERS
-- ───────────────────────────────────────────────────────────────────────────
-- Apple (règle 1.2) et Google exigent, pour toute application dont le contenu
-- est publié par ses utilisateurs, trois choses : pouvoir signaler un contenu,
-- pouvoir bloquer son auteur, et un contact publié. Les deux premières
-- manquaient : le bouton « Signaler » de l'application remonte un problème
-- matériel du camping (propreté, panne, bruit), pas un message ni un vacancier.
--
-- Idempotent : peut être relancé sans effet.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Rattacher un signalement à un contenu précis ─────────────────────────
-- La table existante est réutilisée : le gérant traite déjà les signalements
-- depuis son tableau de bord, et lui en donner deux à surveiller serait le
-- meilleur moyen qu'il en oublie un.
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS cible_type text;   -- message | statut | annonce
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS cible_id   uuid;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS cible_texte text;  -- copie du contenu au moment du signalement
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS auteur_signale_id uuid REFERENCES vacanciers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_signalements_cible ON signalements(camping_id, cible_type, created_at DESC);

COMMENT ON COLUMN signalements.cible_texte IS
  'Copie du contenu signalé. Le message d''origine peut être supprimé par son auteur avant que le gérant ne traite le signalement : sans cette copie, il n''aurait plus rien à examiner.';

-- ── 2. Blocages entre vacanciers ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocages (
  vacancier_id uuid NOT NULL REFERENCES vacanciers(id) ON DELETE CASCADE,
  bloque_id    uuid NOT NULL REFERENCES vacanciers(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (vacancier_id, bloque_id),
  CONSTRAINT blocage_pas_soi_meme CHECK (vacancier_id <> bloque_id)
);
CREATE INDEX IF NOT EXISTS idx_blocages_vacancier ON blocages(vacancier_id);

ALTER TABLE blocages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON blocages TO authenticated;
REVOKE ALL ON blocages FROM anon;

DROP POLICY IF EXISTS blo_select ON blocages;
DROP POLICY IF EXISTS blo_insert ON blocages;
DROP POLICY IF EXISTS blo_delete ON blocages;

-- Un blocage ne regarde que celui qui l'a posé. Personne d'autre ne le voit :
-- la personne bloquée continue de publier sans savoir qu'elle est masquée,
-- ce qui évite les représailles.
CREATE POLICY blo_select ON blocages FOR SELECT TO authenticated
  USING (vacancier_id = my_vacancier_id());
CREATE POLICY blo_insert ON blocages FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY blo_delete ON blocages FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id());

-- ── 3. Vérification ─────────────────────────────────────────────────────────
SELECT 'signalements' AS table_nom,
       string_agg(column_name, ', ' ORDER BY column_name) AS colonnes_ajoutees
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signalements'
  AND column_name IN ('cible_type','cible_id','cible_texte','auteur_signale_id')
UNION ALL
SELECT 'blocages',
       coalesce((SELECT count(*)::text || ' policies'
                 FROM pg_policies WHERE tablename = 'blocages'), 'ABSENTE');
