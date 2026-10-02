/**
 * Message d'erreur lisible par un gérant.
 *
 * Supabase renvoie ses erreurs en anglais (« Invalid login credentials »,
 * « Email rate limit exceeded »…) et l'espace gérant les affichait telles
 * quelles. On traduit les cas connus ; tout le reste devient un message
 * générique plutôt qu'un texte technique incompréhensible.
 */
const CONNUES = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [/email not confirmed/i, 'Confirmez votre email (lien reçu par mail) avant de vous connecter.'],
  [/already (registered|been registered)|already exists/i, 'Un compte existe déjà avec cet email.'],
  [/password should be at least|weak.?password/i, 'Mot de passe trop court ou trop simple (8 caractères minimum).'],
  [/should be different from the old password/i, "Le nouveau mot de passe doit être différent de l'ancien."],
  [/invalid format|email address .* is invalid|validate email/i, "Cette adresse email n'est pas valide."],
  [/rate limit|too many requests|only request this after/i, 'Trop de tentatives. Patientez une minute, puis réessayez.'],
  [/signups? not allowed|signup is disabled/i, 'Les inscriptions sont momentanément fermées. Écrivez-nous à contact@campconnect.fr.'],
  [/failed to fetch|network ?(error|request failed)|load failed/i,'Pas de connexion. Vérifiez votre réseau et réessayez.'],
  [/jwt|session.*(expired|missing)|not authenticated/i, 'Votre session a expiré. Reconnectez-vous.'],
]

export const ERREUR_GENERIQUE = 'Enregistrement impossible, vérifiez la connexion et réessayez.'

export function traduireErreur(erreur, repli = ERREUR_GENERIQUE) {
  const message = typeof erreur === 'string' ? erreur : erreur?.message
  if (!message) return repli
  const trouvee = CONNUES.find(([motif]) => motif.test(message))
  return trouvee ? trouvee[1] : repli
}
