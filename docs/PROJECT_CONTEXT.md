# CampConnect - Documentation produit

## Vision

CampConnect est une application mobile qui recrée le lien entre vacanciers dans les campings.

Objectif :

Permettre à des vacanciers qui ne se connaissent pas encore de se rencontrer facilement grâce à des outils simples :

- groupes spontanés
- animations
- géolocalisation
- messagerie en temps réel

---

## URLs

Application :

https://app.campconnect.fr

Site vitrine :

https://www.campconnect.fr

Supabase :

https://hsebtpliwimyidudajmi.supabase.co

---

# Fonctionnement général

Une seule application sert tous les campings.

Chaque camping dispose :

- d'un logo
- de couleurs personnalisées
- de son plan
- de ses animations
- de ses groupes
- de ses vacanciers
- de son espace administrateur

L'identification d'un camping repose sur un slug unique.

---

# Fonctionnalités vacanciers

## Carte GPS interactive

Carte satellite avec :

- plan du camping
- position utilisateur
- points d'intérêt
- groupes actifs
- animations

---

## Groupes spontanés

Exemples :

- randonnée
- pétanque
- barbecue
- apéro
- plage
- sport

Les vacanciers peuvent :

- créer un groupe
- rejoindre un groupe
- quitter un groupe

---

## Chat temps réel

Chaque groupe possède son propre chat.

Technologie :

Supabase Realtime.

---

## Animations

Les vacanciers peuvent :

- consulter les animations
- voir le nombre de participants
- s'inscrire
- se désinscrire

---

## Livret d'accueil numérique

Contenu configurable :

- horaires
- wifi
- règlement
- snack
- laverie
- poubelles
- animaux
- urgences

---

## Profil vacancier

Informations :

- pseudo
- avatar emoji
- emplacement
- tranche d'âge
- avec qui voyage-t-il
- centres d'intérêt

Aucune adresse email requise.

---

## Contrôle d'accès

Accès possible via :

### QR Code

QR remis par la réception.

### GPS

Utilisateur situé à moins de 800 mètres du camping.

### Code horaire

Code de 4 chiffres renouvelé toutes les heures.

---

# Interface gérant

Accessible via :

/admin

---

## Dashboard

Affiche :

- vacanciers inscrits
- groupes actifs
- inscriptions du jour
- taux de participation
- activité récente
- code horaire

---

## Animations

Gestion complète :

- création
- modification
- publication
- suppression
- capacités
- inscriptions

---

## Carte

Fonctionnalités :

- upload plan
- placement points d'intérêt
- édition de la carte

---

## Apparence

Configuration :

- logo
- nom
- couleur principale
- couleur secondaire

Les changements sont visibles immédiatement.

---

## Statistiques

Suivi :

- vacanciers par jour
- groupes créés
- inscriptions
- tranches d'âge
- centres d'intérêt

---

## Paramètres

Gestion :

- identifiants gérant
- QR code
- réinitialisation des données saisonnières

---

# Tarifs

## Découverte

490 €/an

Jusqu'à 50 emplacements.

---

## Essentiel

790 €/an

Jusqu'à 200 emplacements.

---

## Premium

1290 €/an

Plus de 200 emplacements.

---

# Offre pilote

Saison 2026 :

3 campings sélectionnés gratuitement.

Objectif :

Validation terrain et collecte de retours utilisateurs.

---

# Stack technique

Frontend :

- React 19
- Vite
- React Router v7

Backend :

- Supabase PostgreSQL
- Supabase Realtime

Cartographie :

- Leaflet
- ESRI
- Nominatim

Emails :

- Resend

API :

- Vercel Functions

Analytics :

- Google Analytics

---

# Schéma de données

campings

- id
- nom
- slug
- couleur_principale
- couleur_secondaire
- logo_url
- plan_url
- carte_config
- infos

vacanciers

- id
- camping_id
- pseudo
- avatar_emoji
- emplacement
- tranche_age
- avec
- interests
- device_id

animations

- id
- camping_id
- titre
- emoji
- lieu
- debut
- places_max
- publiee
- description

groupes

- id
- camping_id
- titre
- emoji
- lieu
- heure
- actif

membres_groupes

- groupe_id
- vacancier_id

messages

- id
- groupe_id
- vacancier_id
- contenu
- created_at

inscriptions

- animation_id
- vacancier_id

gerants

- id
- camping_id
- email

candidatures

- id
- created_at
- nom
- email
- camping
- emplacements
- message

---

# Contraintes importantes

- Mobile first obligatoire
- Architecture multi-camping obligatoire
- Supabase = source de vérité
- Temps de chargement minimal
- UX simple avant toute autre considération
- Réutiliser les composants existants lorsque possible

---

# Roadmap

Priorités actuelles :

- onboarding gérant self-service
- push notifications
- export CSV
- sécurisation RLS
- amélioration des statistiques
- pilote 2026