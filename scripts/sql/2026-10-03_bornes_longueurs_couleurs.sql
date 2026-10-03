-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-10-03 — Bornes de longueur côté base, et format des couleurs du camping
-- Migration appliquée : bornes_longueurs_couleurs
--
-- Les longueurs n'étaient bornées que par les champs de l'app (maxLength),
-- que l'API contourne : un statut, une annonce, un pseudo ou une candidature
-- (formulaire public, sans session) pouvaient peser des mégaoctets. Les bornes
-- sont larges — bien au-dessus de ce que l'app laisse saisir — et toutes les
-- lignes existantes les respectent (vérifié : la contrainte est validée à la
-- création).
--
-- campings.couleur_principale était injectée sans échappement dans le HTML
-- des marqueurs de la carte (Map.jsx) : un gérant pouvait y glisser du HTML
-- exécuté chez ses vacanciers. Le sélecteur de couleur de l'espace gérant
-- n'écrit que des #rrggbb ; la base n'accepte plus que ce format.
-- L'app 1.0.3 échappe aussi la valeur (défense en profondeur).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.vacanciers
  add constraint vacanciers_pseudo_borne      check (char_length(pseudo) <= 60),
  add constraint vacanciers_emplacement_borne check (emplacement is null or char_length(emplacement) <= 40);

alter table public.statuts
  add constraint statuts_texte_borne check (texte is null or char_length(texte) <= 280);

alter table public.annonces
  add constraint annonces_titre_borne       check (titre is null or char_length(titre) <= 120),
  add constraint annonces_description_borne check (description is null or char_length(description) <= 2000);

alter table public.signalements
  add constraint signalements_description_borne check (description is null or char_length(description) <= 2000),
  add constraint signalements_lieu_borne        check (lieu is null or char_length(lieu) <= 200),
  add constraint signalements_cible_texte_borne check (cible_texte is null or char_length(cible_texte) <= 4000);

alter table public.groupes
  add constraint groupes_lieu_borne check (lieu is null or char_length(lieu) <= 120);

alter table public.animations
  add constraint animations_titre_borne       check (titre is null or char_length(titre) <= 120),
  add constraint animations_description_borne check (description is null or char_length(description) <= 4000),
  add constraint animations_lieu_borne        check (lieu is null or char_length(lieu) <= 200);

alter table public.candidatures
  add constraint candidatures_nom_borne          check (nom is null or char_length(nom) <= 200),
  add constraint candidatures_email_borne        check (email is null or char_length(email) <= 320),
  add constraint candidatures_camping_borne      check (camping is null or char_length(camping) <= 200),
  add constraint candidatures_emplacements_borne check (emplacements is null or char_length(emplacements) <= 50),
  add constraint candidatures_message_borne      check (message is null or char_length(message) <= 5000);

alter table public.campings
  add constraint campings_nom_borne check (nom is null or char_length(nom) <= 120),
  add constraint campings_couleur_principale_hex
    check (couleur_principale is null or couleur_principale ~ '^#[0-9A-Fa-f]{3,8}$'),
  add constraint campings_couleur_secondaire_hex
    check (couleur_secondaire is null or couleur_secondaire ~ '^#[0-9A-Fa-f]{3,8}$');
