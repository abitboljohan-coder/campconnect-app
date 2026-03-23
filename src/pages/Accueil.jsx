import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const TREE_POS = [
  { x: '6%',  y: '18%', s: 26 }, { x: '14%', y: '62%', s: 20 },
  { x: '24%', y: '12%', s: 18 }, { x: '48%', y: '8%',  s: 22 },
  { x: '78%', y: '12%', s: 20 }, { x: '91%', y: '40%', s: 24 },
  { x: '93%', y: '72%', s: 18 }, { x: '62%', y: '82%', s: 20 },
  { x: '30%', y: '88%', s: 18 }, { x: '4%',  y: '82%', s: 22 },
]
const GRP_DOTS = [
  { x: '18%', y: '28%' }, { x: '58%', y: '48%' }, { x: '74%', y: '24%' },
  { x: '38%', y: '68%' }, { x: '84%', y: '60%' },
]
const ANIM_DOTS = [
  { x: '33%', y: '38%' }, { x: '54%', y: '72%' }, { x: '68%', y: '33%' },
]

export default function Accueil({ camping, vacancier }) {
  const [groupes, setGroupes]           = useState([])
  const [animations, setAnimations]     = useState([])
  const [vacancierCount, setVacancierCount] = useState(0)
  const [mesGroupes, setMesGroupes]     = useState([])
  const [loading, setLoading]           = useState(true)
  const navigate = useNavigate()
  const couleur = camping?.couleur_principale || '#639922'

  useEffect(() => {
    async function load() {
      const now = new Date().toISOString()
      const [
        { data: grps },
        { data: anims },
        { count: vCount },
        { data: membres },
      ] = await Promise.all([
        supabase.from('groupes').select('*').eq('camping_id', camping.id).eq('actif', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('animations').select('*').eq('camping_id', camping.id).eq('publiee', true).gte('debut', now).order('debut').limit(4),
        supabase.from('vacanciers').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id),
        supabase.from('membres_groupes').select('groupe_id').eq('vacancier_id', vacancier.id),
      ])
      setGroupes(grps || [])
      setAnimations(anims || [])
      setVacancierCount(vCount || 0)
      setMesGroupes((membres || []).map(m => m.groupe_id))
      setLoading(false)
    }
    load()
  }, [camping.id, vacancier.id])

  async function rejoindre(groupeId) {
    await supabase.from('membres_groupes').insert({ groupe_id: groupeId, vacancier_id: vacancier.id })
    setMesGroupes(prev => [...prev, groupeId])
    navigate(`/chat/${groupeId}`)
  }

  return (
    <div style={{ background: '#f5f2eb', minHeight: '100%', paddingBottom: 20 }}>

      {/* === CARTE DU CAMPING === */}
      <div style={{ margin: '16px 16px 0' }}>
        {camping?.plan_url
          ? <InteractiveMap
              camping={camping}
              vacancier={vacancier}
              couleur={couleur}
            />
          : <FakeMap
              groupes={groupes}
              animations={animations}
              vacancier={vacancier}
              vacancierCount={vacancierCount}
              couleur={couleur}
            />
        }
      </div>

      {/* === GROUPES ACTIFS === */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 700 }}>Groupes actifs maintenant</h2>
          <button onClick={() => navigate('/groupes')} style={{ fontSize: 13, color: couleur, fontWeight: 600 }}>
            Voir tout →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 74, borderRadius: 14, background: '#e8e4da', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : groupes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14, lineHeight: 1.8 }}>
            Aucun groupe actif pour l'instant.<br />Soyez le premier à en créer un !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groupes.map(g => (
              <GroupCard
                key={g.id}
                groupe={g}
                couleur={couleur}
                isMember={mesGroupes.includes(g.id)}
                onAction={mesGroupes.includes(g.id)
                  ? () => navigate(`/chat/${g.id}`)
                  : () => rejoindre(g.id)
                }
              />
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/groupes')}
          style={{
            width: '100%', marginTop: 14, padding: '14px',
            borderRadius: 14, background: couleur, color: '#fff',
            fontWeight: 700, fontSize: 15,
            boxShadow: `0 4px 14px ${couleur}55`,
          }}
        >
          + Créer un groupe
        </button>
      </div>
    </div>
  )
}

/* ─── Carte interactive avec plan réel ─── */
function InteractiveMap({ camping, vacancier, couleur }) {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const drag = useRef(null)
  const lastPinch = useRef(null)
  const [activePin, setActivePin] = useState(null)

  const pins = camping?.carte_config?.pins || []

  // Clamp translation so map stays mostly visible
  function clamp(t, scale) {
    const el = containerRef.current
    if (!el) return t
    const maxX = 0
    const minX = el.clientWidth  * (1 - scale)
    const maxY = 0
    const minY = el.clientHeight * (1 - scale)
    return {
      x: Math.min(maxX, Math.max(minX, t.x)),
      y: Math.min(maxY, Math.max(minY, t.y)),
    }
  }

  // Mouse
  function onMouseDown(e) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y }
  }
  function onMouseMove(e) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.sx
    const dy = e.clientY - drag.current.sy
    const clamped = clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }, transform.scale)
    setTransform(t => ({ ...t, ...clamped }))
  }
  function onMouseUp() { drag.current = null }

  // Touch
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      drag.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: transform.x, oy: transform.y }
      lastPinch.current = null
    } else if (e.touches.length === 2) {
      drag.current = null
      lastPinch.current = getTouchDist(e.touches)
    }
  }
  function onTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 1 && drag.current) {
      const dx = e.touches[0].clientX - drag.current.sx
      const dy = e.touches[0].clientY - drag.current.sy
      const clamped = clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }, transform.scale)
      setTransform(t => ({ ...t, ...clamped }))
    } else if (e.touches.length === 2 && lastPinch.current) {
      const dist = getTouchDist(e.touches)
      const factor = dist / lastPinch.current
      lastPinch.current = dist
      setTransform(t => {
        const newScale = Math.min(4, Math.max(1, t.scale * factor))
        return { ...t, scale: newScale }
      })
    }
  }
  function onTouchEnd() { drag.current = null; lastPinch.current = null }

  // Wheel zoom
  function onWheel(e) {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.88 : 1.12
    setTransform(t => {
      const newScale = Math.min(4, Math.max(1, t.scale * factor))
      return { ...t, scale: newScale }
    })
  }

  function resetZoom() { setTransform({ x: 0, y: 0, scale: 1 }); setActivePin(null) }

  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#0d1f0d' }}>
      {/* Carte */}
      <div
        ref={containerRef}
        style={{ height: 220, overflow: 'hidden', position: 'relative', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: '100%', height: '100%',
          transition: drag.current || lastPinch.current ? 'none' : 'transform 0.1s',
          position: 'relative',
        }}>
          <img
            src={camping.plan_url}
            alt="Plan du camping"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
            draggable={false}
          />

          {/* Pins */}
          {pins.map(pin => (
            <div
              key={pin.ref_id}
              style={{
                position: 'absolute',
                left: `${pin.x}%`, top: `${pin.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5, cursor: 'pointer',
              }}
              onClick={e => { e.stopPropagation(); setActivePin(activePin?.ref_id === pin.ref_id ? null : pin) }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: pin.color || '#639922',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                {pin.emoji}
              </div>
              {activePin?.ref_id === pin.ref_id && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.82)', color: '#fff',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
                }}>
                  {pin.label}
                </div>
              )}
            </div>
          ))}

          {/* Dot "Vous" */}
          <div style={{ position: 'absolute', left: '45%', top: '52%', transform: 'translate(-50%,-50%)', zIndex: 6 }}>
            <div style={{
              width: 32, height: 32, background: couleur, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              boxShadow: `0 0 0 4px ${couleur}40, 0 2px 10px rgba(0,0,0,0.4)`,
            }}>
              {vacancier?.avatar_emoji || '🏕️'}
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div style={{
        position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20,
      }}>
        <MapBtn onClick={() => setTransform(t => { const s = Math.min(4, t.scale * 1.3); return { ...t, scale: s } })}>＋</MapBtn>
        <MapBtn onClick={() => setTransform(t => { const s = Math.max(1, t.scale * 0.77); const clamped = clamp(t, s); return { ...t, scale: s, ...clamped } })}>－</MapBtn>
        {transform.scale > 1 && <MapBtn onClick={resetZoom} style={{ fontSize: 12 }}>↺</MapBtn>}
      </div>

      {/* Badge vacanciers */}
      <div style={{
        position: 'absolute', top: 10, left: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        borderRadius: 20, padding: '4px 10px',
        color: '#C0DD97', fontSize: 11, fontWeight: 600,
      }}>
        {camping?.nom}
      </div>

      {/* Légende */}
      <div style={{
        background: '#0d1f0d', padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {[['#f472b6', 'Animations'], ['#fb923c', 'Groupes'], ['#60a5fa', 'Lieux'], [couleur, 'Vous']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{l}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Pincez pour zoomer</span>
      </div>
    </div>
  )
}

function MapBtn({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(0,0,0,0.6)', color: '#fff',
        fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)',
        ...style,
      }}
    >{children}</button>
  )
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

/* ─── Fausse carte (fallback sans plan uploadé) ─── */
function FakeMap({ groupes, animations, vacancier, vacancierCount, couleur }) {
  return (
    <div style={{
      borderRadius: 18, background: '#0d1f0d', position: 'relative', height: 190, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(192,221,151,0.15)', border: '1px solid rgba(192,221,151,0.3)',
        borderRadius: 20, padding: '4px 10px', color: '#C0DD97', fontSize: 12, fontWeight: 600,
      }}>
        {vacancierCount} vacanciers
      </div>
      {TREE_POS.map((t, i) => (
        <div key={i} style={{ position: 'absolute', left: t.x, top: t.y, fontSize: t.s, opacity: 0.55, transform: 'translate(-50%, -50%)', pointerEvents: 'none', userSelect: 'none' }}>🌲</div>
      ))}
      {groupes.slice(0, 5).map((g, i) => (
        <div key={g.id} style={{ position: 'absolute', left: GRP_DOTS[i]?.x, top: GRP_DOTS[i]?.y, transform: 'translate(-50%,-50%)', width: 30, height: 30, background: 'rgba(251,146,60,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 5 }}>
          {g.emoji || '👥'}
        </div>
      ))}
      {animations.slice(0, 3).map((a, i) => (
        <div key={a.id} style={{ position: 'absolute', left: ANIM_DOTS[i]?.x, top: ANIM_DOTS[i]?.y, transform: 'translate(-50%,-50%)', width: 24, height: 24, background: 'rgba(244,114,182,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 5 }}>
          {a.emoji || '🎉'}
        </div>
      ))}
      <div style={{ position: 'absolute', left: '45%', top: '52%', transform: 'translate(-50%,-50%)', zIndex: 6 }}>
        <div style={{ width: 36, height: 36, background: couleur, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 0 0 4px ${couleur}35, 0 2px 10px rgba(0,0,0,0.4)` }}>
          {vacancier?.avatar_emoji || '🏕️'}
        </div>
        <div style={{ background: couleur, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, marginTop: 3, textAlign: 'center' }}>Vous</div>
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 12, zIndex: 10 }}>
        {[['#fb923c','Groupes'],['#f472b6','Animations'],[couleur,'Vous']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupCard({ groupe, couleur, isMember, onAction }) {
  const heureStr = groupe.heure
    ? new Date(groupe.heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null
  const meta = [
    groupe.lieu && `📍 ${groupe.lieu}`,
    heureStr && `🕐 ${heureStr}`,
    groupe.max_membres && `${groupe.max_membres} max`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      animation: 'fadeIn 0.25s ease',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: isMember ? `${couleur}20` : '#f5f2eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {groupe.emoji || '👥'}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupe.titre}</div>
        {meta && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{meta}</div>}
      </div>
      <button
        onClick={onAction}
        style={{
          background: isMember ? couleur : 'transparent',
          color: isMember ? '#fff' : couleur,
          padding: '7px 14px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, flexShrink: 0,
          border: `1.5px solid ${isMember ? 'transparent' : couleur}`,
          transition: 'all 0.15s',
        }}
      >
        {isMember ? 'Ouvert' : 'Rejoindre'}
      </button>
    </div>
  )
}
