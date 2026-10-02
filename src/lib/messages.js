import { supabase } from '../supabase'

// Suppression, par son auteur, d'un message envoyé dans une discussion de groupe.

/**
 * Retire un message de la liste affichée.
 *
 * Renvoie la même liste, intacte, quand le message n'y est pas : le temps réel
 * ne sait pas filtrer les suppressions par groupe, chaque discussion ouverte
 * reçoit donc aussi celles des autres groupes, qu'il faut ignorer sans
 * provoquer de rendu.
 */
export function retirerMessage(liste, id) {
  return liste.some(m => m.id === id) ? liste.filter(m => m.id !== id) : liste
}

/**
 * Supprime un message de son auteur. Vrai seulement si la base a réellement
 * effacé la ligne : une règle qui refuse la suppression ne renvoie pas
 * d'erreur, seulement zéro ligne, et l'on annoncerait sinon un faux succès.
 */
export async function supprimerMessage(id, auteurId) {
  const { data, error } = await supabase.from('messages')
    .delete().eq('id', id).eq('auteur_id', auteurId).select('id')
  if (error || !data?.length) {
    console.error('Suppression message échouée :', error || 'aucune ligne supprimée')
    return false
  }
  return true
}
