import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Bloc, EnTete } from '../components/Bloc'
import { Texte, Pile, Squelette, Vide, couleur as jetons, espace, graisse, rayon } from '../../design'

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

const STATUTS = [
  { id: 'nouveau',  label: 'Nouveaux',  couleur: jetons.danger, bg: jetons.dangerFond },
  { id: 'en_cours', label: 'En cours',  couleur: '#d97706', bg: '#fffbeb' },
  { id: 'resolu',   label: 'Résolus',   couleur: '#16a34a', bg: '#f0fdf4' },
]

export default function Signalements({ camping }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre]   = useState('nouveau')
  const [photo, setPhoto]     = useState(null) // URL en plein écran

  async function charger() {
    const { data } = await supabase
      .from('signalements')
      .select('*, vacanciers(pseudo, avatar_emoji, emplacement), auteur:auteur_signale_id(pseudo, avatar_emoji, banni)')
      .eq('camping_id', camping.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
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
      alert("Impossible de changer le statut pour le moment.")
    }
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
              padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
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
                        {item.cible_type === 'statut' ? 'Statut' : 'Message'} de{' '}
                        {item.auteur?.avatar_emoji} {item.auteur?.pseudo || 'un vacancier parti'}
                        {item.auteur?.banni && ' · déjà banni'}
                      </Texte>
                      <div style={{ fontSize: 14, color: jetons.texte, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {item.cible_texte}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: jetons.texteDoux }}>
                      {item.vacanciers?.avatar_emoji || '🙂'} {item.vacanciers?.pseudo || '—'}
                      {item.vacanciers?.emplacement && ` · empl. ${item.vacanciers.emplacement}`}
                    </span>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                      {STATUTS.filter(s => s.id !== item.statut).map(s => (
                        <button
                          key={s.id}
                          onClick={() => changerStatut(item, s.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 12.5, fontWeight: 600,
                            background: s.bg, color: s.couleur, border: `1px solid ${s.couleur}33`,
                          }}
                        >
                          → {s.label}
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
