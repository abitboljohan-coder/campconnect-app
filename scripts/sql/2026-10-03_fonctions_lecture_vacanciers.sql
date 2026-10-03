-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-10-03 — Lecture des profils sans exposer les colonnes sensibles (phase 1)
-- Migration appliquée : fonctions_lecture_vacanciers
--
-- Aujourd'hui, la politique vac_select laisse tout vacancier lire TOUTES les
-- colonnes des autres vacanciers de son camping : emplacement (où il dort),
-- tranche d'âge, date de départ, device_id, user_id. L'app n'en affiche rien,
-- mais n'importe qui peut les lire par l'API avec la clé publique.
--
-- La correction se fait en deux temps, pour ne pas casser la version 1.0.2
-- publiée, qui lit encore ces colonnes directement :
--   phase 1 (ici)  : trois fonctions qui rendent ce dont l'app a besoin, sans
--                    rien retirer. L'app 1.0.3 ne passe plus que par elles.
--   phase 2 (plus tard, quand 1.0.3 est sur les stores) :
--                    scripts/sql/a_appliquer_apres_1.0.3_colonnes_vacanciers.sql
--                    retire la lecture directe des colonnes sensibles.
--
-- Ces fonctions n'enlèvent rien : sans effet sur 1.0.2.
-- ─────────────────────────────────────────────────────────────────────────────

-- Son propre profil sur un camping donné, toutes colonnes.
create or replace function public.mon_profil(p_camping_id uuid)
returns setof public.vacanciers
language sql stable security definer
set search_path = public
as $$
  select * from vacanciers
   where user_id = (select auth.uid()) and camping_id = p_camping_id
   order by created_at desc, id desc
   limit 1
$$;

-- Tous les profils d'un camping, toutes colonnes : réservé à ses gérants
-- (statistiques, export CSV, départs, signalements, modération).
create or replace function public.vacanciers_du_camping(p_camping_id uuid)
returns setof public.vacanciers
language sql stable security definer
set search_path = public
as $$
  select * from vacanciers
   where camping_id = p_camping_id and is_gerant(p_camping_id)
$$;

-- Les vacanciers encore présents d'un camping (identifiant et avatar
-- seulement), pour les compteurs et les avatars des groupes, sans livrer la
-- date de départ de chacun. Réservé aux vacanciers de ce camping et à ses
-- gérants. Même règle que src/lib/presence.js : présent jusqu'au jour du
-- départ inclus ; sans date de départ, pendant 7 jours après l'arrivée.
-- Les dates sont celles d'UTC, comme côté app (toISOString).
create or replace function public.vacanciers_presents(p_camping_id uuid)
returns table (id uuid, avatar_emoji text)
language sql stable security definer
set search_path = public
as $$
  select v.id, v.avatar_emoji
    from vacanciers v
   where v.camping_id = p_camping_id
     and (exists (select 1 from vacanciers moi
                   where moi.user_id = (select auth.uid()) and moi.camping_id = p_camping_id)
          or is_gerant(p_camping_id))
     and (v.date_depart >= (now() at time zone 'utc')::date
          or (v.date_depart is null
              and v.created_at >= (((now() at time zone 'utc')::date - 7)::timestamp at time zone 'utc')))
$$;

-- Appelables par un utilisateur connecté (vacancier anonyme compris), jamais
-- sans session.
revoke execute on function public.mon_profil(uuid)            from public, anon;
revoke execute on function public.vacanciers_du_camping(uuid) from public, anon;
revoke execute on function public.vacanciers_presents(uuid)   from public, anon;
grant  execute on function public.mon_profil(uuid)            to authenticated;
grant  execute on function public.vacanciers_du_camping(uuid) to authenticated;
grant  execute on function public.vacanciers_presents(uuid)   to authenticated;
