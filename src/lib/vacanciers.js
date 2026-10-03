import { supabase } from '../supabase'

/**
 * Lecture des profils vacanciers.
 *
 * Les colonnes sensibles d'un profil — emplacement (où il dort), tranche
 * d'âge, date de départ, identifiants techniques — ne se lisent jamais
 * directement dans la table : la base cessera de les livrer (phase 2 de
 * l'audit du 3 octobre 2026, scripts/sql/a_appliquer_apres_1.0.3_colonnes_vacanciers.sql).
 * Elles passent par trois fonctions de la base, qui ne rendent que ce qui
 * revient à l'appelant :
 *
 *   mon_profil            son propre profil sur ce camping, complet ;
 *   vacanciers_du_camping tous les profils complets — gérants du camping seulement ;
 *   vacanciers_presents   id et avatar des présents — vacanciers et gérants du camping.
 *
 * Sur la table elle-même, ne lire que COLONNES_PUBLIQUES (ou une partie).
 */
export const COLONNES_PUBLIQUES = 'id, camping_id, pseudo, avatar_emoji, avec, interests, created_at'

// Une fonction « setof » renvoie un tableau ; on n'en veut que la ligne.
const premiere = data => (Array.isArray(data) ? data[0] : data) ?? null

/** Son propre profil sur ce camping, toutes colonnes, ou null. */
export async function lireMonProfil(campingId) {
  const { data, error } = await supabase.rpc('mon_profil', { p_camping_id: campingId })
  return { data: premiere(data), error }
}

/** Profils complets du camping, pour l'espace gérant. Vide pour qui n'en est pas gérant. */
export async function lireVacanciersDuCamping(campingId) {
  const { data, error } = await supabase.rpc('vacanciers_du_camping', { p_camping_id: campingId })
  return { data: data || [], error }
}

/** Vacanciers encore présents du camping : [{ id, avatar_emoji }]. */
export async function lirePresents(campingId) {
  const { data, error } = await supabase.rpc('vacanciers_presents', { p_camping_id: campingId })
  return { data: data || [], error }
}
