-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-10-03 — Durcissement des politiques RLS (audit sécurité du 3 octobre)
-- Migration appliquée : durcissement_rls_cloisonnement
--
-- Chaque point a été prouvé avant correction par une simulation de rôle dans
-- une transaction annulée, puis revérifié après : rien ne change pour un
-- vacancier ou un gérant honnête (version 1.0.2 comprise).
--
--  1. my_camping_id(), my_vacancier_id(), est_banni() : « limit 1 » sans
--     « order by ». Une identité avec deux profils obtenait un profil au
--     hasard, et pas forcément le même d'une fonction à l'autre. Désormais
--     le plus récent, dans les trois.
--  2. stat_insert : un vacancier pouvait publier un statut rattaché à un
--     AUTRE camping (camping_id libre).
--  3. mg_insert : un vacancier banni pouvait encore rejoindre des groupes.
--  4. grp_insert : un vacancier pouvait créer un groupe au nom d'un autre
--     (createur_id libre).
--  5. pos_insert / pos_update : position rattachable à un autre camping.
--  6. push_tokens : un appareil pouvait s'abonner aux notifications d'un
--     AUTRE vacancier, y compris d'un autre camping (vacancier_id libre) : il
--     recevait alors l'aperçu des messages de ses groupes. Le jeton doit
--     désormais désigner un profil de la même identité, et un camping où elle
--     a un profil ou qu'elle gère.
--  7. anim_select : les animations non publiées (brouillons du gérant)
--     étaient lisibles par les vacanciers. L'app ne lisait déjà que les
--     publiées.
--
-- Les politiques sont modifiées par ALTER POLICY : rôles et commande inchangés.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Profil courant déterministe ------------------------------------------------
create or replace function public.my_camping_id()
returns uuid language sql stable security definer set search_path = public
as $$
  select camping_id from vacanciers where user_id = (select auth.uid())
   order by created_at desc, id desc limit 1
$$;

create or replace function public.my_vacancier_id()
returns uuid language sql stable security definer set search_path = public
as $$
  select id from vacanciers where user_id = (select auth.uid())
   order by created_at desc, id desc limit 1
$$;

create or replace function public.est_banni()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((select banni from vacanciers where user_id = (select auth.uid())
                    order by created_at desc, id desc limit 1), false)
$$;

-- 2. Statut : seulement dans son camping ---------------------------------------
alter policy stat_insert on public.statuts
  with check (vacancier_id = my_vacancier_id()
              and camping_id = my_camping_id()
              and not est_banni());

-- 3. Rejoindre un groupe : pas quand on est banni --------------------------------
alter policy mg_insert on public.membres_groupes
  with check (vacancier_id = my_vacancier_id()
              and not est_banni()
              and exists (select 1 from groupes g
                           where g.id = membres_groupes.groupe_id
                             and g.camping_id = my_camping_id()));

-- 4. Groupe : créé en son propre nom ---------------------------------------------
alter policy grp_insert on public.groupes
  with check ((camping_id = my_camping_id()
               and createur_id = my_vacancier_id()
               and not est_banni())
              or is_gerant(camping_id));

-- 5. Position : dans son camping ---------------------------------------------------
alter policy pos_insert on public.positions
  with check (vacancier_id = my_vacancier_id() and camping_id = my_camping_id());

alter policy pos_update on public.positions
  using (vacancier_id = my_vacancier_id())
  with check (vacancier_id = my_vacancier_id() and camping_id = my_camping_id());

-- 6. Jeton push : rattaché à soi -----------------------------------------------------
-- Fonction security definer : la vérification lit vacanciers.user_id, que la
-- phase 2 retire de la lecture directe.
create or replace function public.jeton_push_autorise(p_vacancier_id uuid, p_camping_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select (p_vacancier_id is null
          or exists (select 1 from vacanciers v
                      where v.id = p_vacancier_id
                        and v.user_id = (select auth.uid())
                        and (p_camping_id is null or v.camping_id = p_camping_id)))
     and (p_camping_id is null
          or exists (select 1 from vacanciers v
                      where v.camping_id = p_camping_id and v.user_id = (select auth.uid()))
          or is_gerant(p_camping_id))
$$;
revoke execute on function public.jeton_push_autorise(uuid, uuid) from public, anon;
grant  execute on function public.jeton_push_autorise(uuid, uuid) to authenticated;

alter policy pt_insert_own on public.push_tokens
  with check (user_id = (select auth.uid())
              and jeton_push_autorise(vacancier_id, camping_id));

alter policy pt_update_own on public.push_tokens
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and jeton_push_autorise(vacancier_id, camping_id));

-- 7. Animations : les brouillons restent au gérant -------------------------------
alter policy anim_select on public.animations
  using ((camping_id = my_camping_id() and publiee is true) or is_gerant(camping_id));
