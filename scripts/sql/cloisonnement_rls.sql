-- ═══════════════════════════════════════════════════════════════════════════
-- CLOISONNEMENT SERVEUR PAR CAMPING (auth anonyme + RLS)
-- ───────────────────────────────────────────────────────────────────────────
-- Objectif : chaque vacancier reçoit une identité auth anonyme (aucun compte à
-- créer). Toutes les données vacancier sont désormais filtrées CÔTÉ BASE par le
-- camping du vacancier connecté — impossible de lire/modifier un autre camping,
-- même en appelant l'API directement avec la clé anon.
--
-- ⚠️ PRÉREQUIS DASHBOARD : Authentication → Sign In / Providers →
--    activer « Allow anonymous sign-ins ». Sinon l'app ne peut pas se connecter.
-- ⚠️ À déployer EN MÊME TEMPS que la nouvelle version du client (qui fait
--    signInAnonymously + écrit vacanciers.user_id).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Identité auth du vacancier ───────────────────────────────────────────
ALTER TABLE vacanciers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vacanciers_user ON vacanciers(user_id);

-- ── 2. Fonctions d'aide (SECURITY DEFINER → contournent la RLS sans récursion)─
CREATE OR REPLACE FUNCTION my_vacancier_id() RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id FROM vacanciers WHERE user_id = (SELECT auth.uid()) LIMIT 1
$$;

CREATE OR REPLACE FUNCTION my_camping_id() RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT camping_id FROM vacanciers WHERE user_id = (SELECT auth.uid()) LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION my_vacancier_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION my_camping_id()  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION my_vacancier_id() TO authenticated;
GRANT  EXECUTE ON FUNCTION my_camping_id()  TO authenticated;

-- ── 3. Purge de TOUTES les policies existantes sur les tables vacancier ──────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('vacanciers','messages','membres_groupes','inscriptions',
                        'positions','statuts','groupes','animations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- RLS active + accès de base pour le rôle authenticated (inclut les anonymes)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vacanciers','messages','membres_groupes','inscriptions',
                           'positions','statuts','groupes','animations']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ── 3b. CAMPINGS : lecture publique (recherche onboarding) anon + authenticated
-- Les vacanciers passent de anon à authenticated : on garantit qu'ils lisent
-- toujours la liste des campings.
DROP POLICY IF EXISTS campings_public_read ON campings;
CREATE POLICY campings_public_read ON campings FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON campings TO anon, authenticated;

-- ── 4. VACANCIERS ───────────────────────────────────────────────────────────
CREATE POLICY vac_select ON vacanciers FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR camping_id = my_camping_id() OR is_gerant(camping_id));
CREATE POLICY vac_insert ON vacanciers FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY vac_update ON vacanciers FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_gerant(camping_id))
  WITH CHECK (user_id = (SELECT auth.uid()) OR is_gerant(camping_id));
CREATE POLICY vac_delete ON vacanciers FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_gerant(camping_id));

-- ── 5. GROUPES ──────────────────────────────────────────────────────────────
CREATE POLICY grp_select ON groupes FOR SELECT TO authenticated
  USING (camping_id = my_camping_id() OR is_gerant(camping_id));
CREATE POLICY grp_insert ON groupes FOR INSERT TO authenticated
  WITH CHECK (camping_id = my_camping_id() OR is_gerant(camping_id));
CREATE POLICY grp_update ON groupes FOR UPDATE TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));
CREATE POLICY grp_delete ON groupes FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ── 6. ANIMATIONS (gérées par le gérant) ────────────────────────────────────
CREATE POLICY anim_select ON animations FOR SELECT TO authenticated
  USING (camping_id = my_camping_id() OR is_gerant(camping_id));
CREATE POLICY anim_insert ON animations FOR INSERT TO authenticated
  WITH CHECK (is_gerant(camping_id));
CREATE POLICY anim_update ON animations FOR UPDATE TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));
CREATE POLICY anim_delete ON animations FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ── 7. MESSAGES (chat de groupe) ────────────────────────────────────────────
-- Un message appartient à un groupe → on borne au camping du groupe.
CREATE POLICY msg_select ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM groupes g WHERE g.id = messages.groupe_id
                 AND (g.camping_id = my_camping_id() OR is_gerant(g.camping_id))));
CREATE POLICY msg_insert ON messages FOR INSERT TO authenticated
  WITH CHECK (auteur_id = my_vacancier_id()
              AND EXISTS (SELECT 1 FROM groupes g WHERE g.id = groupe_id AND g.camping_id = my_camping_id()));
-- UPDATE = réactions (posées aussi sur les messages des autres) → borné au camping.
CREATE POLICY msg_update ON messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM groupes g WHERE g.id = messages.groupe_id
                 AND (g.camping_id = my_camping_id() OR is_gerant(g.camping_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM groupes g WHERE g.id = messages.groupe_id
                 AND (g.camping_id = my_camping_id() OR is_gerant(g.camping_id))));
CREATE POLICY msg_delete ON messages FOR DELETE TO authenticated
  USING (auteur_id = my_vacancier_id()
         OR EXISTS (SELECT 1 FROM groupes g WHERE g.id = messages.groupe_id AND is_gerant(g.camping_id)));

-- ── 8. Tables liées au vacancier (membre, inscription, statut, position) ─────
-- SELECT : rows dont le vacancier appartient à mon camping (ou gérant).
-- WRITE  : uniquement mes propres rows (ou gérant pour la modération).
CREATE POLICY mg_select ON membres_groupes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = membres_groupes.vacancier_id
                 AND (v.camping_id = my_camping_id() OR is_gerant(v.camping_id))));
CREATE POLICY mg_insert ON membres_groupes FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY mg_delete ON membres_groupes FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id()
         OR EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = membres_groupes.vacancier_id AND is_gerant(v.camping_id)));

CREATE POLICY ins_select ON inscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = inscriptions.vacancier_id
                 AND (v.camping_id = my_camping_id() OR is_gerant(v.camping_id))));
CREATE POLICY ins_insert ON inscriptions FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY ins_delete ON inscriptions FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id()
         OR EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = inscriptions.vacancier_id AND is_gerant(v.camping_id)));

CREATE POLICY stat_select ON statuts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = statuts.vacancier_id
                 AND (v.camping_id = my_camping_id() OR is_gerant(v.camping_id))));
CREATE POLICY stat_insert ON statuts FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY stat_delete ON statuts FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id()
         OR EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = statuts.vacancier_id AND is_gerant(v.camping_id)));

CREATE POLICY pos_select ON positions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = positions.vacancier_id
                 AND (v.camping_id = my_camping_id() OR is_gerant(v.camping_id))));
CREATE POLICY pos_insert ON positions FOR INSERT TO authenticated
  WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY pos_update ON positions FOR UPDATE TO authenticated
  USING (vacancier_id = my_vacancier_id()) WITH CHECK (vacancier_id = my_vacancier_id());
CREATE POLICY pos_delete ON positions FOR DELETE TO authenticated
  USING (vacancier_id = my_vacancier_id()
         OR EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = positions.vacancier_id AND is_gerant(v.camping_id)));

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (à n'exécuter QUE si la nouvelle version casse quelque chose) :
-- rétablit un accès ouvert le temps de diagnostiquer.
-- ───────────────────────────────────────────────────────────────────────────
-- DO $$ DECLARE r record; BEGIN
--   FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
--     AND tablename IN ('vacanciers','messages','membres_groupes','inscriptions',
--                       'positions','statuts','groupes','animations')
--   LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); END LOOP;
--   FOREACH r.tablename IN ARRAY ARRAY['vacanciers','messages','membres_groupes','inscriptions',
--                                      'positions','statuts','groupes','animations']
--   LOOP
--     EXECUTE format('CREATE POLICY open_all ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', r.tablename);
--     EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', r.tablename);
--   END LOOP;
-- END $$;
-- ═══════════════════════════════════════════════════════════════════════════
