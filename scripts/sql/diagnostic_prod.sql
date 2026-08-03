-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC PRODUCTION — lecture seule, aucune modification
-- ───────────────────────────────────────────────────────────────────────────
-- À coller dans Supabase → SQL Editor. Répond à trois questions :
--   1. les tables et les policies attendues existent-elles ?
--   2. le camping de démonstration contient-il des données ?
--   3. les vacanciers ont-ils une identité auth exploitable par la RLS ?
--
-- Aucun INSERT, UPDATE ni DELETE. Sans risque sur une base en production.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tables attendues ─────────────────────────────────────────────────────
SELECT '1. TABLES' AS section, t AS table_attendue,
       to_regclass('public.' || t) IS NOT NULL AS existe
FROM unnest(ARRAY['campings','vacanciers','groupes','membres_groupes','messages',
                  'animations','inscriptions','statuts','signalements','annonces',
                  'push_tokens']) AS t
ORDER BY existe, t;

-- ── 2. RLS et policies, table par table ─────────────────────────────────────
-- Une table avec rls_active = true et 0 policy est TOTALEMENT fermée :
-- PostgreSQL refuse alors toute lecture et toute écriture.
SELECT '2. RLS' AS section,
       c.relname                                   AS table_nom,
       c.relrowsecurity                            AS rls_active,
       count(p.policyname)                         AS nb_policies,
       coalesce(string_agg(DISTINCT p.cmd, ', '), '—') AS commandes,
       coalesce(string_agg(DISTINCT array_to_string(p.roles, '+'), ', '), '—') AS roles
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE c.relkind = 'r'
  AND c.relname IN ('campings','vacanciers','groupes','membres_groupes','messages',
                    'animations','inscriptions','statuts')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- ── 3. Droits de table pour anon et authenticated ───────────────────────────
-- Une policy ne sert à rien sans le GRANT correspondant : le GRANT ouvre la
-- porte, la policy filtre ce qui passe. Il manque souvent le premier.
SELECT '3. GRANTS' AS section, table_name, grantee,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS droits
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated')
  AND table_name IN ('campings','vacanciers','groupes','membres_groupes',
                     'messages','animations','inscriptions','statuts')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- ── 4. Contenu du camping de démonstration ──────────────────────────────────
SELECT '4. DONNEES' AS section, c.nom, c.slug, c.id,
       (SELECT count(*) FROM groupes    g WHERE g.camping_id = c.id)                   AS groupes_total,
       (SELECT count(*) FROM groupes    g WHERE g.camping_id = c.id AND g.actif)       AS groupes_actifs,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id)                   AS animations_total,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id AND a.publiee)     AS animations_publiees,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id AND a.publiee
                                            AND a.debut >= now())                      AS animations_a_venir,
       (SELECT count(*) FROM vacanciers v WHERE v.camping_id = c.id)                   AS vacanciers,
       jsonb_array_length(coalesce(c.carte_config -> 'pins', '[]'::jsonb))              AS pins_carte
FROM campings c
ORDER BY c.nom;

-- ── 5. Identité auth des vacanciers ─────────────────────────────────────────
-- Les policies de cloisonnement rattachent chaque écriture à
-- my_vacancier_id(), qui résout auth.uid() dans vacanciers.user_id. Un profil
-- sans user_id ne peut donc plus rien écrire : ni statut, ni groupe.
SELECT '5. IDENTITES' AS section,
       count(*)                              AS vacanciers_total,
       count(*) FILTER (WHERE user_id IS NULL) AS sans_user_id,
       count(*) FILTER (WHERE user_id IS NOT NULL) AS avec_user_id
FROM vacanciers;

-- Les connexions anonymes fonctionnent-elles réellement ?
-- Zéro utilisateur anonyme = « Allow anonymous sign-ins » désactivé dans
-- Authentication → Sign In / Providers. Sans lui, l'app reste en rôle anon et
-- toutes les écritures sont refusées.
SELECT '5b. AUTH' AS section,
       count(*)                                     AS utilisateurs_auth,
       count(*) FILTER (WHERE is_anonymous)         AS anonymes,
       max(created_at)                              AS dernier_inscrit
FROM auth.users;

-- ── 6. Fonctions d'aide de la RLS ───────────────────────────────────────────
SELECT '6. FONCTIONS' AS section, p.proname AS fonction,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
WHERE p.proname IN ('my_vacancier_id','my_camping_id','is_gerant')
ORDER BY p.proname;
