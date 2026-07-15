-- Social update : reactions chat + statuts ephemeres 24h
-- A jouer dans Supabase SQL Editor

ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS statuts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camping_id    uuid REFERENCES campings(id) ON DELETE CASCADE,
  vacancier_id  uuid REFERENCES vacanciers(id) ON DELETE CASCADE,
  emoji         text DEFAULT 'megaphone',
  texte         text NOT NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_statuts_camping ON statuts(camping_id, created_at);
ALTER TABLE statuts DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE statuts;
-- (messages est deja dans la publication realtime via full_migration.sql)
