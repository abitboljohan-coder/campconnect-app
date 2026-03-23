-- ============================================================
-- SEED DEMO — CampConnect
-- Copiez ce SQL dans l'éditeur Supabase (SQL Editor)
-- ============================================================

-- 1. Camping démo
INSERT INTO campings (slug, nom, couleur_principale, description)
VALUES (
  'demo',
  'Camping Les Pins Dorés',
  '#2d7d32',
  'Votre havre de paix en pleine nature'
)
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID du camping démo pour les inserts suivants
DO $$
DECLARE
  camping_id uuid;
  groupe1_id uuid;
  groupe2_id uuid;
BEGIN
  SELECT id INTO camping_id FROM campings WHERE slug = 'demo';

  -- 2. Groupes
  INSERT INTO groupes (camping_id, nom, description)
  VALUES
    (camping_id, 'Famille & Enfants', 'Activités et échanges pour les familles'),
    (camping_id, 'Pétanque Club', 'Organisation des tournois de pétanque'),
    (camping_id, 'Randonneurs', 'Sorties randonnée dans la forêt'),
    (camping_id, 'Soirées & BBQ', 'Pour organiser les soirées collectives')
  ON CONFLICT DO NOTHING
  RETURNING id INTO groupe1_id;

  SELECT id INTO groupe1_id FROM groupes WHERE camping_id = camping_id AND nom = 'Famille & Enfants';
  SELECT id INTO groupe2_id FROM groupes WHERE camping_id = camping_id AND nom = 'Pétanque Club';

  -- 3. Animations
  INSERT INTO animations (camping_id, titre, description, lieu, date_debut, date_fin, places_max)
  VALUES
    (
      camping_id,
      'Tournoi de pétanque',
      'Grand tournoi ouvert à tous, par équipes de 2. Inscription sur place.',
      'Terrain de pétanque',
      NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
      NOW() + INTERVAL '1 day' + INTERVAL '12 hours',
      30
    ),
    (
      camping_id,
      'Soirée barbecue',
      'Grande soirée BBQ avec musique live. Amenez vos spécialités !',
      'Zone barbecue centrale',
      NOW() + INTERVAL '2 days' + INTERVAL '19 hours',
      NOW() + INTERVAL '2 days' + INTERVAL '23 hours',
      NULL
    ),
    (
      camping_id,
      'Randonnée découverte',
      'Balade de 8km dans la forêt des Pins. Niveau débutant. Chaussures de marche conseillées.',
      'Départ accueil camping',
      NOW() + INTERVAL '3 days' + INTERVAL '9 hours',
      NOW() + INTERVAL '3 days' + INTERVAL '12 hours',
      20
    ),
    (
      camping_id,
      'Atelier poterie enfants',
      'Atelier créatif pour les enfants de 6 à 12 ans. Matériel fourni.',
      'Salle d''activités',
      NOW() + INTERVAL '4 days' + INTERVAL '14 hours',
      NOW() + INTERVAL '4 days' + INTERVAL '16 hours',
      15
    ),
    (
      camping_id,
      'Yoga du matin',
      'Séance de yoga pour bien démarrer la journée. Tapis recommandé.',
      'Pelouse centrale',
      NOW() + INTERVAL '5 days' + INTERVAL '8 hours',
      NOW() + INTERVAL '5 days' + INTERVAL '9 hours',
      25
    )
  ON CONFLICT DO NOTHING;

END $$;
