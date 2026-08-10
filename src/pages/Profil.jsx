import { useEffect, useState } from 'react'
import { toast } from '../toast'
import { supabase } from '../supabase'
import { t, useLangue, locale, LANGUES, setLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, Puce,
  couleur, espace, graisse, rayon, texte as tailles,
} from '../design'

const TRANCHES = ['18-25', '26-35', '36-45', '46-60', '60+']
const AVEC_OPTIONS = ['Solo', 'En couple', 'Entre amis', 'En famille']
const INTERETS = ['Sport', 'Musique', 'Nature', 'Cuisine', 'Jeux', 'Lecture', 'Randonnée', 'Piscine', 'Soirées', 'Enfants']

const vide = v => ({
  pseudo: v.pseudo || '',
  emplacement: v.emplacement || '',
  tranche_age: v.tranche_age || '',
  avec: v.avec || '',
  interests: Array.isArray(v.interests) ? v.interests : [],
  date_depart: v.date_depart || '',
})

export default function Profil({ camping, vacancier, onLogout }) {
  const langue = useLangue()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => vide(vacancier))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [stats, setStats] = useState({ groupes: 0, animations: 0 })

  useEffect(() => {
    async function loadStats() {
      const [{ count: grpCount }, { count: animCount }] = await Promise.all([
        supabase.from('membres_groupes').select('*', { count: 'exact', head: true }).eq('vacancier_id', vacancier.id),
        supabase.from('inscriptions').select('*', { count: 'exact', head: true }).eq('vacancier_id', vacancier.id),
      ])
      setStats({ groupes: grpCount || 0, animations: animCount || 0 })
    }
    loadStats()
  }, [vacancier.id])

  function toggleInteret(val) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val) ? f.interests.filter(i => i !== val) : [...f.interests, val],
    }))
  }

  async function sauvegarder() {
    setSaving(true)
    const { error } = await supabase.from('vacanciers').update({
      pseudo:      form.pseudo.trim(),
      emplacement: form.emplacement.trim() || null,
      tranche_age: form.tranche_age || null,
      avec:        form.avec || null,
      interests:   form.interests.length > 0 ? form.interests : null,
      date_depart: form.date_depart || null,
    }).eq('id', vacancier.id)

    if (error) {
      console.error('Sauvegarde profil échouée :', error)
      setSaving(false)
      toast(t('profil.err_save'), 'erreur')
      return
    }
    const updated = { ...vacancier, ...form }
    localStorage.setItem('vacancier', JSON.stringify(updated))
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  const interests = Array.isArray(vacancier.interests) ? vacancier.interests : []

  return (
    <div style={{ background: couleur.fond, minHeight: '100%' }}>

      {/* Bandeau d'identité */}
      <Pile espace="md" aligner="center"
            style={{ background: couleur.marqueSombre, padding: '28px 20px 24px' }}>
        <div
          aria-hidden="true"
          style={{
            width: 80, height: 80, borderRadius: rayon.rond,
            background: 'var(--cc-accent-voile)',
            border: '3px solid var(--cc-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
          }}
        >
          {vacancier.avatar_emoji || '🏕️'}
        </div>

        <Pile espace="xs" aligner="center" style={{ textAlign: 'center' }}>
          <Texte variante="section" as="h1" style={{ color: '#fff', fontSize: tailles.titre }}>
            {vacancier.pseudo}
          </Texte>
          {vacancier.emplacement && (
            <Texte variante="doux" style={{ color: '#C0DD97' }}>
              📍 {t('profil.emplacement')} {vacancier.emplacement}
            </Texte>
          )}
          <Texte variante="micro" style={{ color: 'rgba(255,255,255,0.55)' }}>{camping?.nom}</Texte>
        </Pile>

        {interests.length > 0 && (
          <Pile direction="ligne" espace="xs" retour justifier="center">
            {interests.map(tag => (
              <span key={tag} style={{
                background: 'var(--cc-accent-voile)', color: '#C0DD97',
                fontSize: tailles.petit, fontWeight: graisse.normal,
                padding: `3px ${espace.md}px`, borderRadius: rayon.rond,
                border: '1px solid var(--cc-accent-bordure)',
              }}>
                {tag}
              </span>
            ))}
          </Pile>
        )}
      </Pile>

      <Pile espace="lg" style={{ padding: `${espace.xl}px ${espace.lg}px`, maxWidth: 500, margin: '0 auto' }}>

        {success && (
          <Carte hauteur="posee" padding={espace.md} role="status"
                 style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <Texte variante="corps" style={{ color: couleur.succes, fontWeight: graisse.fort }}>
              {t('profil.enregistre')}
            </Texte>
          </Carte>
        )}

        {/* Compteurs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: espace.sm }}>
          {[
            { n: stats.groupes,    label: t('nav.groupes'),    icon: '👥' },
            { n: stats.animations, label: t('nav.agenda'),     icon: '📅' },
            { n: interests.length, label: t('profil.interets_court'), icon: '⭐' },
          ].map(s => (
            <Carte key={s.label} hauteur="posee" padding={`14px ${espace.sm}px`} style={{ textAlign: 'center' }}>
              <div aria-hidden="true" style={{ fontSize: 22 }}>{s.icon}</div>
              <Texte variante="section" style={{ fontSize: 22 }}>{s.n}</Texte>
              <Texte variante="micro" style={{ marginTop: 2 }}>{s.label}</Texte>
            </Carte>
          ))}
        </div>

        {/* Informations */}
        <Carte hauteur="posee" padding={20}>
          <Pile espace="lg">
            <Pile direction="ligne" justifier="space-between" aligner="center">
              <Texte variante="sousTitre" as="h2">{t('profil.mes_infos')}</Texte>
              {!editing && (
                <Bouton variante="discret" taille="sm" onClick={() => setEditing(true)}
                        style={{ color: 'var(--cc-accent)' }}>
                  {t('commun.modifier')}
                </Bouton>
              )}
            </Pile>

            {editing ? (
              <Pile espace="lg">
                <Champ
                  libelle={t('profil.pseudo')}
                  value={form.pseudo}
                  onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))}
                />
                <Champ
                  libelle={t('profil.emplacement')}
                  value={form.emplacement}
                  placeholder="ex : A42"
                  onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
                />
                <Champ
                  libelle={t('profil.depart')}
                  type="date"
                  value={form.date_depart}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
                />

                <Groupe libelle={t('profil.tranche_age')}>
                  {TRANCHES.map(v => (
                    <Puce key={v} taille="sm" actif={form.tranche_age === v}
                          onClick={() => setForm(f => ({ ...f, tranche_age: v }))}>{v}</Puce>
                  ))}
                </Groupe>

                <Groupe libelle={t('profil.avec')}>
                  {AVEC_OPTIONS.map(a => (
                    <Puce key={a} taille="sm" actif={form.avec === a}
                          onClick={() => setForm(f => ({ ...f, avec: a }))}>{a}</Puce>
                  ))}
                </Groupe>

                <Groupe libelle={t('profil.interets')}>
                  {INTERETS.map(i => (
                    <Puce key={i} taille="sm" actif={form.interests.includes(i)}
                          onClick={() => toggleInteret(i)}>{i}</Puce>
                  ))}
                </Groupe>

                <Pile direction="ligne" espace="sm">
                  <Bouton variante="secondaire" style={{ flex: 1 }}
                          onClick={() => { setEditing(false); setForm(vide(vacancier)) }}>
                    {t('commun.annuler')}
                  </Bouton>
                  <Bouton charge={saving} onClick={sauvegarder} style={{ flex: 2 }}>
                    {saving ? t('commun.enregistrement') : t('commun.enregistrer')}
                  </Bouton>
                </Pile>
              </Pile>
            ) : (
              <Pile espace="md">
                <Ligne label={t('profil.pseudo')} value={vacancier.pseudo} />
                <Ligne label={t('profil.emplacement')} value={vacancier.emplacement || '—'} />
                <Ligne
                  label={t('profil.depart')}
                  value={vacancier.date_depart
                    ? new Date(vacancier.date_depart + 'T12:00').toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })
                    : '—'}
                />
                {vacancier.tranche_age && <Ligne label={t('profil.tranche_age')} value={vacancier.tranche_age} />}
                {vacancier.avec && <Ligne label={t('profil.avec')} value={vacancier.avec} />}
              </Pile>
            )}
          </Pile>
        </Carte>

        {/* Langue */}
        <Carte hauteur="posee" padding={`${espace.lg}px 18px`}>
          <Pile espace="md">
            <Texte variante="libelle" as="span">{t('profil.langue')}</Texte>
            <Pile direction="ligne" espace="sm" retour>
              {LANGUES.map(l => (
                <Puce key={l.code} actif={langue === l.code} onClick={() => setLangue(l.code)}>
                  <span aria-hidden="true" style={{ fontSize: 17 }}>{l.drapeau}</span>{l.label}
                </Puce>
              ))}
            </Pile>
          </Pile>
        </Carte>

        <Bouton variante="danger" taille="lg" pleineLargeur onClick={onLogout}>
          {t('profil.deconnexion')}
        </Bouton>

        <Texte variante="micro" style={{ textAlign: 'center' }}>
          CampConnect — {camping?.nom}
        </Texte>
      </Pile>
    </div>
  )
}

function Ligne({ label, value }) {
  return (
    <Pile direction="ligne" justifier="space-between" aligner="center"
          style={{ paddingBottom: espace.md, borderBottom: `1px solid ${couleur.fond}` }}>
      <Texte variante="corps" as="span">{label}</Texte>
      <Texte variante="corps" as="span" style={{ fontSize: tailles.moyen, color: couleur.texte, fontWeight: graisse.fort }}>
        {value}
      </Texte>
    </Pile>
  )
}

/** Un libellé au-dessus d'un ensemble de puces. Ce n'est pas un champ de saisie :
 *  il n'a donc pas de `for`, mais un groupe nommé, ce qu'attend un lecteur d'écran. */
function Groupe({ libelle, children }) {
  return (
    <Pile espace="sm" role="group" aria-label={libelle}>
      <Texte variante="libelle" as="span">{libelle}</Texte>
      <Pile direction="ligne" espace="sm" retour>{children}</Pile>
    </Pile>
  )
}
