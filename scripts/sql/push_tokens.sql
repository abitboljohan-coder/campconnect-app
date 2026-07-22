-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS PUSH — table des tokens d'appareils
-- ───────────────────────────────────────────────────────────────────────────
-- Chaque appareil (device_id) enregistre son token FCM/APNs, rattaché au
-- vacancier + camping courant. L'Edge Function send-push lit cette table via la
-- clé service_role (bypass RLS) pour envoyer les notifications.
--
-- Usage : coller dans Supabase SQL Editor et exécuter.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  device_id     text UNIQUE NOT NULL,
  token         text NOT NULL,
  platform      text,                                    -- 'android' | 'ios'
  vacancier_id  uuid REFERENCES vacanciers(id) ON DELETE SET NULL,
  camping_id    uuid REFERENCES campings(id)   ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_camping   ON push_tokens(camping_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_vacancier ON push_tokens(vacancier_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_tokens TO authenticated;
REVOKE ALL ON push_tokens FROM anon;

-- Chaque appareil ne gère QUE sa propre ligne (identité auth anonyme).
DROP POLICY IF EXISTS pt_select_own ON push_tokens;
DROP POLICY IF EXISTS pt_insert_own ON push_tokens;
DROP POLICY IF EXISTS pt_update_own ON push_tokens;
DROP POLICY IF EXISTS pt_delete_own ON push_tokens;

CREATE POLICY pt_select_own ON push_tokens FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY pt_insert_own ON push_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY pt_update_own ON push_tokens FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY pt_delete_own ON push_tokens FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- maj auto de updated_at
CREATE OR REPLACE FUNCTION touch_push_tokens() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_touch_push_tokens ON push_tokens;
CREATE TRIGGER trg_touch_push_tokens BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION touch_push_tokens();
