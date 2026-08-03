-- ═══════════════════════════════════════════════════════════════════════════
-- DÉDOUBLONNAGE DES PROFILS VACANCIER
-- ───────────────────────────────────────────────────────────────────────────
-- Situation : une même identité auth possède plusieurs profils dans le même
-- camping. Cela arrive quand un appareil s'inscrit deux fois — par exemple sur
-- deux fiches camping qui ont ensuite été fusionnées.
--
-- Conséquences dans l'application, toutes silencieuses côté utilisateur :
--   • App.jsx cherche le profil avec maybeSingle() : deux résultats renvoient
--     une erreur, et l'utilisateur retombe sur l'écran d'inscription ;
--   • my_vacancier_id() résout auth.uid() avec LIMIT 1, donc arbitrairement.
--     Si elle ne rend pas le profil que l'application utilise, toute écriture
--     est refusée par la RLS — publier un statut, créer un groupe, s'inscrire
--     à une animation.
--
-- Le profil le plus récent est conservé : c'est celui dont le pseudo, la date
-- de départ et l'emplacement sont à jour. Une date de départ périmée sur un
-- ancien profil suffirait à faire croire à l'application que le séjour est
-- terminé.
--
-- Transaction unique, et idempotent : relancé, il ne trouve plus de doublon.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Pour chaque (identité auth, camping) en double : le profil gardé, et ceux à
-- faire disparaître une fois leurs références reportées.
CREATE TEMP TABLE dedup AS
SELECT v.id AS doublon, k.id AS garde
FROM vacanciers v
JOIN (
  SELECT DISTINCT ON (user_id, camping_id) id, user_id, camping_id
  FROM vacanciers
  WHERE user_id IS NOT NULL
  ORDER BY user_id, camping_id, created_at DESC
) k ON k.user_id = v.user_id AND k.camping_id = v.camping_id
WHERE v.user_id IS NOT NULL AND v.id <> k.id;

-- Références simples : aucune contrainte d'unicité, report direct.
UPDATE groupes  g SET createur_id  = d.garde FROM dedup d WHERE g.createur_id  = d.doublon;
UPDATE messages m SET auteur_id    = d.garde FROM dedup d WHERE m.auteur_id    = d.doublon;
UPDATE statuts  s SET vacancier_id = d.garde FROM dedup d WHERE s.vacancier_id = d.doublon;

-- Références à clé composite : membres_groupes est en PRIMARY KEY
-- (groupe_id, vacancier_id), inscriptions en (animation_id, vacancier_id).
-- Reporter sans précaution violerait la clé quand les deux profils sont
-- présents dans le même groupe ou inscrits à la même animation. La ligne en
-- trop est donc supprimée avant le report — elle est redondante, pas perdue.
DELETE FROM membres_groupes mg USING dedup d
 WHERE mg.vacancier_id = d.doublon
   AND EXISTS (SELECT 1 FROM membres_groupes x
               WHERE x.groupe_id = mg.groupe_id AND x.vacancier_id = d.garde);
UPDATE membres_groupes mg SET vacancier_id = d.garde FROM dedup d WHERE mg.vacancier_id = d.doublon;

DELETE FROM inscriptions i USING dedup d
 WHERE i.vacancier_id = d.doublon
   AND EXISTS (SELECT 1 FROM inscriptions x
               WHERE x.animation_id = i.animation_id AND x.vacancier_id = d.garde);
UPDATE inscriptions i SET vacancier_id = d.garde FROM dedup d WHERE i.vacancier_id = d.doublon;

-- Tables absentes de certaines installations, ou à clé primaire sur le seul
-- vacancier_id (positions).
DO $$
BEGIN
  IF to_regclass('public.signalements') IS NOT NULL THEN
    EXECUTE 'UPDATE signalements s SET vacancier_id = d.garde FROM dedup d WHERE s.vacancier_id = d.doublon';
  END IF;
  IF to_regclass('public.annonces') IS NOT NULL THEN
    EXECUTE 'UPDATE annonces a SET vacancier_id = d.garde FROM dedup d WHERE a.vacancier_id = d.doublon';
  END IF;
  IF to_regclass('public.positions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM positions p USING dedup d WHERE p.vacancier_id = d.doublon
             AND EXISTS (SELECT 1 FROM positions x WHERE x.vacancier_id = d.garde)';
    EXECUTE 'UPDATE positions p SET vacancier_id = d.garde FROM dedup d WHERE p.vacancier_id = d.doublon';
  END IF;
  IF to_regclass('public.push_tokens') IS NOT NULL THEN
    EXECUTE 'UPDATE push_tokens t SET vacancier_id = d.garde FROM dedup d WHERE t.vacancier_id = d.doublon';
  END IF;
END $$;

DELETE FROM vacanciers WHERE id IN (SELECT doublon FROM dedup);

COMMIT;

-- ── Vérification : doit ne renvoyer aucune ligne ────────────────────────────
SELECT v.user_id, v.camping_id, count(*) AS profils,
       string_agg(v.pseudo, ', ' ORDER BY v.pseudo) AS pseudos
FROM vacanciers v
WHERE v.user_id IS NOT NULL
GROUP BY v.user_id, v.camping_id
HAVING count(*) > 1;
