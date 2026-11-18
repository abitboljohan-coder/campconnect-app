-- Démos des campings prospects : groupes et animations toujours « à venir ».
-- (demande de Johan, 18/11/2026 : « rends les permanents »)
--
-- Les démos créées pour un prospect (etang-bleu, courte-vallee, lac-de-neguenou,
-- demo-rives-du-lac) n'étaient pas avancées par rafraichir_demo(), qui ne traite
-- que les-flots-bleus : leurs groupes passaient et estActuel les masquait.
--
-- Principe, sans date d'ancre : chaque nuit (appelé par rafraichir_demo, donc par
-- le cron rafraichir-demo de 3 h UTC), pour chaque camping inscrit dans
-- demo_prospects :
--   - un groupe des personnages (createur_id nul ou personnage) déjà passé avance
--     d'autant de jours entiers qu'il faut pour revenir dans le futur, à la même
--     heure ; les messages des personnages de ce groupe avancent d'autant ;
--   - une animation terminée avance de semaines entières (elle garde son jour :
--     « BBQ night » reste le vendredi) ;
--   - les personnages ne partent jamais.
-- Les groupes et messages des vrais comptes ne bougent pas.
-- Sortir un camping de la démo (devenu client) : delete from demo_prospects where camping_id = ...

create table if not exists demo_prospects (
  camping_id uuid primary key references campings(id) on delete cascade
);
alter table demo_prospects enable row level security;  -- aucune politique : invisible pour anon et authenticated

create or replace function public.rafraichir_demos_prospects()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r record;
  h timestamptz;
  k int;
  aujourdhui date := (now() at time zone 'Europe/Paris')::date;
begin
  for r in
    select g.id, g.heure
      from groupes g
      join demo_prospects d on d.camping_id = g.camping_id
      left join vacanciers v on v.id = g.createur_id
     where g.heure is not null
       and (g.createur_id is null or v.user_id is null)
  loop
    -- heure est du texte : ISO avec Z ou décalage, ou heure locale de Paris sans fuseau (seeds).
    h := case when r.heure ~ '(Z|[+-][0-9]{2}:?[0-9]{2})$' then r.heure::timestamptz
              else r.heure::timestamp at time zone 'Europe/Paris' end;
    if h >= now() then continue; end if;
    k := floor(extract(epoch from now() - h) / 86400)::int + 1;
    update groupes
       set heure = to_char((h + k * interval '1 day') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
           created_at = created_at + k * interval '1 day'
     where id = r.id;
    update messages m
       set created_at = m.created_at + k * interval '1 day'
     where m.groupe_id = r.id
       and exists (select 1 from vacanciers v where v.id = m.auteur_id and v.user_id is null);
  end loop;

  update animations a
     set debut = a.debut + w.n * interval '7 days',
         fin   = a.fin   + w.n * interval '7 days'
    from (select a2.id, floor(extract(epoch from now() - a2.debut) / 604800)::int + 1 as n
            from animations a2 join demo_prospects d on d.camping_id = a2.camping_id
           where coalesce(a2.fin, a2.debut) < now()) w
   where a.id = w.id;

  update vacanciers v set date_depart = aujourdhui + 7
    from demo_prospects d
   where v.camping_id = d.camping_id and v.user_id is null;
end;
$function$;

revoke all on function public.rafraichir_demos_prospects() from public, anon, authenticated;

-- Inscription des démos prospects.
insert into demo_prospects (camping_id)
select id from campings where slug in ('etang-bleu', 'courte-vallee', 'lac-de-neguenou', 'demo-rives-du-lac')
on conflict do nothing;

-- Tous les jours à 3 h 05 UTC, juste après rafraichir-demo et avant la purge des partis (4 h 15).
select cron.schedule('rafraichir-demos-prospects', '5 3 * * *', 'select public.rafraichir_demos_prospects()');

-- Premier passage immédiat.
select public.rafraichir_demos_prospects();
