import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { toast } from '../../toast'
import { lireVacanciersDuCamping } from '../../lib/vacanciers'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, Squelette, Vide, couleur as jetons, espace, graisse, rayon } from '../../design'

const CAT_LABELS = {
  proprete: { emoji: '🧹', label: 'Propreté' },
  panne:    { emoji: '🔧', label: 'Panne' },
  securite: { emoji: '⚠️', label: 'Sécurité' },
  bruit:    { emoji: '🔊', label: 'Bruit' },
  autre:    { emoji: '💬', label: 'Autre' },
  contenu:  { emoji: '🚩', label: 'Contenu signalé' },
  blocage:  { emoji: '🚫', label: 'Vacancier bloqué' },
}
const cat = (id) => CAT_LABELS[id] || CAT_LABELS.autre

// Où vit le contenu visé par un signalement, et comment le nommer.
const CIBLES = {
  message: { table: 'messages', nom: 'le message' },
  statut:  { table: 'statuts',  nom: 'le statut' },
  annonce: { table: 'annonces', nom: "l'annonce" },
}

// `action` : le libellé du bouton qui y mène. « → Résolus », au pluriel,
// se lisait comme un onglet plutôt que comme une action sur ce signalement.
const STATUTS = [
  { id: 'nouveau',  label: 'Nouveaux',  action: 'Rouvrir',          couleur: jetons.danger, bg: jetons.dangerFond },
  { id: 'en_cours', label: 'En cours',  action: 'Marquer en cours', couleur: '#d97706', bg: '#fffbeb' },
  { id: 'resolu',   label: 'Résolus',   action: 'Marquer résolu',   couleur: '#16a34a', bg: '#f0fdf4' },
]

export default function Signalements({ camping }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur]   = useState(false)
  const [filtre, setFiltre]   = useState('nouveau')
  const [photo, setPhoto]     = useState(null) // URL en plein écran
  const [retires, setRetires] = useState(() => new Set()) // contenus supprimés depuis cette page

  async function charger() {
    // L'auteur du signalement (avec son emplacement) et la personne signalée
    // (avec son état « banni ») viennent de vacanciers_du_camping, réservée aux
    // gérants : la table ne livrera plus ces colonnes directement. Cela évite
    // aussi la jointure ambiguë (deux clés étrangères vers vacanciers), qui
    // avait fait afficher « Aucun nouveau signalement » pendant des semaines.
    const [{ data, error: errSig }, { data: vacs, error: errVacs }] = await Promise.all([
      supabase.from('signalements').select('*')
        .eq('camping_id', camping.id)
        .order('created_at', { ascending: false }),
      lireVacanciersDuCamping(camping.id),
    ])
    const error = errSig || errVacs
    // Un échec ne doit jamais se lire comme « rien à traiter ».
    if (error) console.error('Chargement des signalements échoué :', error)
    setErreur(!!error)
    if (!error) {
      const parId = new Map(vacs.map(v => [v.id, v]))
      setItems((data || []).map(s => ({
        ...s,
        vacanciers: parId.get(s.vacancier_id) || null,
        auteur: parId.get(s.auteur_signale_id) || null,
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    async function init() { await charger() }
    init()
  }, [camping.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime : un nouveau signalement apparaît sans rafraîchir
  useEffect(() => {
    const channel = supabase
      .channel(`signalements_${camping.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements', filter: `camping_id=eq.${camping.id}` },
        () => charger())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [camping.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function changerStatut(item, statut) {
    const avant = items
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, statut } : i))
    const { error } = await supabase.from('signalements')
      .update({ statut, traite_at: statut === 'resolu' ? new Date().toISOString() : null })
      .eq('id', item.id)
    if (error) {
      console.error('Changement de statut échoué :', error)
      setItems(avant)
      toast('Impossible de changer le statut pour le moment.', 'erreur')
    }
  }

  // Le signalement disait quoi, sans permettre d'agir : il fallait retrouver
  // le message dans la page Modération, parmi cent autres. On agit d'ici.
  async function supprimerContenu(item) {
    const cible = CIBLES[item.cible_type]
    if (!cible || !confirm(`Supprimer ${cible.nom} signalé ? Il disparaîtra pour tous les vacanciers.`)) return
    const { error } = await supabase.from(cible.table).delete().eq('id', item.cible_id)
    if (error) { console.error('Suppression échouée :', error); toast('Suppression impossible pour le moment.', 'erreur'); return }
    setRetires(prev => new Set(prev).add(item.cible_id))
    toast('Contenu supprimé', 'succes')
    if (item.statut !== 'resolu') changerStatut(item, 'resolu')
  }

  async function bannirAuteur(item) {
    const pseudo = item.auteur?.pseudo || 'ce vacancier'
    if (!confirm(`Bannir ${pseudo} ? Il ne pourra plus rien publier dans votre camping.`)) return
    const { error } = await supabase.from('vacanciers').update({ banni: true }).eq('id', item.auteur_signale_id)
    if (error) { console.error('Bannissement échoué :', error); toast('Bannissement impossible pour le moment.', 'erreur'); return }
    setItems(prev => prev.map(i => i.auteur_signale_id === item.auteur_signale_id
      ? { ...i, auteur: { ...i.auteur, banni: true } } : i))
    toast(`${pseudo} est banni`, 'succes')
  }

  const compte = (id) => items.filter(i => i.statut === id).length
  const affiches = items.filter(i => i.statut === filtre)

  return (
    <Pile espace="lg">
      <EnTete titre="Signalements" sous="Les problèmes remontés par vos vacanciers, en temps réel." />

      {/* Onglets par statut */}
      <div role="group" aria-label="Statut des signalements"
           style={{ display: 'flex', gap: espace.sm, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button
            key={s.id}
            onClick={() => setFiltre(s.id)}
            aria-pressed={filtre === s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', minHeight: 44, borderRadius: 10, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: filtre === s.id ? s.couleur : '#fff',
              border: `1.5px solid ${filtre === s.id ? s.couleur : jetons.bordure}`,
              color: filtre === s.id ? '#fff' : jetons.texteMoyen,
            }}
          >
            {s.label}
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
              background: filtre === s.id ? 'rgba(255,255,255,0.25)' : s.bg,
              color: filtre === s.id ? '#fff' : s.couleur,
            }}>{compte(s.id)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Squelette lignes={3} hauteur={92} libelle="Chargement…" />
      ) : erreur ? (
        <Bloc>
          <Vide emoji="⚠️" texte="Impossible de charger les signalements. Vérifiez la connexion puis rechargez la page." />
        </Bloc>
      ) : affiches.length === 0 ? (
        <Bloc>
          <Vide
            emoji={filtre === 'nouveau' ? '🎉' : '📭'}
            texte={filtre === 'nouveau' ? 'Aucun nouveau signalement.' : 'Rien dans cette catégorie.'}
          />
        </Bloc>
      ) : (
        <Pile espace="md">
          {affiches.map(item => {
            const c = cat(item.categorie)
            return (
              <Bloc key={item.id} padding={espace.lg} style={{ display: 'flex', gap: 14 }}>
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt=""
                    onClick={() => setPhoto(item.photo_url)}
                    style={{ width: 84, height: 84, borderRadius: rayon.md, objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: jetons.surfaceDouce, color: jetons.texteMoyen }}>
                      {c.emoji} {c.label}
                    </span>
                    {item.lieu && <span style={{ fontSize: 12.5, color: jetons.texteDoux }}>📍 {item.lieu}</span>}
                    <span style={{ fontSize: 12, color: jetons.texteDoux, marginLeft: 'auto' }}>
                      {new Date(item.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: 14.5, color: jetons.texte, lineHeight: 1.6, marginBottom: 8 }}>
                    {item.description}
                  </div>

                  {/* Contenu signalé : le texte est recopié à l'envoi, car son
                      auteur peut l'avoir supprimé depuis. Sans cette copie, le
                      gérant n'aurait qu'un motif sans rien à examiner. */}
                  {item.cible_texte && (
                    <div style={{
                      background: jetons.dangerFond, border: '1px solid #fecaca',
                      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                    }}>
                      <Texte variante="doux" style={{ fontWeight: graisse.titre, color: jetons.danger, marginBottom: 4 }}>
                        {item.categorie === 'blocage' ? 'Auteur bloqué : ' : ''}
                        {{ statut: 'Statut', annonce: 'Annonce' }[item.cible_type] || 'Message'} de{' '}
                        {item.auteur?.avatar_emoji} {item.auteur?.pseudo || 'un vacancier parti'}
                        {item.auteur?.banni && ' · déjà banni'}
                      </Texte>
                      <div style={{ fontSize: 14, color: jetons.texte, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {item.cible_texte}
                      </div>
                      <Pile direction="ligne" espace="sm" retour style={{ marginTop: espace.sm }}>
                        {CIBLES[item.cible_type] && item.cible_id && (
                          retires.has(item.cible_id)
                            ? <Texte variante="micro" style={{ color: jetons.succes, fontWeight: graisse.fort }}>✓ Contenu supprimé</Texte>
                            : <Bouton variante="danger" taille="sm" onClick={() => supprimerContenu(item)} style={{ minHeight: 44 }}>
                                Supprimer {CIBLES[item.cible_type].nom}
                              </Bouton>
                        )}
                        {item.auteur_signale_id && !item.auteur?.banni && (
                          <Bouton variante="secondaire" taille="sm" onClick={() => bannirAuteur(item)}
                                  style={{ color: jetons.danger, borderColor: '#fecaca', minHeight: 44 }}>
                            Bannir {item.auteur?.pseudo || "l'auteur"}
                          </Bouton>
                        )}
                      </Pile>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: jetons.texteDoux }}>
                      {item.vacanciers?.avatar_emoji || '🙂'} {item.vacanciers?.pseudo || '—'}
                      {item.vacanciers?.emplacement && ` · empl. ${item.vacanciers.emplacement}`}
                    </span>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {STATUTS.filter(s => s.id !== item.statut).map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => changerStatut(item, s.id)}
                          style={{
                            padding: '6px 12px', minHeight: 44, borderRadius: 8, cursor: 'pointer',
                            fontSize: 12.5, fontWeight: 600,
                            background: s.bg, color: s.couleur, border: `1px solid ${s.couleur}33`,
                          }}
                        >
                          {s.action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Bloc>
            )
          })}
        </Pile>
      )}

      {/* Photo plein écran */}
      {photo && (
        <div
          onClick={() => setPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out',
          }}
        >
          <img src={photo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
        </div>
      )}
    </Pile>
  )
}
