import { useEffect, useState } from 'react'
import { toast } from '../toast'
import { supabase } from '../supabase'
import { t, useLangue, locale } from '../i18n'
import {
  Bouton, Carte, Texte, Pile, Badge, Squelette, Vide,
  couleur, espace, graisse, rayon, texte as tailles,
} from '../design'

const slotLabel = (k) => t(`agenda.slot_${k}`)

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
  if (d.toDateString() === tomorrow.toDateString()) return t('agenda.demain')
  return d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })
}

function getSectionKey(anim) {
  const dayLabel  = getDayLabel(anim.debut)
  const slot = slotLabel(getSlot(anim.debut))
  return dayLabel ? `${dayLabel} — ${slot}` : slot
}

// Le ton du badge vient du système ; seul le classement est propre à l'agenda.
function getTag(anim) {
  const txt = `${anim.titre} ${anim.description || ''} ${anim.emoji || ''}`.toLowerCase()
  if (/sport|foot|tennis|swim|natation|vélo|velo|yoga|petan|march|rando/.test(txt)) return { label: 'Sport',   ton: 'succes' }
  if (/famille|enfant|kid|parent|junior/.test(txt))                                 return { label: 'Famille', ton: 'alerte' }
  if (/soir|soiree|soirée|karaok|disco|fest|spectacl/.test(txt))                    return { label: 'Soirée',  ton: 'accent' }
  return { label: anim.emoji || '🎉', ton: 'neutre' }
}

export default function Agenda({ camping, vacancier }) {
  useLangue()
  const [animations, setAnimations]     = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [counts, setCounts]             = useState({}) // animId -> nb inscrits
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')

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
      // MAJ optimiste puis rollback si échec
      setInscriptions(prev => prev.filter(id => id !== anim.id))
      setCounts(prev => ({ ...prev, [anim.id]: Math.max(0, (prev[anim.id] || 1) - 1) }))
      const { error } = await supabase.from('inscriptions').delete().eq('animation_id', anim.id).eq('vacancier_id', vacancier.id)
      if (error) {
        console.error('Désinscription échouée :', error)
        setInscriptions(prev => [...prev, anim.id])
        setCounts(prev => ({ ...prev, [anim.id]: (prev[anim.id] || 0) + 1 }))
        toast(t('agenda.err_desinscr'), 'erreur')
      }
    } else {
      setInscriptions(prev => [...prev, anim.id])
      setCounts(prev => ({ ...prev, [anim.id]: (prev[anim.id] || 0) + 1 }))
      const { error } = await supabase.from('inscriptions').insert({ animation_id: anim.id, vacancier_id: vacancier.id })
      // Une action réussie doit se voir. Sans confirmation, l'utilisateur
      // reclique par doute — le réflexe que toute app sociale évite.
      if (!error || error.code === '23505') toast(`${anim.emoji || '🎉'} Inscrit à « ${anim.titre} »`, 'succes')
      if (error && error.code !== '23505') {
        console.error('Inscription échouée :', error)
        setInscriptions(prev => prev.filter(id => id !== anim.id))
        setCounts(prev => ({ ...prev, [anim.id]: Math.max(0, (prev[anim.id] || 1) - 1) }))
        toast(t('agenda.err_inscr'), 'erreur')
      }
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

  const today = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Pile espace="xl" style={{ padding: `${espace.xl}px ${espace.lg}px`, maxWidth: 600, margin: '0 auto' }}>

      <Pile direction="ligne" justifier="space-between" aligner="flex-end">
        <Pile espace="xs">
          <Texte variante="section" as="h1">{t('agenda.titre')}</Texte>
          <Texte variante="doux" style={{ textTransform: 'capitalize' }}>{today}</Texte>
        </Pile>

        {/* Bascule tout / mes inscriptions */}
        <div role="group" aria-label={t('agenda.titre')}
             style={{ display: 'flex', background: couleur.bordure, borderRadius: rayon.rond, padding: 3, gap: 2 }}>
          {[['all', t('agenda.tout')], ['mine', t('agenda.mes_inscr')]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              aria-pressed={filter === val}
              style={{
                padding: `5px ${espace.md}px`, borderRadius: rayon.rond,
                fontSize: tailles.petit, fontWeight: graisse.fort, cursor: 'pointer',
                background: filter === val ? couleur.surface : 'transparent',
                color: filter === val ? couleur.texte : couleur.texteDoux,
                boxShadow: filter === val ? ombreOnglet : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Pile>

      {loading ? (
        <Squelette lignes={4} hauteur={88} libelle={t('commun.chargement')} />
      ) : displayed.length === 0 ? (
        <Vide
          emoji="📅"
          texte={filter === 'mine' ? t('agenda.aucune_mine') : t('agenda.aucune')}
          action={filter === 'mine'
            ? <Bouton variante="secondaire" onClick={() => setFilter('all')}>{t('agenda.tout')}</Bouton>
            : null}
        />
      ) : (
        sectionOrder.map(sectionKey => (
          <Pile key={sectionKey} espace="sm">
            <Texte variante="libelle" as="h2">{sectionKey}</Texte>
            <Pile espace="sm">
              {sections[sectionKey].map(anim => (
                <AnimCard
                  key={anim.id}
                  anim={anim}
                  inscrit={inscriptions.includes(anim.id)}
                  nbInscrits={counts[anim.id] || 0}
                  onToggle={() => toggleInscription(anim)}
                />
              ))}
            </Pile>
          </Pile>
        ))
      )}
    </Pile>
  )
}

const ombreOnglet = '0 1px 3px rgba(26, 26, 26, 0.1)'

function AnimCard({ anim, inscrit, nbInscrits, onToggle }) {
  const debut = anim.debut ? new Date(anim.debut) : null
  const tag = getTag(anim)
  const complet = anim.places_max && nbInscrits >= anim.places_max && !inscrit

  return (
    <Carte
      hauteur="posee"
      padding={`14px ${espace.lg}px`}
      style={{
        // L'inscription se lit au premier coup d'œil dans une liste, sans avoir
        // à parcourir chaque bouton : le liseré tient ce rôle.
        borderLeft: `4px solid ${inscrit ? 'var(--cc-accent)' : couleur.bordure}`,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <Pile direction="ligne" espace="md" justifier="space-between" aligner="flex-start">
        <Pile espace="xs" style={{ flex: 1 }}>
          <Pile direction="ligne" espace="sm" aligner="center">
            {debut && (
              <Texte variante="doux" as="span" style={{ fontWeight: graisse.titre, color: 'var(--cc-accent)' }}>
                {debut.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}
              </Texte>
            )}
            <Badge ton={tag.ton}>{tag.label}</Badge>
          </Pile>

          <Texte variante="sousTitre" style={{ fontSize: tailles.grand }}>
            {anim.emoji && <span aria-hidden="true" style={{ marginRight: 6 }}>{anim.emoji}</span>}{anim.titre}
          </Texte>

          {anim.lieu && <Texte variante="doux">📍 {anim.lieu}</Texte>}

          {/* Comparaison explicite : `places_max && …` affichait littéralement
              « 0 » sous les animations sans limite de places — React rend le
              zéro d'un ET logique. */}
          {anim.places_max > 0 && (
            <Texte variante="micro" style={complet ? { color: couleur.danger, fontWeight: graisse.fort } : undefined}>
              {nbInscrits}/{anim.places_max} {t('agenda.places_mot')}
            </Texte>
          )}
        </Pile>

        <Bouton
          variante={complet ? 'secondaire' : inscrit ? 'secondaire' : 'primaire'}
          taille="sm"
          onClick={onToggle}
          disabled={complet}
          style={{
            flexShrink: 0,
            borderRadius: rayon.rond,
            ...(inscrit && !complet
              ? { background: 'var(--cc-accent-voile)', color: 'var(--cc-accent)', border: '1.5px solid var(--cc-accent)' }
              : null),
          }}
        >
          {complet ? t('commun.complet') : inscrit ? t('agenda.inscrit') : t('agenda.inscrire')}
        </Bouton>
      </Pile>

      {anim.description && (
        <Texte variante="doux" style={{
          marginTop: espace.sm, paddingTop: espace.sm,
          borderTop: `1px solid ${couleur.surfaceDouce}`, lineHeight: 1.5,
        }}>
          {anim.description}
        </Texte>
      )}
    </Carte>
  )
}
