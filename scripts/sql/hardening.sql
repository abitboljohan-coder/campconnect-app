-- ═══════════════════════════════════════════════════════════════
-- Hardening base — état au 2026-07-16
-- Migrations Supabase appliquées :
--   20260716… date_depart_sejour_purge_rgpd   ✅ appliquée
--   20260716… hardening_indexes_cleanup       ✅ appliquée
--   tighten_grp_update_storage_listing        ✅ appliquée
-- ═══════════════════════════════════════════════════════════════

-- ─── hardening_indexes_cleanup (appliquée) ──────────────────────

-- is_gerant : search_path fixé + auth.uid() en initplan (évalué 1x par requête)
CREATE OR REPLACE FUNCTION is_gerant(cid uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM gerants
    WHERE user_id = (SELECT auth.uid()) AND camping_id = cid
  );
$$;

-- Fonctions internes : pas d'exécution via l'API REST
REVOKE EXECUTE ON FUNCTION purge_vacanciers_partis() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_gerant(uuid) FROM PUBLIC, anon;
-- authenticated garde EXECUTE sur is_gerant : requis par les policies RLS des gérants

-- Index couvrants sur les clés étrangères + requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_gerants_camping        ON gerants(camping_id);
CREATE INDEX IF NOT EXISTS idx_gerants_user           ON gerants(user_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_vacancier ON inscriptions(vacancier_id);
CREATE INDEX IF NOT EXISTS idx_membres_vacancier      ON membres_groupes(vacancier_id);
CREATE INDEX IF NOT EXISTS idx_messages_auteur        ON messages(auteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_groupe        ON messages(groupe_id, created_at);
CREATE INDEX IF NOT EXISTS idx_statuts_vacancier      ON statuts(vacancier_id);
CREATE INDEX IF NOT EXISTS idx_animations_camping_debut ON animations(camping_id, debut);
CREATE INDEX IF NOT EXISTS idx_groupes_camping        ON groupes(camping_id, actif);

-- Policies gérants : auth.uid() en initplan
DROP POLICY IF EXISTS gerants_read   ON gerants;
DROP POLICY IF EXISTS gerants_insert ON gerants;
CREATE POLICY gerants_read ON gerants FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY gerants_insert ON gerants FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- animations : éviter le double-check SELECT (anim_read + anim_write FOR ALL)
DROP POLICY IF EXISTS anim_write ON animations;
CREATE POLICY anim_insert ON animations FOR INSERT TO authenticated
  WITH CHECK (is_gerant(camping_id));
CREATE POLICY anim_update ON animations FOR UPDATE TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));
CREATE POLICY anim_delete ON animations FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ─── tighten_grp_update_storage_listing (appliquée) ─────────────

-- grp_update : aucune mise à jour de groupe côté vacancier dans l'app → gérants uniquement
DROP POLICY IF EXISTS grp_update ON groupes;
CREATE POLICY grp_update ON groupes FOR UPDATE TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));

-- Bucket public : les fichiers restent servis par URL publique,
-- mais on retire le listing anonyme du bucket (l'app n'utilise que getPublicUrl)
DROP POLICY IF EXISTS "public read camping-assets" ON storage.objects;

-- ─── Warnings restants (assumés, documentés) ────────────────────
-- • vac_update / mg_all / ins_all / pos_all / msg_update / grp_insert
--   en USING(true) : inhérent au modèle vacancier sans compte (deviceId).
--   Le vrai fix = Supabase anonymous auth + claim camping_id (roadmap).
-- • campings_insert WITH CHECK(true) : self-service signup gérant, voulu.
-- • cand_insert : formulaire public de candidature, voulu.
-- • is_gerant exécutable par authenticated : requis par les policies RLS.
-- • Leaked password protection : à activer dans le Dashboard
--   (Authentication → Providers → Email → Password security).
