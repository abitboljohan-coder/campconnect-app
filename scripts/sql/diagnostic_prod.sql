-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC PRODUCTION — lecture seule, aucune modification
-- ───────────────────────────────────────────────────────────────────────────
-- À coller entièrement dans Supabase → SQL Editor, puis Run.
--
-- Une seule requête, un seul tableau de résultat : l'éditeur de Supabase
-- n'affiche que le dernier bloc quand on lui envoie plusieurs instructions,
-- ce qui masquerait tout le diagnostic sauf sa fin.
--
-- Aucun INSERT, UPDATE ni DELETE. Sans risque sur une base en production.
-- ═══════════════════════════════════════════════════════════════════════════

WITH
-- ── 1. Tables attendues ─────────────────────────────────────────────────────
tables AS (
  SELECT 1 AS ordre, '1. TABLE' AS section, t AS objet,
         CASE WHEN to_regclass('public.' || t) IS NOT NULL
              THEN 'présente' ELSE '### ABSENTE ###' END AS constat
  FROM unnest(ARRAY['campings','vacanciers','groupes','membres_groupes','messages',
                    'animations','inscriptions','statuts','signalements','annonces',
                    'push_tokens']) AS t
),

-- ── 2. RLS et policies ──────────────────────────────────────────────────────
-- Une table avec la RLS active et zéro policy est totalement fermée :
-- PostgreSQL refuse alors toute lecture comme toute écriture.
rls AS (
  SELECT 2, '2. RLS', c.relname,
         CASE WHEN NOT c.relrowsecurity THEN 'RLS désactivée (tout passe)'
              WHEN count(p.policyname) = 0 THEN '### RLS ACTIVE SANS POLICY — TOUT EST BLOQUÉ ###'
              ELSE count(p.policyname) || ' policies · '
                   || string_agg(DISTINCT p.cmd, '/' ORDER BY p.cmd) || ' · rôles: '
                   || string_agg(DISTINCT array_to_string(p.roles, '+'), ',')
         END
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
  WHERE c.relkind = 'r'
    AND c.relname IN ('campings','vacanciers','groupes','membres_groupes',
                      'messages','animations','inscriptions','statuts')
  GROUP BY c.relname, c.relrowsecurity
),

-- ── 3. Droits de table ──────────────────────────────────────────────────────
-- Une policy ne sert à rien sans le GRANT correspondant : le GRANT ouvre la
-- porte, la policy filtre ce qui la franchit. C'est le premier qui manque
-- le plus souvent, et l'erreur renvoyée ne le dit pas.
grants AS (
  SELECT 3, '3. GRANT', table_name || ' → ' || grantee,
         string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type)
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon','authenticated')
    AND table_name IN ('campings','vacanciers','groupes','membres_groupes',
                       'messages','animations','inscriptions','statuts')
  GROUP BY table_name, grantee
),

-- ── 4. Contenu réel de chaque camping ───────────────────────────────────────
donnees AS (
  SELECT 4, '4. DONNÉES', c.nom,
         'groupes actifs: '   || (SELECT count(*) FROM groupes g
                                   WHERE g.camping_id = c.id AND g.actif)
      || ' · anims à venir: ' || (SELECT count(*) FROM animations a
                                   WHERE a.camping_id = c.id AND a.publiee
                                     AND a.debut >= now())
      || ' · anims total: '   || (SELECT count(*) FROM animations a
                                   WHERE a.camping_id = c.id)
      || ' · vacanciers: '    || (SELECT count(*) FROM vacanciers v
                                   WHERE v.camping_id = c.id)
      -- Le type est vérifié avant de compter : un carte_config dont « pins »
      -- ne serait pas un tableau ferait échouer la requête entière, et le
      -- diagnostic ne rapporterait plus rien du tout.
      || ' · pins carte: '    || CASE
           WHEN jsonb_typeof(c.carte_config -> 'pins') = 'array'
             THEN jsonb_array_length(c.carte_config -> 'pins')::text
           WHEN c.carte_config -> 'pins' IS NULL THEN '0'
           ELSE '### format inattendu ###' END
  FROM campings c
),

-- ── 5. Identité auth des vacanciers ─────────────────────────────────────────
-- Les policies de cloisonnement rattachent chaque écriture à my_vacancier_id(),
-- qui résout auth.uid() via vacanciers.user_id. Un profil sans user_id ne peut
-- donc plus rien écrire : ni statut, ni groupe.
identites AS (
  SELECT 5, '5. IDENTITÉS', 'vacanciers',
         count(*) || ' au total · ' ||
         count(*) FILTER (WHERE user_id IS NULL) || ' sans user_id · ' ||
         count(*) FILTER (WHERE user_id IS NOT NULL) || ' avec user_id'
  FROM vacanciers
),

-- Zéro utilisateur anonyme = « Allow anonymous sign-ins » désactivé dans
-- Authentication → Sign In / Providers. Sans lui, l'app reste en rôle anon.
auth_users AS (
  SELECT 6, '6. AUTH', 'auth.users',
         count(*) || ' comptes · ' ||
         count(*) FILTER (WHERE is_anonymous) || ' anonymes'
  FROM auth.users
),

-- ── 7. Fonctions d'aide de la RLS ───────────────────────────────────────────
fonctions AS (
  SELECT 7, '7. FONCTION', f AS objet,
         CASE WHEN EXISTS (
                SELECT 1 FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
                WHERE p.proname = f)
              THEN 'présente' ELSE '### ABSENTE ###' END
  FROM unnest(ARRAY['my_vacancier_id','my_camping_id','is_gerant']) AS f
)

SELECT section, objet, constat FROM (
  SELECT * FROM tables    UNION ALL
  SELECT * FROM rls       UNION ALL
  SELECT * FROM grants    UNION ALL
  SELECT * FROM donnees   UNION ALL
  SELECT * FROM identites UNION ALL
  SELECT * FROM auth_users UNION ALL
  SELECT * FROM fonctions
) AS tout
ORDER BY ordre, objet;
