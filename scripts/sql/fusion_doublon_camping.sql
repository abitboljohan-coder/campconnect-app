-- ═══════════════════════════════════════════════════════════════════════════
-- FUSION DE DEUX FICHES CAMPING EN DOUBLON
-- ───────────────────────────────────────────────────────────────────────────
-- Situation : deux campings portent le même nom. L'un contient les données de
-- démonstration (groupes, animations, conversations), l'autre la carte à jour
-- et les vacanciers réellement connectés. L'application n'en voit qu'un, et il
-- est vide.
--
-- Ce script déplace le contenu du camping SOURCE vers le camping CIBLE, puis
-- supprime la fiche devenue vide. Le camping CIBLE est celui que l'application
-- utilise déjà : le conserver évite de casser les sessions en cours et garde
-- la carte détaillée.
--
-- Tout se déroule dans une transaction : en cas d'erreur, rien n'est modifié.
-- Relancé après coup, il s'interrompt sur « camping source introuvable » et
-- annule tout : il ne peut pas fusionner deux fois.
--
-- ⚠️ RENSEIGNER LES DEUX IDENTIFIANTS CI-DESSOUS avant d'exécuter.
--    Ils sont donnés par la requête de repérage, en tête de fichier.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ÉTAPE 1 : repérage. Exécuter SEULEMENT cette requête d'abord. ───────────
-- Elle liste les campings homonymes avec leur identifiant et leur contenu.
/*
SELECT c.id, c.nom, c.slug, c.created_at,
       (SELECT count(*) FROM groupes    g WHERE g.camping_id = c.id AND g.actif)   AS groupes,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id)               AS animations,
       (SELECT count(*) FROM vacanciers v WHERE v.camping_id = c.id)               AS vacanciers,
       CASE WHEN jsonb_typeof(c.carte_config -> 'pins') = 'array'
            THEN jsonb_array_length(c.carte_config -> 'pins') ELSE 0 END           AS pins,
       c.carte_config -> 'acces_libre'                                             AS acces_libre
FROM campings c
WHERE lower(c.nom) LIKE '%flots bleus%'
ORDER BY c.created_at;
*/

-- ── ÉTAPE 2 : la fusion ─────────────────────────────────────────────────────
BEGIN;

-- SOURCE = la fiche qui contient les données de démonstration (celle qui a des
--          groupes et des animations). Elle sera SUPPRIMÉE.
-- CIBLE  = la fiche utilisée par l'application (celle qui a la bonne carte et
--          les vacanciers connectés). Elle SURVIT.
CREATE TEMP TABLE fusion AS SELECT
  '00000000-0000-0000-0000-000000000000'::uuid AS source,   -- ← À REMPLACER
  '00000000-0000-0000-0000-000000000000'::uuid AS cible;    -- ← À REMPLACER

-- Garde-fou : refuse de tourner sur des identifiants non renseignés, identiques
-- ou inexistants. Sans cela, une étourderie viderait un camping en production.
DO $$
DECLARE s uuid; c uuid;
BEGIN
  SELECT source, cible INTO s, c FROM fusion;
  IF s = c THEN
    RAISE EXCEPTION 'source et cible sont identiques';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM campings WHERE id = s) THEN
    RAISE EXCEPTION 'camping source introuvable : %', s;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM campings WHERE id = c) THEN
    RAISE EXCEPTION 'camping cible introuvable : %', c;
  END IF;
END $$;

-- Le contenu change de camping. Les tables liées aux groupes (messages,
-- membres) et aux animations (inscriptions) suivent d'elles-mêmes : elles ne
-- référencent pas le camping, seulement leur parent.
UPDATE vacanciers  SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion);
UPDATE groupes     SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion);
UPDATE animations  SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion);
UPDATE statuts     SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion);

-- Ces deux tables n'existent pas sur toutes les installations.
DO $$
BEGIN
  IF to_regclass('public.signalements') IS NOT NULL THEN
    EXECUTE 'UPDATE signalements SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion)';
  END IF;
  IF to_regclass('public.annonces') IS NOT NULL THEN
    EXECUTE 'UPDATE annonces SET camping_id = (SELECT cible FROM fusion) WHERE camping_id = (SELECT source FROM fusion)';
  END IF;
END $$;

-- L'identité visuelle et le libellé de la fiche supprimée sont repris, mais
-- seulement là où la cible n'a rien de propre : créée à la main, elle garde
-- souvent les valeurs d'usine. Les couleurs sont traitées à part — une couleur
-- par défaut n'est pas un choix, et la laisser gagner ferait perdre l'identité
-- visuelle du camping de démonstration.
UPDATE campings c SET
  nom                = coalesce(nullif(s.nom, ''), c.nom),
  description        = coalesce(c.description, s.description),
  logo_url           = coalesce(c.logo_url, s.logo_url),
  couleur_principale = CASE WHEN c.couleur_principale IS NULL
                              OR c.couleur_principale = '#639922'
                            THEN s.couleur_principale ELSE c.couleur_principale END,
  couleur_secondaire = CASE WHEN c.couleur_secondaire IS NULL
                              OR c.couleur_secondaire = '#1a4d1a'
                            THEN s.couleur_secondaire ELSE c.couleur_secondaire END,
  infos              = CASE WHEN c.infos = '{}'::jsonb OR c.infos IS NULL
                            THEN s.infos ELSE c.infos END,
  -- La carte de la cible est conservée : c'est la plus récente. On force
  -- seulement l'accès libre, sans lequel le contrôle de position empêcherait
  -- un examinateur d'App Store ou de Google Play d'entrer dans le camping.
  carte_config       = coalesce(c.carte_config, '{}'::jsonb)
                       || jsonb_build_object('acces_libre', true)
FROM campings s
WHERE c.id = (SELECT cible FROM fusion)
  AND s.id = (SELECT source FROM fusion);

-- La fiche source est maintenant vide de tout contenu : elle peut partir.
DELETE FROM campings WHERE id = (SELECT source FROM fusion);

-- Le slug libéré est repris, pour que les liens et QR codes déjà imprimés
-- continuent de fonctionner.
UPDATE campings SET slug = 'les-flots-bleus'
WHERE id = (SELECT cible FROM fusion)
  AND NOT EXISTS (SELECT 1 FROM campings WHERE slug = 'les-flots-bleus');

COMMIT;

-- ── ÉTAPE 3 : vérification ──────────────────────────────────────────────────
SELECT c.nom, c.slug,
       (SELECT count(*) FROM groupes    g WHERE g.camping_id = c.id AND g.actif)      AS groupes_actifs,
       (SELECT count(*) FROM animations a WHERE a.camping_id = c.id AND a.publiee
                                            AND a.debut >= now())                     AS anims_a_venir,
       (SELECT count(*) FROM vacanciers v WHERE v.camping_id = c.id)                  AS vacanciers,
       (SELECT count(*) FROM messages   m JOIN groupes g ON g.id = m.groupe_id
                                          WHERE g.camping_id = c.id)                  AS messages,
       CASE WHEN jsonb_typeof(c.carte_config -> 'pins') = 'array'
            THEN jsonb_array_length(c.carte_config -> 'pins') ELSE 0 END              AS pins,
       c.carte_config -> 'acces_libre'                                                AS acces_libre
FROM campings c
WHERE lower(c.nom) LIKE '%flots bleus%';

-- Un même appareil ayant rejoint les deux fiches se retrouve, après fusion,
-- avec deux profils portant la même identité auth dans le même camping.
-- L'application les cherche avec maybeSingle() : deux résultats déclenchent une
-- erreur et renvoient l'utilisateur sur l'écran d'inscription. À traiter avant
-- de considérer la fusion terminée.
SELECT v.user_id, count(*) AS profils_en_double,
       string_agg(v.pseudo, ', ' ORDER BY v.pseudo) AS pseudos
FROM vacanciers v
WHERE v.user_id IS NOT NULL
GROUP BY v.user_id, v.camping_id
HAVING count(*) > 1;
