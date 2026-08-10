import { useEffect, useState } from 'react'
import { toast } from '../toast'
import Sheet from '../components/Sheet'
import CarteGroupe from '../components/CarteGroupe'
import { useNavigate } from 'react-router-dom'
import { supabase, presentFilter } from '../supabase'
import { t, useLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, Puce, Squelette, Vide, Fab,
  couleur, espace, graisse, rayon,
} from '../design'

const EMOJIS = ['🏐', '🔥', '🚶', '🎮', '🎤', '🏊', '🚴', '🎯', '♟️', '🧘', '🎸', '🍕']

const TEMPLATES = [
  { emoji: '🎳', titre: 'Pétanque',        lieu: 'Terrain de pétanque' },
  { emoji: '🍻', titre: 'Apéro ce soir',   lieu: '' },
  { emoji: '🥾', titre: 'Rando demain matin', lieu: 'Accueil' },
  { emoji: '🏐', titre: 'Volley',          lieu: 'Terrain de sport' },
  { emoji: '🏊', titre: 'Piscine',         lieu: 'Piscine' },
  { emoji: '🍖', titre: 'BBQ',             lieu: '' },
  { emoji: '🎮', titre: 'Jeux / soirée',   lieu: '' },
]

export default function Groupes({ camping, vacancier }) {
  useLangue()
  const [groupes, setGroupes]     = useState([])
  const [membresMap, setMembresMap] = useState({})
  const [mesGroupes, setMesGroupes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titre: '', emoji: '🏐', lieu: '', heure: '', max_membres: '' })
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const navigate = useNavigate()

  async function load() {
    const [{ data: grps }, { data: membres }] = await Promise.all([
      supabase.from('groupes').select('*').eq('camping_id', camping.id).eq('actif', true).order('created_at', { ascending: false }),
      supabase.from('membres_groupes').select('groupe_id').eq('vacancier_id', vacancier.id),
    ])
    setGroupes(grps || [])
    setMesGroupes((membres || []).map(m => m.groupe_id))
    setLoading(false)

    // Avatars des membres par groupe
    const ids = (grps || []).map(g => g.id)
    if (ids.length) {
      const { data: allMembres } = await supabase
        .from('membres_groupes').select('groupe_id, vacanciers!inner(avatar_emoji)').in('groupe_id', ids)
        .or(presentFilter(), { foreignTable: 'vacanciers' })
      const map = {}
      for (const m of allMembres || []) {
        if (!map[m.groupe_id]) map[m.groupe_id] = []
        map[m.groupe_id].push(m.vacanciers?.avatar_emoji || '🙂')
      }
      setMembresMap(map)
    }
  }

  useEffect(() => { load() }, [camping.id, vacancier.id])

  async function rejoindre(groupeId) {
    const { error } = await supabase.from('membres_groupes').insert({ groupe_id: groupeId, vacancier_id: vacancier.id })
    if (error && error.code !== '23505') { // 23505 = déjà membre, on laisse passer
      console.error('Rejoindre groupe échoué :', error)
      toast(t('groupes.err_rejoindre'), 'erreur')
      return
    }
    setMesGroupes(prev => prev.includes(groupeId) ? prev : [...prev, groupeId])
    navigate(`/chat/${groupeId}`)
  }

  async function creerGroupe() {
    if (!form.titre.trim()) return
    setSaving(true)
    setErreur('')

    // Construire le timestamp heure
    let heure = null
    if (form.heure) {
      const today = new Date()
      const [h, m] = form.heure.split(':')
      today.setHours(parseInt(h), parseInt(m), 0, 0)
      heure = today.toISOString()
    }

    const { data, error } = await supabase.from('groupes').insert({
      camping_id: camping.id,
      createur_id: vacancier.id,
      titre: form.titre.trim(),
      emoji: form.emoji,
      lieu: form.lieu.trim() || null,
      heure,
      max_membres: form.max_membres ? parseInt(form.max_membres) : null,
      actif: true,
    }).select().single()

    if (error || !data) {
      console.error('Création groupe échouée :', error)
      setErreur(t('groupes.err_creation'))
      setSaving(false)
      return
    }

    await supabase.from('membres_groupes').insert({ groupe_id: data.id, vacancier_id: vacancier.id })
    setShowModal(false)
    setForm({ titre: '', emoji: '🏐', lieu: '', heure: '', max_membres: '' })
    setSaving(false)
    navigate(`/chat/${data.id}`)
  }

  const mesGrps    = groupes.filter(g => mesGroupes.includes(g.id))
  const autresGrps = groupes.filter(g => !mesGroupes.includes(g.id))

  return (
    <Pile espace="xl" style={{ padding: `${espace.xl}px ${espace.lg}px`, maxWidth: 600, margin: '0 auto' }}>

      {loading ? (
        <Squelette lignes={4} hauteur={76} libelle={t('commun.chargement')} />
      ) : (
        <>
          {mesGrps.length > 0 && (
            <Section title={t('groupes.mes_groupes')}>
              {mesGrps.map(g => (
                <CarteGroupe key={g.id} groupe={g} membre={true}
                  avatars={membresMap[g.id]} onAction={() => navigate(`/chat/${g.id}`)} />
              ))}
            </Section>
          )}

          <Section title={mesGrps.length > 0 ? t('groupes.autres') : t('groupes.tous')}>
            {autresGrps.length === 0 && mesGrps.length === 0 ? (
              <Vide
                emoji="👥"
                texte={t('groupes.aucun')}
                action={<Bouton onClick={() => { setErreur(''); setShowModal(true) }}>{t('groupes.creer')}</Bouton>}
              />
            ) : autresGrps.length === 0 ? (
              <Vide emoji="🎉" texte={t('groupes.tous_rejoints')} />
            ) : (
              autresGrps.map(g => (
                <CarteGroupe key={g.id} groupe={g} membre={false}
                  avatars={membresMap[g.id]} onAction={() => rejoindre(g.id)} />
              ))
            )}
          </Section>
        </>
      )}

      <Fab label={t('groupes.creer')} onClick={() => { setErreur(''); setShowModal(true) }} />

      {/* Création */}
      {showModal && (
        <Sheet onClose={() => setShowModal(false)}>
          <Pile espace="lg">
            <Texte variante="section" as="h2">{t('groupes.creer')}</Texte>

            {/* Modèles en un appui */}
            <div style={{ display: 'flex', gap: espace.sm, overflowX: 'auto', paddingBottom: espace.sm }}>
              {TEMPLATES.map(tpl => (
                <Puce
                  key={tpl.titre}
                  taille="sm"
                  actif={form.titre === tpl.titre}
                  onClick={() => setForm(f => ({ ...f, titre: tpl.titre, emoji: tpl.emoji, lieu: tpl.lieu }))}
                  style={{ flexShrink: 0 }}
                >
                  {tpl.emoji} {tpl.titre}
                </Puce>
              ))}
            </div>

            <Pile espace="sm" role="group" aria-label={t('groupes.emoji')}>
              <Texte variante="libelle" as="span">{t('groupes.emoji')}</Texte>
              <Pile direction="ligne" espace="sm" retour>
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    aria-label={e}
                    aria-pressed={form.emoji === e}
                    onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    style={{
                      width: 44, height: 44, fontSize: 22, borderRadius: rayon.md, cursor: 'pointer',
                      border: `2px solid ${form.emoji === e ? 'var(--cc-accent)' : couleur.bordure}`,
                      background: form.emoji === e ? 'var(--cc-accent-voile)' : couleur.surface,
                      transition: 'all 0.1s',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </Pile>
            </Pile>

            <Champ
              libelle={t('groupes.titre')}
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder={t('groupes.titre_place')}
              autoFocus
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: espace.md }}>
              <Champ
                libelle={t('groupes.lieu')}
                value={form.lieu}
                onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                placeholder={t('groupes.lieu_place')}
              />
              <Champ
                libelle={t('groupes.heure')}
                type="time"
                value={form.heure}
                onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
              />
            </div>

            <Champ
              libelle={t('groupes.max')}
              type="number" min="2" max="50"
              value={form.max_membres}
              onChange={e => setForm(f => ({ ...f, max_membres: e.target.value }))}
              placeholder="ex : 10"
            />

            {erreur && (
              <Carte hauteur="posee" padding={espace.md} role="alert"
                     style={{ background: couleur.dangerFond, border: '1px solid #fecaca' }}>
                <Texte variante="doux" style={{ color: couleur.danger, fontWeight: graisse.fort }}>⚠️ {erreur}</Texte>
              </Carte>
            )}

            <Pile direction="ligne" espace="sm">
              <Bouton variante="secondaire" taille="lg" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                {t('commun.annuler')}
              </Bouton>
              <Bouton taille="lg" style={{ flex: 2 }} charge={saving}
                      disabled={!form.titre.trim()} onClick={creerGroupe}>
                {saving ? t('groupes.creation') : `${form.emoji} ${t('groupes.creer_btn')}`}
              </Bouton>
            </Pile>
          </Pile>
        </Sheet>
      )}
    </Pile>
  )
}

function Section({ title, children }) {
  return (
    <Pile espace="sm">
      <Texte variante="libelle" as="h2">{title}</Texte>
      <Pile espace="sm">{children}</Pile>
    </Pile>
  )
}
