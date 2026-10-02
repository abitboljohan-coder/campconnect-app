// « Encore présent au camping ».
//
// La date de départ est facultative à l'inscription. Sans elle, un vacancier
// restait « présent » pour toujours : le compteur de l'accueil gérant ne
// faisait que monter au fil de la saison. Sans date de départ, on le compte
// donc présent pendant DUREE_SANS_DEPART jours après son arrivée (created_at).
//
// Cette règle ne vaut que pour les compteurs et les listes. Les notifications
// (supabase/functions/send-push) ne l'appliquent pas, volontairement : la date
// étant facultative, un vacancier qui ne l'a pas donnée ne doit pas cesser
// d'être prévenu au bout d'une semaine (décision du 3 octobre 2026).

export const DUREE_SANS_DEPART = 7   // jours

const jour = d => d.toISOString().slice(0, 10)

export const todayISO = (maintenant = new Date()) => jour(maintenant)

/** Date (AAAA-MM-JJ) avant laquelle une arrivée sans date de départ est trop ancienne. */
export const debutFenetre = (maintenant = new Date()) =>
  jour(new Date(maintenant.getTime() - DUREE_SANS_DEPART * 86400000))

// Filtre PostgREST : .or(presentFilter())  ou  .or(presentFilter(), { foreignTable: 'vacanciers' })
export const presentFilter = (maintenant = new Date()) =>
  `date_depart.gte.${todayISO(maintenant)},and(date_depart.is.null,created_at.gte.${debutFenetre(maintenant)})`

/** La même règle, en JavaScript. */
export function estPresent(v, maintenant = new Date()) {
  if (!v) return false
  if (v.date_depart) return v.date_depart >= todayISO(maintenant)
  return !!v.created_at && jour(new Date(v.created_at)) >= debutFenetre(maintenant)
}
