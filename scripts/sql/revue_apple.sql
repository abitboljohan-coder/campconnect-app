-- ═══════════════════════════════════════════════════════════════════════════
-- Préparer la revue Apple — refus du 19 août 2026 (build 1.0 (81))
--
-- Trois demandes, dans l'ordre du mail :
--   2.1    « pre-populate content within the Events, Groups, and Notices »
--   2.1(a) « we cannot access the Camp Manager accounts » → un compte gérant
--   2.1(b) modèle économique (rien à faire ici, c'est du texte)
--
-- À exécuter dans l'éditeur SQL Supabase, d'un bloc.
-- Idempotent : relançable sans créer de doublons.
--
-- ⚠️ AVANT d'exécuter : créer le compte de connexion du contrôleur.
--    Supabase → Authentication → Users → Add user → Create new user
--      Email    : appreview@campconnect.fr
--      Password : celui que vous mettrez dans App Review Information
--      ☑ Auto Confirm User   ← sinon la connexion est refusée
--    Le compte NE PEUT PAS être créé en SQL : auth.users contient un hachage
--    et une dizaine de champs internes que Supabase gère lui-même.
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ Si vous choisissez un autre email que appreview@campconnect.fr, il est à
--    remplacer à DEUX endroits : bloc 4 et bloc 5 (marqués « ← EMAIL »).


-- ── 1. Le camping reste ouvert sans vérification de position ───────────────
--     Fusion côté serveur : rien de ce que contient déjà carte_config
--     (périmètre, points d'intérêt) n'est écrasé.
update campings
set carte_config = coalesce(carte_config, '{}'::jsonb) || '{"acces_libre": true}'::jsonb
where slug = 'les-flots-bleus';


-- ── 2. Les animations retombent toujours sur les jours à venir ─────────────
--     Conserve l'heure de chaque animation et l'écart entre elles : le
--     programme garde son rythme, il est rejoué à partir de demain.
with base as (
  select min(debut::date) as premier
  from animations
  where camping_id = (select id from campings where slug = 'les-flots-bleus')
)
update animations a
set debut = a.debut + ((current_date + 1) - (select premier from base)) * interval '1 day',
    fin   = case when a.fin is not null
                 then a.fin + ((current_date + 1) - (select premier from base)) * interval '1 day'
            end
where a.camping_id = (select id from campings where slug = 'les-flots-bleus');


-- ── 3. Des annonces — l'onglet que le contrôleur a trouvé vide ─────────────
--     Trois entrées, une par type, attribuées à un vacancier existant.
--     expire_at est repoussé loin pour qu'elles survivent à toute la revue.
insert into annonces (camping_id, vacancier_id, type, titre, description, expire_at, resolu)
select c.id, v.id, d.type, d.titre, d.description, now() + interval '60 days', false
from campings c
cross join lateral (
  select id from vacanciers
  where camping_id = c.id
    and (date_depart is null or date_depart >= current_date)
  order by created_at
  limit 1
) v
cross join (values
  ('annonce'::text,
   'Tournoi de belote ce soir',
   'On cherche deux joueurs pour completer les tables. 21h au bar Le Ponton, ambiance detendue, debutants bienvenus.'),
  ('trouve',
   'Trouve : lunettes de soleil enfant',
   'Trouvees pres du toboggan de la piscine, monture bleue. Deposees a la reception.'),
  ('perdu',
   'Perdu : serviette de plage rayee',
   'Oubliee au bord du bassin dimanche apres-midi. Rayures jaunes et blanches. Merci de me prevenir ici.')
) as d(type, titre, description)
where c.slug = 'les-flots-bleus'
  and not exists (
    select 1 from annonces a where a.camping_id = c.id and a.titre = d.titre
  );


-- ── 4. Le compte gérant du contrôleur ──────────────────────────────────────
--     On AJOUTE une ligne, on ne remplace pas la vôtre : is_gerant() teste le
--     couple (user_id, camping_id), et AdminApp cherche le gérant par user_id.
--     Deux gérants peuvent donc partager le même camping sans se gêner.
insert into gerants (user_id, camping_id, email)
select u.id, c.id, u.email
from auth.users u, campings c
where u.email = 'appreview@campconnect.fr'   -- ← EMAIL
  and c.slug  = 'les-flots-bleus'
  and not exists (select 1 from gerants g where g.user_id = u.id);


-- ── 5. Contrôle — tout doit être non nul ───────────────────────────────────
select
  c.nom,
  c.carte_config->'acces_libre'                                            as acces_libre,
  (select count(*) from animations a
     where a.camping_id = c.id and a.publiee and a.debut >= now())         as evenements_a_venir,
  (select count(*) from groupes g  where g.camping_id = c.id and g.actif)  as groupes_actifs,
  (select count(*) from annonces n
     where n.camping_id = c.id and not n.resolu and n.expire_at > now())   as annonces_visibles,
  (select count(*) from vacanciers v where v.camping_id = c.id)            as vacanciers,
  (select g.email from gerants g
     where g.camping_id = c.id
       and g.email = 'appreview@campconnect.fr')                           as compte_controleur  -- ← EMAIL
from campings c
where c.slug = 'les-flots-bleus';
