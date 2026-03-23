import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import AnimationForm from '../components/AnimationForm'

export default function Animations({ camping }) {
  const [animations, setAnimations] = useState([])
  const [counts, setCounts]         = useState({}) // animId -> nb inscrits
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editAnim, setEditAnim]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [inscritsModal, setInscritsModal] = useState(null) // { anim, vacanciers }

  async function load() {
    const { data: anims } = await supabase
      .from('animations')
      .select('*')
      .eq('camping_id', camping.id)
      .order('debut', { ascending: false })

    const animsList = anims || []
    setAnimations(animsList)

    if (animsList.length > 0) {
      const { data: allInscs } = await supabase
        .from('inscriptions')
        .select('animation_id')
        .in('animation_id', animsList.map(a => a.id))
      const c = {}
      for (const ins of (allInscs || [])) {
        c[ins.animation_id] = (c[ins.animation_id] || 0) + 1
      }
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id])

  async function togglePublie(anim) {
    const { data } = await supabase
      .from('animations')
      .update({ publiee: !anim.publiee })
      .eq('id', anim.id)
      .select().single()
    if (data) setAnimations(prev => prev.map(a => a.id === data.id ? data : a))
  }

  async function supprimer(animId) {
    if (!confirm('Supprimer cette animation ? Les inscriptions seront aussi supprimées.')) return
    await supabase.from('inscriptions').delete().eq('animation_id', animId)
    await supabase.from('animations').delete().eq('id', animId)
    setAnimations(prev => prev.filter(a => a.id !== animId))
    setCounts(prev => { const c = { ...prev }; delete c[animId]; return c })
  }

  async function sauvegarder(formData) {
    setSaving(true)
    if (editAnim) {
      const { data } = await supabase
        .from('animations')
        .update(formData)
        .eq('id', editAnim.id)
        .select().single()
      if (data) setAnimations(prev => prev.map(a => a.id === data.id ? data : a))
    } else {
      const { data } = await supabase
        .from('animations')
        .insert({ ...formData, camping_id: camping.id })
        .select().single()
      if (data) setAnimations(prev => [data, ...prev])
    }
    setShowForm(false)
    setEditAnim(null)
    setSaving(false)
  }

  async function voirInscrits(anim) {
    const { data } = await supabase
      .from('inscriptions')
      .select('*, vacanciers(pseudo, emplacement, tranche_age, avec)')
      .eq('animation_id', anim.id)
      .order('created_at')
    setInscritsModal({ anim, vacanciers: (data || []).map(i => i.vacanciers) })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Animations</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{animations.length} animation{animations.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => { setEditAnim(null); setShowForm(true) }}
          style={{
            padding: '10px 18px', borderRadius: 10,
            background: '#639922', color: '#fff',
            fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 12px rgba(99,153,34,0.35)',
          }}
        >
          + Nouvelle animation
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 90, borderRadius: 14, background: '#e8e4da' }} />)}
        </div>
      ) : animations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          Aucune animation. Créez-en une !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {animations.map(anim => {
            const nb = counts[anim.id] || 0
            const debut = anim.debut ? new Date(anim.debut) : null
            const complet = anim.places_max && nb >= anim.places_max
            return (
              <div key={anim.id} style={{
                background: '#fff', borderRadius: 14, padding: '16px 20px',
                border: '1px solid rgba(0,0,0,0.07)',
                borderLeft: `4px solid ${anim.publiee ? '#639922' : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Emoji */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#f5f2eb', fontSize: 22, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {anim.emoji || '🎉'}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{anim.titre}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: anim.publiee ? '#dcfce7' : '#f3f4f6',
                      color: anim.publiee ? '#166534' : '#6b7280',
                    }}>
                      {anim.publiee ? 'Publié' : 'Brouillon'}
                    </span>
                    {complet && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>Complet</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {debut && <span>📅 {debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    {anim.lieu && <span>📍 {anim.lieu}</span>}
                    <span
                      style={{ color: '#639922', fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => voirInscrits(anim)}
                    >
                      👥 {nb}{anim.places_max ? `/${anim.places_max}` : ''} inscrits
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => togglePublie(anim)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: anim.publiee ? '#fef3c7' : '#dcfce7',
                      color: anim.publiee ? '#92400e' : '#166534',
                      border: 'none',
                    }}
                  >
                    {anim.publiee ? 'Dépublier' : 'Publier'}
                  </button>
                  <button
                    onClick={() => { setEditAnim(anim); setShowForm(true) }}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => supprimer(anim.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditAnim(null) }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
            {editAnim ? 'Modifier l\'animation' : 'Nouvelle animation'}
          </h2>
          <AnimationForm
            initial={editAnim}
            onSave={sauvegarder}
            onCancel={() => { setShowForm(false); setEditAnim(null) }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modal inscrits */}
      {inscritsModal && (
        <Modal onClose={() => setInscritsModal(null)}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            {inscritsModal.anim.emoji} {inscritsModal.anim.titre}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
            {inscritsModal.vacanciers.length} inscrit{inscritsModal.vacanciers.length !== 1 ? 's' : ''}
          </p>
          {inscritsModal.vacanciers.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aucun inscrit.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inscritsModal.vacanciers.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f5f2eb',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#63992218', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {v?.pseudo?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{v?.pseudo}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {[v?.emplacement && `Empl. ${v.emplacement}`, v?.tranche_age, v?.avec].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setInscritsModal(null)}
            style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 10, background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
          >
            Fermer
          </button>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '22px 22px 0 0',
          padding: '24px 22px 40px', width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 20px' }} />
        {children}
      </div>
    </div>
  )
}
