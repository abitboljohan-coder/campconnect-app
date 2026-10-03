-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-10-03 — Fonctions « security definer » : droits d'exécution au plus juste
-- Migration appliquée : durcissement_fonctions_securite
--
-- Alertes get_advisors (WARN) traitées :
--  • notifier_push, notifier_candidature, touch_push_tokens sont des fonctions
--    de déclencheur. Elles étaient appelables par l'API (/rest/v1/rpc/…) par
--    anon et authenticated. Un déclencheur n'a pas besoin de ce droit pour
--    s'exécuter : on le retire à tout le monde (prouvé : un message inséré
--    par un vacancier et une candidature insérée sans session déclenchent
--    toujours leur notification).
--  • a_cree_camping et est_banni étaient exécutables par anon : aucune
--    politique visant anon ne les utilise. Retiré à anon, gardé pour
--    authenticated (les politiques RLS les appellent).
--  • touch_push_tokens n'avait pas de search_path fixé.
--
-- Gardés volontairement pour authenticated (alerte attendue) : is_gerant,
-- my_camping_id, my_vacancier_id, est_banni, a_cree_camping,
-- jeton_push_autorise — les politiques RLS les appellent avec les droits de
-- l'utilisateur ; mon_profil, vacanciers_du_camping, vacanciers_presents —
-- appelées par l'app, et qui ne rendent que ce qui revient à l'appelant.
--
-- notifier_candidature envoie désormais l'en-tête x-webhook-secret (le même
-- secret que les notifications push, lu dans le coffre). Tant que l'Edge
-- Function notify-candidature n'a pas de NOTIFY_SECRET, elle l'ignore : aucun
-- changement. Dès que Johan pose NOTIFY_SECRET (même valeur), elle refusera
-- tout appel qui ne vient pas de la base. Voir docs/AUDIT_APP.md.
-- ─────────────────────────────────────────────────────────────────────────────

alter function public.touch_push_tokens() set search_path = '';

-- Les politiques RLS ont besoin de ces deux-là pour authenticated : on le
-- garantit explicitement avant de retirer le droit hérité de PUBLIC.
grant  execute on function public.a_cree_camping(uuid) to authenticated;
grant  execute on function public.est_banni()          to authenticated;
revoke execute on function public.a_cree_camping(uuid) from public, anon;
revoke execute on function public.est_banni()          from public, anon;

revoke execute on function public.notifier_push()         from public, anon, authenticated;
revoke execute on function public.notifier_candidature()  from public, anon, authenticated;
revoke execute on function public.touch_push_tokens()     from public, anon, authenticated;

create or replace function public.notifier_candidature()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  secret text;
  entetes jsonb := '{"Content-Type": "application/json"}'::jsonb;
begin
  select decrypted_secret into secret
    from vault.decrypted_secrets where name = 'push_webhook_secret' limit 1;
  if secret is not null then
    entetes := entetes || jsonb_build_object('x-webhook-secret', secret);
  end if;

  perform net.http_post(
    url     := 'https://tswpintevokeasteyjno.supabase.co/functions/v1/notify-candidature',
    headers := entetes,
    body    := jsonb_build_object('type', 'INSERT', 'table', 'candidatures', 'record', to_jsonb(new))
  );
  return new;
exception when others then
  -- Une candidature ne doit jamais être perdue parce que la notification échoue.
  raise warning 'Notification candidature échouée : %', sqlerrm;
  return new;
end $function$;

-- create or replace conserve les droits : on les retire de nouveau par sûreté.
revoke execute on function public.notifier_candidature() from public, anon, authenticated;
