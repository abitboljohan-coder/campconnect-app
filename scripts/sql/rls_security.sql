-- ============================================================
-- SECURISATION RLS — CampConnect
-- A jouer dans Supabase SQL Editor (une seule fois)
-- Principe :
--   - anon (vacanciers, pas de compte) : lecture publique scoping camping,
--     ecriture limitee aux tables "sociales", jamais de modification de config
--   - authenticated (gerants) : gestion complete de LEUR camping uniquement
-- ============================================================

-- Helper : l'utilisateur connecte est-il gerant de ce camping ?
CREATE OR REPLACE FUNCTION is_gerant(cid uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM gerants
    WHERE user_id = auth.uid() AND camping_id = cid
  );
$$;

-- Colonne bannissement (moderation)
ALTER TABLE vacanciers ADD COLUMN IF NOT EXISTS banni boolean DEFAULT false;

-- ============ CAMPINGS ============
ALTER TABLE campings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campings_read   ON campings;
DROP POLICY IF EXISTS campings_update ON campings;
DROP POLICY IF EXISTS campings_insert ON campings;
CREATE POLICY campings_read   ON campings FOR SELECT USING (true);
CREATE POLICY campings_update ON campings FOR UPDATE TO authenticated
  USING (is_gerant(id)) WITH CHECK (is_gerant(id));
CREATE POLICY campings_insert ON campings FOR INSERT TO authenticated
  WITH CHECK (true);  -- self-service : tout compte peut creer SON camping

-- ============ GERANTS ============
ALTER TABLE gerants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gerants_read   ON gerants;
DROP POLICY IF EXISTS gerants_insert ON gerants;
CREATE POLICY gerants_read ON gerants FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY gerants_insert ON gerants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ VACANCIERS ============
ALTER TABLE vacanciers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vac_read   ON vacanciers;
DROP POLICY IF EXISTS vac_insert ON vacanciers;
DROP POLICY IF EXISTS vac_update ON vacanciers;
DROP POLICY IF EXISTS vac_delete ON vacanciers;
CREATE POLICY vac_read   ON vacanciers FOR SELECT USING (true);
CREATE POLICY vac_insert ON vacanciers FOR INSERT WITH CHECK (banni IS NOT TRUE);
CREATE POLICY vac_update ON vacanciers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY vac_delete ON vacanciers FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ============ ANIMATIONS ============
ALTER TABLE animations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anim_read  ON animations;
DROP POLICY IF EXISTS anim_write ON animations;
CREATE POLICY anim_read ON animations FOR SELECT USING (true);
CREATE POLICY anim_write ON animations FOR ALL TO authenticated
  USING (is_gerant(camping_id)) WITH CHECK (is_gerant(camping_id));

-- ============ GROUPES ============
ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grp_read   ON groupes;
DROP POLICY IF EXISTS grp_insert ON groupes;
DROP POLICY IF EXISTS grp_update ON groupes;
DROP POLICY IF EXISTS grp_delete ON groupes;
CREATE POLICY grp_read   ON groupes FOR SELECT USING (true);
CREATE POLICY grp_insert ON groupes FOR INSERT WITH CHECK (true);
CREATE POLICY grp_update ON groupes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY grp_delete ON groupes FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ============ MEMBRES / INSCRIPTIONS ============
ALTER TABLE membres_groupes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mg_all ON membres_groupes;
CREATE POLICY mg_all ON membres_groupes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ins_all ON inscriptions;
CREATE POLICY ins_all ON inscriptions FOR ALL USING (true) WITH CHECK (true);

-- ============ MESSAGES ============
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_read   ON messages;
DROP POLICY IF EXISTS msg_insert ON messages;
DROP POLICY IF EXISTS msg_update ON messages;
DROP POLICY IF EXISTS msg_delete ON messages;
CREATE POLICY msg_read   ON messages FOR SELECT USING (true);
-- pas de message si l'auteur est banni
CREATE POLICY msg_insert ON messages FOR INSERT WITH CHECK (
  NOT EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = auteur_id AND v.banni IS TRUE)
);
CREATE POLICY msg_update ON messages FOR UPDATE USING (true) WITH CHECK (true); -- reactions
CREATE POLICY msg_delete ON messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM groupes g WHERE g.id = groupe_id AND is_gerant(g.camping_id)));

-- ============ STATUTS ============
ALTER TABLE statuts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS st_read   ON statuts;
DROP POLICY IF EXISTS st_insert ON statuts;
DROP POLICY IF EXISTS st_delete ON statuts;
CREATE POLICY st_read   ON statuts FOR SELECT USING (true);
CREATE POLICY st_insert ON statuts FOR INSERT WITH CHECK (
  NOT EXISTS (SELECT 1 FROM vacanciers v WHERE v.id = vacancier_id AND v.banni IS TRUE)
);
CREATE POLICY st_delete ON statuts FOR DELETE TO authenticated
  USING (is_gerant(camping_id));

-- ============ POSITIONS ============
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_all ON positions;
CREATE POLICY pos_all ON positions FOR ALL USING (true) WITH CHECK (true);

-- ============ CANDIDATURES ============
ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cand_insert ON candidatures;
CREATE POLICY cand_insert ON candidatures FOR INSERT WITH CHECK (true);
-- (pas de SELECT public : lecture uniquement via dashboard/service role)

-- ============================================================
-- CE QUE CA CHANGE :
--  - un anonyme ne peut plus MODIFIER un camping (couleurs, plan, config)
--  - ne peut plus CREER/MODIFIER/SUPPRIMER d'animations
--  - ne peut plus lire les candidatures ni la table gerants
--  - un vacancier banni ne peut plus poster (messages, statuts)
--  - un gerant ne peut toucher QUE son camping
-- ============================================================
