-- ═════════════════════════════════════════════════════════════════════════════
-- 2026-10-03 — Entrée dans un camping vérifiée par le serveur (phase 1)
-- Migration appliquée : code_acces_serveur
-- ═════════════════════════════════════════════════════════════════════════════
--
-- LA FAILLE
--   N'importe qui pouvait entrer dans n'importe quel camping : la politique
--   vac_insert n'exige que user_id = auth.uid(), le code du jour était calculé
--   dans l'app à partir de l'identifiant du camping (public), et le contrôle
--   GPS n'était fait que dans l'app. Un intrus créait un profil par l'API, puis
--   lisait messages, statuts et annonces du camping.
--
-- CE QUE FAIT CETTE MIGRATION
--   1. camping_secrets : une clé aléatoire par camping, illisible par les
--      vacanciers (RLS active, aucune politique, aucun droit pour anon ou
--      authenticated). Générée pour chaque camping existant et, par
--      déclencheur, pour chaque nouveau camping.
--   2. Le code du jour (4 chiffres, change toutes les heures) est dérivé de
--      cette clé par HMAC : le connaître suppose de la connaître. Le code de
--      l'heure précédente reste accepté pendant les 10 premières minutes.
--   3. Le QR code de la réception porte la clé (…/join/<slug>?k=<clé>). Le
--      gérant la lit et la change par acces_camping / changer_cle_acces.
--   4. verifier_acces_camping(slug, preuve) contrôle une preuve de présence et
--      rend un jeton valable 1 à 2 h, lié à l'utilisateur ;
--      rejoindre_camping(slug, preuve, profil) crée ou retrouve le profil.
--      Preuves acceptées : accès libre du camping (démo), gérant du camping,
--      jeton, clé du QR, code du jour, ou position GPS à moins de 800 m du
--      centre (la même règle que l'app).
--   5. Essais de code limités : 10 échecs par utilisateur et par heure, 60 par
--      camping et par heure (contre la création de comptes anonymes en série).
--   6. Un profil vacancier ne peut plus changer de camping par l'API
--      (sinon : entrer dans la démo en accès libre, puis modifier camping_id).
--
-- CE QUI NE CHANGE PAS ENCORE (phase 2, voir
--   scripts/sql/a_appliquer_apres_1.0.3_insertion_vacanciers.sql)
--   L'insertion directe dans vacanciers reste permise : la 1.0.2 des stores
--   l'utilise. Tant que la phase 2 n'est pas appliquée, la faille reste
--   ouverte par l'API ; la nouvelle app, elle, n'utilise plus ce chemin.
--
-- PREUVE (3 octobre 2026) : migration et simulation exécutées ensemble dans une
-- transaction annulée (rôles anon et authenticated simulés) — 39 contrôles
-- passés : secrets illisibles (anon, vacancier) ; fonctions internes non
-- exécutables ; sans preuve, mauvais code, mauvaise clé, GPS à Paris → refus ;
-- GPS à 136 m, bon code, jeton, clé QR, accès libre → profil créé avec les
-- bonnes colonnes ; code de l'heure précédente accepté à h+7 min (et, fonction
-- pure : à 11 h 05 oui, à 11 h 15 non) ; jeton d'un autre utilisateur refusé ;
-- vacancier existant retrouvé sans doublon ; changement de camping_id refusé ;
-- 11e code faux et même le bon code → trop_essais, QR toujours accepté ;
-- 60 échecs sur le camping → bloqué ; remise à zéro à l'heure suivante ;
-- gérant : code et clé lus, autre camping refusé, rotation de clé, ancien QR
-- refusé ; insertion directe 1.0.2 toujours permise (phase 1).
-- Après application : vérifié de nouveau sur brad-camp et la démo.
--
-- NOTE pour qui rejoue ce fichier par l'outil MCP execute_sql/apply_migration :
-- un mot « delete », « drop » ou « truncate » hors de « on delete cascade »
-- déclenche une demande de confirmation, et l'appel expire sans réponse.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Tables ────────────────────────────────────────────────────────────────────
create table if not exists public.camping_secrets (
  camping_id uuid primary key references public.campings(id) on delete cascade,
  cle_acces  text not null check (char_length(cle_acces) between 32 and 128),
  cree_le    timestamptz not null default now()
);
comment on table public.camping_secrets is
  'Clé secrète de chaque camping (QR code, code du jour). Jamais lisible par anon ni authenticated : seulement par les fonctions security definer.';
alter table public.camping_secrets enable row level security;
revoke all on public.camping_secrets from public, anon, authenticated;

create table if not exists public.acces_essais (
  user_id    uuid not null,
  camping_id uuid not null references public.campings(id) on delete cascade,
  heure      timestamptz not null,
  echecs     integer not null default 0,
  primary key (user_id, camping_id)
);
comment on table public.acces_essais is
  'Codes du jour faux de l''heure en cours, par utilisateur et camping : limite les essais (9 000 codes possibles). Une ligne par couple, remise à zéro à chaque nouvelle heure.';
create index if not exists acces_essais_camping_heure on public.acces_essais (camping_id, heure);
alter table public.acces_essais enable row level security;
revoke all on public.acces_essais from public, anon, authenticated;

-- 2. Fonctions internes (aucun droit pour les clients) ───────────────────────
create or replace function public._nouvelle_cle_acces()
returns text language sql volatile set search_path = '' as $$
  select encode(extensions.gen_random_bytes(16), 'hex')
$$;

-- Clé du camping, créée si elle manquait (filet de sécurité du déclencheur).
create or replace function public._cle_acces(p_camping_id uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare v_cle text;
begin
  select cle_acces into v_cle from public.camping_secrets where camping_id = p_camping_id;
  if v_cle is null then
    insert into public.camping_secrets (camping_id, cle_acces)
    values (p_camping_id, public._nouvelle_cle_acces())
    on conflict (camping_id) do nothing;
    select cle_acces into v_cle from public.camping_secrets where camping_id = p_camping_id;
  end if;
  return v_cle;
end $$;

create or replace function public._heure(p_instant timestamptz)
returns bigint language sql immutable set search_path = '' as $$
  select floor(extract(epoch from p_instant) / 3600)::bigint
$$;

-- Code de l'heure : HMAC-SHA256 de la clé, ramené à 4 chiffres (1000 à 9999).
create or replace function public._code_acces(p_cle text, p_heure bigint)
returns text language sql immutable set search_path = '' as $$
  select ((('x' || lpad(left(encode(extensions.hmac('code:' || p_heure::text, p_cle, 'sha256'), 'hex'), 8), 16, '0'))::bit(64)::bigint % 9000) + 1000)::text
$$;

-- Code de l'heure, ou celui de l'heure précédente pendant les 10 premières
-- minutes : le code lu à 10 h 58 doit encore passer à 11 h 01.
create or replace function public._code_accepte(p_cle text, p_code text, p_maintenant timestamptz)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_code, '') <> '' and (
    p_code = public._code_acces(p_cle, public._heure(p_maintenant))
    or (extract(epoch from p_maintenant) % 3600 < 600
        and p_code = public._code_acces(p_cle, public._heure(p_maintenant) - 1)))
$$;

-- Jeton remis après une vérification réussie : lié à l'utilisateur et au
-- camping (par sa clé), valable pour l'heure en cours et la suivante.
create or replace function public._jeton_acces(p_cle text, p_user uuid, p_heure bigint)
returns text language sql immutable set search_path = '' as $$
  select encode(extensions.hmac('jeton:' || p_user::text || ':' || p_heure::text, p_cle, 'sha256'), 'hex')
$$;

create or replace function public._distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable set search_path = '' as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
$$;

-- Contrôle d'une preuve de présence. Rend null si elle est acceptée, sinon le
-- motif du refus. Ne lève pas d'exception sur un code faux : l'échec doit
-- rester compté, une exception annulerait le comptage.
create or replace function public._verifier_preuve(p_camping_id uuid, p_preuve jsonb)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_config jsonb;
  v_cle    text;
  v_heure  timestamptz := date_trunc('hour', now());
  v_lat float8; v_lng float8; v_clat float8; v_clng float8;
begin
  if v_uid is null then return 'non_connecte'; end if;
  select carte_config into v_config from public.campings where id = p_camping_id;
  if not found then return 'camping_inconnu'; end if;

  -- Camping de démonstration : ouvert à tous (testeurs des stores, prospects).
  if v_config -> 'acces_libre' = 'true'::jsonb then return null; end if;
  -- Le gérant connaît déjà le code et la clé.
  if public.is_gerant(p_camping_id) then return null; end if;

  p_preuve := coalesce(p_preuve, '{}'::jsonb);
  if jsonb_typeof(p_preuve) <> 'object' then return 'preuve_manquante'; end if;
  v_cle := public._cle_acces(p_camping_id);

  if p_preuve ? 'jeton' then
    if p_preuve ->> 'jeton' in (public._jeton_acces(v_cle, v_uid, public._heure(now())),
                                public._jeton_acces(v_cle, v_uid, public._heure(now()) - 1)) then
      return null;
    end if;
    return 'verification_expiree';
  end if;

  if p_preuve ? 'cle' then
    if p_preuve ->> 'cle' = v_cle then return null; end if;
    return 'qr_perime';
  end if;

  -- GPS. Falsifiable par qui sait simuler une position (outils de
  -- développement) : accepté, ce contrôle arrête tout le monde sauf lui.
  if p_preuve ? 'lat' or p_preuve ? 'lng' then
    begin
      v_lat  := (p_preuve ->> 'lat')::float8;
      v_lng  := (p_preuve ->> 'lng')::float8;
      v_clat := (v_config -> 'center' ->> 'lat')::float8;
      v_clng := (v_config -> 'center' ->> 'lng')::float8;
    exception when others then
      return 'hors_camping';
    end;
    if v_lat between -90 and 90 and v_lng between -180 and 180
       and v_clat is not null and v_clng is not null
       and public._distance_m(v_lat, v_lng, v_clat, v_clng) < 800 then
      return null;
    end if;
    return 'hors_camping';
  end if;

  if p_preuve ? 'code' then
    if (select coalesce(sum(echecs), 0) from public.acces_essais
         where user_id = v_uid and heure = v_heure) >= 10
       or (select coalesce(sum(echecs), 0) from public.acces_essais
            where camping_id = p_camping_id and heure = v_heure) >= 60 then
      return 'trop_essais';
    end if;
    if public._code_accepte(v_cle, left(p_preuve ->> 'code', 12), now()) then return null; end if;
    -- Une ligne par utilisateur et camping : le compteur repart à 1 à chaque
    -- nouvelle heure, la table ne grossit donc pas.
    insert into public.acces_essais as e (user_id, camping_id, heure, echecs)
    values (v_uid, p_camping_id, v_heure, 1)
    on conflict (user_id, camping_id) do update
      set echecs = case when e.heure = excluded.heure then e.echecs + 1 else 1 end,
          heure  = excluded.heure;
    return 'code_faux';
  end if;

  return 'preuve_manquante';
end $$;

-- 3. Fonctions appelées par l'app vacancier ──────────────────────────────────
-- Rend { ok: true, jeton } ou { ok: false, erreur }.
create or replace function public.verifier_acces_camping(p_slug text, p_preuve jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_camping_id uuid; v_refus text;
begin
  if (select auth.uid()) is null then return jsonb_build_object('ok', false, 'erreur', 'non_connecte'); end if;
  select id into v_camping_id from public.campings where slug = p_slug;
  if v_camping_id is null then return jsonb_build_object('ok', false, 'erreur', 'camping_inconnu'); end if;
  v_refus := public._verifier_preuve(v_camping_id, p_preuve);
  if v_refus is not null then return jsonb_build_object('ok', false, 'erreur', v_refus); end if;
  return jsonb_build_object('ok', true, 'jeton',
    public._jeton_acces(public._cle_acces(v_camping_id), (select auth.uid()), public._heure(now())));
end $$;

-- Crée le profil vacancier, ou met à jour celui que cette identité a déjà sur
-- ce camping (retour après « Se déconnecter », séjour suivant). Mêmes colonnes
-- et mêmes règles que l'ancienne insertion de l'app (src/lib/profil.js,
-- champsArrivee) : un champ vide garde la valeur du profil retrouvé, sauf une
-- date de départ passée. Rend { ok: true, id } ou { ok: false, erreur }.
create or replace function public.rejoindre_camping(p_slug text, p_preuve jsonb, p_profil jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid        uuid := (select auth.uid());
  v_camping_id uuid;
  v_refus      text;
  v_pseudo     text;
  v_avatar     text;
  v_empl       text;
  v_depart     date;
  v_device     text;
  v_existant   public.vacanciers;
  v_id         uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'erreur', 'non_connecte'); end if;
  select id into v_camping_id from public.campings where slug = p_slug;
  if v_camping_id is null then return jsonb_build_object('ok', false, 'erreur', 'camping_inconnu'); end if;

  -- Le profil est validé avant la preuve : un formulaire invalide ne doit pas
  -- consommer un essai de code.
  p_profil := coalesce(p_profil, '{}'::jsonb);
  if jsonb_typeof(p_profil) <> 'object' then return jsonb_build_object('ok', false, 'erreur', 'profil_invalide'); end if;
  v_pseudo := btrim(coalesce(p_profil ->> 'pseudo', ''));
  if v_pseudo = '' then return jsonb_build_object('ok', false, 'erreur', 'pseudo_obligatoire'); end if;
  if char_length(v_pseudo) > 60 then return jsonb_build_object('ok', false, 'erreur', 'pseudo_trop_long'); end if;
  if p_profil -> 'cgu' is distinct from 'true'::jsonb then
    return jsonb_build_object('ok', false, 'erreur', 'cgu_obligatoires');
  end if;
  v_avatar := nullif(btrim(coalesce(p_profil ->> 'avatar_emoji', '')), '');
  if char_length(v_avatar) > 16 then return jsonb_build_object('ok', false, 'erreur', 'avatar_invalide'); end if;
  v_empl := nullif(btrim(coalesce(p_profil ->> 'emplacement', '')), '');
  if char_length(v_empl) > 40 then return jsonb_build_object('ok', false, 'erreur', 'emplacement_trop_long'); end if;
  begin
    v_depart := nullif(p_profil ->> 'date_depart', '')::date;
  exception when others then
    return jsonb_build_object('ok', false, 'erreur', 'date_invalide');
  end;
  v_device := left(nullif(p_profil ->> 'device_id', ''), 100);

  v_refus := public._verifier_preuve(v_camping_id, p_preuve);
  if v_refus is not null then return jsonb_build_object('ok', false, 'erreur', v_refus); end if;

  -- Deux appuis rapprochés ne créent pas deux profils.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || v_camping_id::text, 0));

  select * into v_existant from public.vacanciers
   where user_id = v_uid and camping_id = v_camping_id
   order by created_at desc, id desc limit 1;

  if found then
    update public.vacanciers set
      pseudo           = v_pseudo,
      avatar_emoji     = coalesce(v_avatar, v_existant.avatar_emoji, '🏕️'),
      emplacement      = coalesce(v_empl, v_existant.emplacement),
      date_depart      = coalesce(v_depart, case when v_existant.date_depart >= current_date then v_existant.date_depart end),
      device_id        = coalesce(v_device, v_existant.device_id),
      cgu_acceptees_at = now()
    where id = v_existant.id;
    v_id := v_existant.id;
  else
    insert into public.vacanciers
      (camping_id, pseudo, avatar_emoji, emplacement, date_depart, device_id, user_id, cgu_acceptees_at)
    values
      (v_camping_id, v_pseudo, coalesce(v_avatar, '🏕️'), v_empl, v_depart, v_device, v_uid, now())
    returning id into v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- 4. Fonctions du gérant ─────────────────────────────────────────────────────
-- Code de l'heure et clé du QR code. Rend { code, cle, jusqu_a }.
create or replace function public.acces_camping(p_camping_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_cle text;
begin
  if not public.is_gerant(p_camping_id) then
    raise exception 'Réservé au gérant de ce camping' using errcode = '42501';
  end if;
  v_cle := public._cle_acces(p_camping_id);
  return jsonb_build_object(
    'code', public._code_acces(v_cle, public._heure(now())),
    'cle', v_cle,
    'jusqu_a', date_trunc('hour', now()) + interval '1 hour');
end $$;

-- Nouvelle clé : les QR codes imprimés avant ne marchent plus, et le code du
-- jour change aussi (il en est dérivé).
create or replace function public.changer_cle_acces(p_camping_id uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare v_cle text := public._nouvelle_cle_acces();
begin
  if not public.is_gerant(p_camping_id) then
    raise exception 'Réservé au gérant de ce camping' using errcode = '42501';
  end if;
  insert into public.camping_secrets (camping_id, cle_acces, cree_le)
  values (p_camping_id, v_cle, now())
  on conflict (camping_id) do update set cle_acces = excluded.cle_acces, cree_le = excluded.cree_le;
  return v_cle;
end $$;

-- 5. Déclencheurs ────────────────────────────────────────────────────────────
create or replace function public.creer_secret_camping()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.camping_secrets (camping_id, cle_acces)
  values (new.id, public._nouvelle_cle_acces())
  on conflict (camping_id) do nothing;
  return new;
end $$;

create or replace trigger trg_secret_camping after insert on public.campings
  for each row execute function public.creer_secret_camping();

-- Un profil ne change pas de camping par l'API (ni vacancier, ni gérant).
-- Pas security definer : current_user doit être le rôle de l'appelant.
create or replace function public.figer_camping_vacancier()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.camping_id is distinct from old.camping_id and current_user in ('anon', 'authenticated') then
    raise exception 'Un profil vacancier ne change pas de camping' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace trigger trg_figer_camping_vacancier before update on public.vacanciers
  for each row execute function public.figer_camping_vacancier();

-- 6. Droits ──────────────────────────────────────────────────────────────────
revoke all on function public._nouvelle_cle_acces()                     from public, anon, authenticated;
revoke all on function public._cle_acces(uuid)                          from public, anon, authenticated;
revoke all on function public._heure(timestamptz)                       from public, anon, authenticated;
revoke all on function public._code_acces(text, bigint)                 from public, anon, authenticated;
revoke all on function public._code_accepte(text, text, timestamptz)    from public, anon, authenticated;
revoke all on function public._jeton_acces(text, uuid, bigint)          from public, anon, authenticated;
revoke all on function public._distance_m(float8, float8, float8, float8) from public, anon, authenticated;
revoke all on function public._verifier_preuve(uuid, jsonb)             from public, anon, authenticated;
revoke all on function public.creer_secret_camping()                    from public, anon, authenticated;
revoke all on function public.figer_camping_vacancier()                 from public, anon, authenticated;

revoke all on function public.verifier_acces_camping(text, jsonb)       from public, anon;
revoke all on function public.rejoindre_camping(text, jsonb, jsonb)     from public, anon;
revoke all on function public.acces_camping(uuid)                       from public, anon;
revoke all on function public.changer_cle_acces(uuid)                   from public, anon;
grant execute on function public.verifier_acces_camping(text, jsonb)    to authenticated;
grant execute on function public.rejoindre_camping(text, jsonb, jsonb)  to authenticated;
grant execute on function public.acces_camping(uuid)                    to authenticated;
grant execute on function public.changer_cle_acces(uuid)                to authenticated;

-- 7. Une clé pour chaque camping existant (seule écriture de données) ────────
insert into public.camping_secrets (camping_id, cle_acces)
select id, public._nouvelle_cle_acces() from public.campings
on conflict (camping_id) do nothing;
