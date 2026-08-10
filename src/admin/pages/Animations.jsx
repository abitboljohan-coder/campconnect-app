import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import AnimationForm from '../components/AnimationForm'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, Badge, Squelette, Vide, couleur as jetons, espace, graisse, rayon, texte as tailles } from '../../design'

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
    <Pile espace="lg">
      <Pile direction="ligne" espace="md" justifier="space-between" aligner="flex-start">
        <EnTete
          titre="Animations"
          sous={`${animations.length} animation${animations.length !== 1 ? 's' : ''} au total`}
        />
        <Bouton onClick={() => { setEditAnim(null); setShowForm(true) }} style={{ flexShrink: 0 }}>
          + Nouvelle animation
        </Bouton>
      </Pile>

      {loading ? (
        <Squelette lignes={3} hauteur={90} libelle="Chargement…" />
      ) : animations.length === 0 ? (
        <Bloc style={{ border: `2px dashed ${jetons.bordure}` }}>
          <Vide
            emoji="📅"
            titre="Aucune animation pour le moment"
            texte="Cours de natation, tournoi de pétanque, soirée barbecue… créez votre première animation !"
            action={
              <Bouton onClick={() => { setEditAnim(null); setShowForm(true) }}>
                + Créer ma première animation
              </Bouton>
            }
          />
        </Bloc>
      ) : (
        <Pile espace="sm">
          {animations.map(anim => {
            const nb = counts[anim.id] || 0
            const debut = anim.debut ? new Date(anim.debut) : null
            const complet = anim.places_max && nb >= anim.places_max
            return (
              <Bloc key={anim.id} padding="16px 20px" style={{
                borderLeft: `4px solid ${anim.publiee ? jetons.marque : jetons.bordure}`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span aria-hidden="true" style={{
                  width: 44, height: 44, borderRadius: rayon.md,
                  background: jetons.fond, fontSize: 22, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {anim.emoji || '🎉'}
                </span>

                {/* Infos */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Texte variante="sousTitre" as="span" style={{ fontSize: tailles.moyen }}>{anim.titre}</Texte>
                    <Badge ton={anim.publiee ? 'succes' : 'neutre'}>
                      {anim.publiee ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {complet && <Badge ton="danger">Complet</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: jetons.texteDoux, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {debut && <span>📅 {debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    {anim.lieu && <span>📍 {anim.lieu}</span>}
                    {/* Une ligne cliquable qui n'etait pas un bouton : rien
                        n'indiquait qu'elle ouvrait la liste, et le clavier ne
                        pouvait pas l'atteindre. */}
                    <button
                      onClick={() => voirInscrits(anim)}
                      style={{
                        color: jetons.marqueTexte, fontWeight: graisse.normal, cursor: 'pointer',
                        background: 'none', border: 'none', padding: 0, font: 'inherit',
                        fontSize: tailles.petit, textDecoration: 'underline',
                      }}
                    >
                      👥 {nb}{anim.places_max ? `/${anim.places_max}` : ''} inscrits
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <Pile direction="ligne" espace="sm" retour style={{ flexShrink: 0 }}>
                  <Bouton
                    variante="secondaire" taille="sm"
                    onClick={() => togglePublie(anim)}
                    style={{
                      borderRadius: rayon.sm, border: 'none',
                      background: anim.publiee ? jetons.alerteFond : '#f0fdf4',
                      color: anim.publiee ? jetons.alerte : jetons.succes,
                    }}
                  >
                    {anim.publiee ? 'Dépublier' : 'Publier'}
                  </Bouton>
                  <Bouton variante="secondaire" taille="sm"
                          onClick={() => { setEditAnim(anim); setShowForm(true) }}
                          style={{ borderRadius: rayon.sm, border: 'none', background: jetons.surfaceDouce }}>
                    Modifier
                  </Bouton>
                  <Bouton variante="danger" taille="sm" onClick={() => supprimer(anim.id)}
                          style={{ borderRadius: rayon.sm }}>
                    Supprimer
                  </Bouton>
                </Pile>
              </Bloc>
            )
          })}
        </Pile>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditAnim(null) }}>
          <Texte variante="section" as="h2" style={{ marginBottom: espace.xl }}>
            {editAnim ? 'Modifier l’animation' : 'Nouvelle animation'}
          </Texte>
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
          <Pile espace="xs" style={{ marginBottom: espace.xl }}>
            <Texte variante="section" as="h2">
              {inscritsModal.anim.emoji} {inscritsModal.anim.titre}
            </Texte>
            <Texte variante="corps">
              {inscritsModal.vacanciers.length} inscrit{inscritsModal.vacanciers.length !== 1 ? 's' : ''}
            </Texte>
          </Pile>
          {inscritsModal.vacanciers.length === 0 ? (
            <Vide emoji="👥" texte="Aucun inscrit." />
          ) : (
            <Pile espace="sm">
              {inscritsModal.vacanciers.map((v, i) => (
                <Pile key={i} direction="ligne" espace="md" aligner="center"
                      style={{ padding: '10px 0', borderBottom: `1px solid ${jetons.fond}` }}>
                  <span aria-hidden="true" style={{
                    width: 36, height: 36, borderRadius: rayon.rond,
                    background: 'var(--cc-accent-voile)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {v?.pseudo?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <Texte variante="corps" style={{ fontWeight: graisse.fort, color: jetons.texte }}>{v?.pseudo}</Texte>
                    <Texte variante="doux">
                      {[v?.emplacement && `Empl. ${v.emplacement}`, v?.tranche_age, v?.avec].filter(Boolean).join(' · ')}
                    </Texte>
                  </div>
                </Pile>
              ))}
            </Pile>
          )}
          <Bouton variante="secondaire" taille="lg" pleineLargeur
                  onClick={() => setInscritsModal(null)} style={{ marginTop: espace.xl }}>
            Fermer
          </Bouton>
        </Modal>
      )}
    </Pile>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: jetons.surface, borderRadius: `${rayon.xl}px ${rayon.xl}px 0 0`,
          padding: '24px 22px 40px', width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div aria-hidden="true" style={{
          width: 40, height: 4, background: jetons.bordure,
          borderRadius: 2, margin: `0 auto ${espace.xl}px`,
        }} />
        {children}
      </div>
    </div>
  )
}
