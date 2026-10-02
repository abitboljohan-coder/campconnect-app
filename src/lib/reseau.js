/**
 * Chargement d'un écran : plusieurs requêtes Supabase en parallèle, avec un
 * délai maximal.
 *
 * Les écrans ignoraient l'`error` renvoyé par Supabase : un réseau de camping
 * qui flanche donnait une liste vide, « Aucun groupe… Soyez le premier ! », et
 * le vacancier créait un groupe en double. Sans délai, sur un réseau qui ne
 * répond pas du tout, le squelette de chargement tournait indéfiniment.
 *
 * Renvoie `{ resultats, error }` : les réponses dans l'ordre des requêtes, et
 * la première erreur rencontrée (ou une erreur « délai dépassé »).
 */
export const DELAI_RESEAU = 15000

export const ERREUR_DELAI = { code: 'delai', message: 'Délai réseau dépassé' }

export async function toutCharger(requetes, ms = DELAI_RESEAU) {
  let minuteur
  const delai = new Promise(resolve => { minuteur = setTimeout(() => resolve(null), ms) })
  let resultats
  try {
    resultats = await Promise.race([Promise.all(requetes), delai])
  } catch (e) {
    // fetch peut rejeter (hors ligne) au lieu de renvoyer { error }.
    resultats = requetes.map(() => ({ error: { message: String(e?.message || e) } }))
  } finally {
    clearTimeout(minuteur)
  }
  if (!resultats) return { resultats: requetes.map(() => ({})), error: ERREUR_DELAI }
  return { resultats, error: resultats.find(r => r?.error)?.error || null }
}

/**
 * La table n'existe pas sur cette base : la fonction n'est pas encore déployée
 * pour ce camping. À distinguer d'une coupure réseau, qui se réessaie.
 * 42P01 : code PostgreSQL ; PGRST205 : PostgREST ne trouve pas la table.
 */
export const estTableAbsente = (error) => ['42P01', 'PGRST205'].includes(error?.code)
