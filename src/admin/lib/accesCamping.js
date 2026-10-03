import { supabase } from '../../supabase'

/**
 * Code du jour et clé du QR code, calculés par le serveur.
 *
 * Le code était calculé dans l'application à partir de l'identifiant du
 * camping, qui est public : n'importe qui pouvait le recalculer et entrer
 * dans n'importe quel camping. Il dérive désormais d'une clé secrète par
 * camping (table camping_secrets), que seul le gérant lit, par ces fonctions.
 */

/** { code, cle, jusqu_a } — refusé (erreur) à qui n'est pas gérant du camping. */
export async function lireAccesCamping(campingId) {
  const { data, error } = await supabase.rpc('acces_camping', { p_camping_id: campingId })
  return { data: data || null, error }
}

/** Nouvelle clé : les QR codes déjà imprimés ne marchent plus. Rend la clé. */
export async function changerCleAcces(campingId) {
  const { data, error } = await supabase.rpc('changer_cle_acces', { p_camping_id: campingId })
  return { data: data || null, error }
}

/** Millisecondes avant le prochain changement de code (début de l'heure suivante). */
export const msAvantNouveauCode = (maintenant = Date.now()) => 3_600_000 - (maintenant % 3_600_000)
