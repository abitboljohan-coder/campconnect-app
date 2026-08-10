import { supabase } from '../../supabase'

/**
 * Écrit une partie de `carte_config` sans écraser le reste.
 *
 * Quatre écrans d'administration touchent à cet objet — contour, points
 * d'intérêt, calage du plan, position du camping — et chacun l'écrivait de la
 * même façon : `{ ...(camping.carte_config || {}), sa_cle: valeur }`.
 *
 * Le défaut n'est pas dans le fusionnement, il est dans ce qu'on fusionne.
 * `camping.carte_config` est la copie chargée par le composant à son montage.
 * Entre ce chargement et l'enregistrement, un autre écran — ou le même, dans
 * un autre onglet — a pu écrire autre chose. L'objet parti au serveur est
 * alors un état d'il y a cinq minutes, et tout ce qui a été ajouté depuis
 * disparaît sans un mot.
 *
 * C'est ce qui a effacé les points d'intérêt détectés : ils ont été remplacés
 * par un objet ne contenant qu'un « center », écrit depuis un écran qui ne les
 * avait jamais vus.
 *
 * On relit donc la valeur au moment d'écrire, jamais celle de l'affichage. La
 * fenêtre de course n'est pas nulle — il faudrait un `||` côté Postgres pour
 * cela — mais elle passe de plusieurs minutes à quelques millisecondes.
 */
export async function fusionnerCarteConfig(campingId, patch) {
  const { data, error: erreurLecture } = await supabase
    .from('campings').select('carte_config').eq('id', campingId).single()

  if (erreurLecture) return { config: null, error: erreurLecture }

  const config = { ...(data?.carte_config || {}), ...patch }
  const { error } = await supabase
    .from('campings').update({ carte_config: config }).eq('id', campingId)

  return { config, error }
}
