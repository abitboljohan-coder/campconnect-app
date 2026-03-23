import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const SLOT_LABELS = {
  matin:     'Ce matin',
  apresmidi: 'Cet après-midi',
  soir:      'Ce soir',
  nuit:      'Cette nuit',
}

function getSlot(debutStr) {
  const h = new Date(debutStr).getHours()
  if (h >= 6  && h < 12) return 'matin'
  if (h >= 12 && h < 18) return 'apresmidi'
  if (h >= 18)            return 'soir'
  return 'nuit'
}

function getDayLabel(debutStr) {
  const d = new Date(debutStr)
  const today     = new Date()
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString())    return null // pas de préfixe pour aujourd'hui
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getSectionKey(anim) {
  const dayLabel  = getDayLabel(anim.debut)
  const slotLabel = SLOT_LABELS[getSlot(anim.debut)]
  return dayLabel ? `${dayLabel} — ${slotLabel}` : slotLabel
}

const TAG_COLORS = {
  sport:    { bg: '#dcfce7', color: '#166534' },
  famille:  { bg: '#fef3c7', color: '#92400e' },
  soiree:   { bg: '#fce7f3', color: '#9d174d' },
  default:  { bg: '#f3f4f6', color: '#374151' },
}

function getTag(anim) {
  const txt = `${anim.titre} ${anim.description || ''} ${anim.emoji || ''}`.toLowerCase()
  if (/sport|foot|tennis|swim|natation|vélo|velo|yoga|petan|march|rando/.test(txt)) return { label: 'Sport',   ...TAG_COLORS.sport }
  if (/famille|enfant|kid|parent|junior/.test(txt))                                 return { label: 'Famille', ...TAG_COLORS.famille }
  if (/soir|soiree|soirée|karaok|disco|fest|spectacl/.test(txt))                    return { label: 'Soirée',  ...TAG_COLORS.soiree }
  return { label: anim.emoji || '🎉', ...TAG_COLORS.default }
}

export default function Agenda({ camping, vacancier }) {
  const [animations, setAnimations]     = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [counts, setCounts]             = useState({}) // animId -> nb inscrits
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')
  const couleur = camping?.couleur_principale || '#639922'

  async function load() {
    const [{ data: anims }, { data: inscs }] = await Promise.all([
      supabase.from('animations').select('*').eq('camping_id', camping.id).eq('publiee', true).order('debut'),
      supabase.from('inscriptions').select('animation_id').eq('vacancier_id', vacancier.id),
    ])
    const animsList = anims || []
    setAnimations(animsList)
    setInscriptions((inscs || []).map(i => i.animation_id))

    // Compter les inscrits par animation
    if (animsList.length > 0) {
      const { data: allInscs } = await supabase
        .from('inscriptions').select('animation_id').in('animation_id', animsList.map(a => a.id))
      const c = {}
      for (const ins of (allInscs || [])) {
        c[ins.animation_id] = (c[ins.animation_id] || 0) + 1
      }
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id, vacancier.id])

  async function toggleInscription(anim) {
    const inscrit = inscriptions.includes(anim.id)
    const complet = anim.places_max && (counts[anim.id] || 0) >= anim.places_max

    if (!inscrit && complet) return // complet, ne rien faire

    if (inscrit) {
      await supabase.from('inscriptions').delete().eq('animation_id', anim.id).eq('vacancier_id', vacancier.id)
      setInscriptions(prev => prev.filter(id => id !== anim.id))
      setCounts(prev => ({ ...prev, [anim.id]: Math.max(0, (prev[anim.id] || 1) - 1) }))
    } else {
      await supabase.from('inscriptions').insert({ animation_id: anim.id, vacancier_id: vacancier.id })
      setInscriptions(prev => [...prev, anim.id])
      setCounts(prev => ({ ...prev, [anim.id]: (prev[anim.id] || 0) + 1 }))
    }
  }

  const displayed = filter === 'mine'
    ? animations.filter(a => inscriptions.includes(a.id))
    : animations

  // Grouper par section (slot de temps)
  const sections = {}
  const sectionOrder = []
  for (const anim of displayed) {
    const key = getSectionKey(anim)
    if (!sections[key]) { sections[key] = []; sectionOrder.push(key) }
    sections[key].push(anim)
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, color: '#1a1a1a', fontWeight: 700 }}>Agenda</h1>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' }}>{today}</div>
        </div>
        {/* Toggle filtre */}
        <div style={{ display: 'flex', background: '#e8e4da', borderRadius: 20, padding: 3, gap: 2 }}>
          {[['all', 'Tout'], ['mine', 'Mes inscrip.']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '5px 12px', borderRadius: 18, fontSize: 13, fontWeight: 500,
                background: filter === val ? '#fff' : 'transparent',
                color: filter === val ? '#1a1a1a' : '#6b7280',
                boxShadow: filter === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 88, borderRadius: 14, background: '#e8e4da', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          {filter === 'mine' ? "Vous n'êtes inscrit à aucune animation." : "Aucune animation programmée."}
        </div>
      ) : (
        sectionOrder.map(sectionKey => (
          <div key={sectionKey} style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: 1.2,
              marginBottom: 10, textTransform: 'uppercase',
            }}>
              {sectionKey}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sections[sectionKey].map(anim => (
                <AnimCard
                  key={anim.id}
                  anim={anim}
                  couleur={couleur}
                  inscrit={inscriptions.includes(anim.id)}
                  nbInscrits={counts[anim.id] || 0}
                  onToggle={() => toggleInscription(anim)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AnimCard({ anim, couleur, inscrit, nbInscrits, onToggle }) {
  const debut = anim.debut ? new Date(anim.debut) : null
  const tag = getTag(anim)
  const complet = anim.places_max && nbInscrits >= anim.places_max && !inscrit

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      borderLeft: inscrit ? `4px solid ${couleur}` : '4px solid #e5e7eb',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          {/* Heure + tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {debut && (
              <span style={{ fontSize: 13, fontWeight: 700, color: couleur }}>
                {debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: tag.bg, color: tag.color,
            }}>
              {tag.label}
            </span>
          </div>

          <div style={{ fontWeight: 600, fontSize: 16, color: '#1a1a1a', lineHeight: 1.3 }}>
            {anim.emoji && <span style={{ marginRight: 6 }}>{anim.emoji}</span>}{anim.titre}
          </div>

          {anim.lieu && (
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>📍 {anim.lieu}</div>
          )}

          {anim.places_max && (
            <div style={{ fontSize: 12, color: complet ? '#ef4444' : '#9ca3af', marginTop: 4 }}>
              {nbInscrits}/{anim.places_max} places
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          disabled={complet}
          style={{
            background: complet ? '#e5e7eb' : inscrit ? `${couleur}20` : couleur,
            color: complet ? '#9ca3af' : inscrit ? couleur : '#fff',
            padding: '9px 14px', borderRadius: 20,
            fontSize: 13, fontWeight: 600, flexShrink: 0,
            border: inscrit ? `1.5px solid ${couleur}` : 'none',
            transition: 'all 0.15s',
            cursor: complet ? 'not-allowed' : 'pointer',
          }}
        >
          {complet ? 'Complet' : inscrit ? '✓ Inscrit' : "S'inscrire"}
        </button>
      </div>

      {anim.description && (
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 1.5, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
          {anim.description}
        </div>
      )}
    </div>
  )
}
