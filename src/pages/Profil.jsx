import { useEffect, useState } from 'react'
import { toast } from '../toast'
import { supabase } from '../supabase'
import Sheet from '../components/Sheet'
import ChoixEmoji from '../components/ChoixEmoji'
import { SUGGESTIONS_AVATARS } from '../lib/emojis'
import { isNative, setAppMode } from '../native'
import { unregisterPush } from '../push'
import { chargerBlocages, debloquer } from '../lib/moderation'
import { AVEC, INTERETS, codeAvec, codesInterets, libelleAvec, libelleInteret } from '../lib/profil'
import { t, useLangue, locale, LANGUES, setLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, Puce,
  couleur, espace, graisse, rayon, texte as tailles,
} from '../design'

const TRANCHES = ['18-25', '26-35', '36-45', '46-60', '60+']

// « build 119 · main · 1a2b3c4 » : quelle version tourne sur ce téléphone.
const INFO = typeof __BUILD_INFO__ !== 'undefined' ? __BUILD_INFO__ : {}
const VERSION = [INFO.numero && `build ${INFO.numero}`, INFO.branche, INFO.commit].filter(Boolean).join(' · ')

const vide = v => ({
  avatar_emoji: v.avatar_emoji || '🏕️',
  pseudo: v.pseudo || '',
  emplacement: v.emplacement || '',
  tranche_age: v.tranche_age || '',
  // Les anciens profils portent des libellés français : ramenés à leur code.
  avec: codeAvec(v.avec),
  interests: codesInterets(v.interests),
  date_depart: v.date_depart || '',
})

export default function Profil({ camping, vacancier, onLogout, onUpdate }) {
  const langue = useLangue()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => vide(vacancier))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [stats, setStats] = useState({ groupes: 0, animations: 0 })
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [confirmerDeconnexion, setConfirmerDeconnexion] = useState(false)
  const [bloques, setBloques] = useState(null)   // null : en cours de chargement

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

  // Vacanciers bloqués : sans cette liste, un blocage par erreur était
  // définitif — rien dans l'app ne permettait de revenir dessus.
  useEffect(() => {
    let actif = true
    async function loadBloques() {
      const ids = [...await chargerBlocages(vacancier.id)]
      if (!ids.length) { if (actif) setBloques([]); return }
      const { data } = await supabase.from('vacanciers')
        .select('id, pseudo, avatar_emoji').in('id', ids)
      const parId = new Map((data || []).map(b => [b.id, b]))
      if (actif) setBloques(ids.map(id => parId.get(id) || { id }))
    }
    loadBloques()
    return () => { actif = false }
  }, [vacancier.id])

  async function retirerBlocage(b) {
    const pseudo = b.pseudo || t('moderation.ce_vacancier')
    const ok = await debloquer(vacancier.id, b.id)
    if (!ok) { toast(t('moderation.err_debloquer'), 'erreur'); return }
    setBloques(l => l.filter(x => x.id !== b.id))
    toast(t('moderation.debloque', { pseudo }), 'succes')
  }

  function toggleInteret(val) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val) ? f.interests.filter(i => i !== val) : [...f.interests, val],
    }))
  }

  async function sauvegarder() {
    if (!form.pseudo.trim() || saving) return   // un pseudo vide rendait l'auteur anonyme partout
    setSaving(true)
    const { data, error } = await supabase.from('vacanciers').update({
      avatar_emoji: form.avatar_emoji,
      pseudo:      form.pseudo.trim(),
      emplacement: form.emplacement.trim() || null,
      tranche_age: form.tranche_age || null,
      avec:        form.avec || null,
      interests:   form.interests.length > 0 ? form.interests : null,
      date_depart: form.date_depart || null,
    }).eq('id', vacancier.id).select().single()

    if (error) {
      console.error('Sauvegarde profil échouée :', error)
      setSaving(false)
      toast(t('profil.err_save'), 'erreur')
      return
    }
    // Le profil enregistré remonte jusqu'à l'application. Il n'était écrit
    // qu'en base et dans le stockage local : l'écran continuait d'afficher
    // l'ancien pseudo — « Enregistré », mais rien n'avait changé à l'œil —,
    // et l'accueil comme le chat le gardaient jusqu'au redémarrage.
    const updated = data || { ...vacancier, ...form }
    localStorage.setItem('vacancier', JSON.stringify(updated))
    onUpdate?.(updated)
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  /**
   * Suppression du compte, exigée par la règle 5.1.1(v) de l'App Store : une
   * application qui permet de créer un compte doit permettre de le supprimer,
   * depuis l'application elle-même.
   *
   * Une seule ligne suffit : les clés étrangères de la base font le reste.
   * Messages, statuts, annonces, inscriptions, appartenances aux groupes,
   * positions et blocages sont en CASCADE — ils partent avec le profil.
   *
   * Deux choses survivent, volontairement :
   *   • les groupes créés par la personne, dont le créateur passe à NULL.
   *     Les supprimer emporterait les conversations de tous les autres
   *     membres, qui n'ont rien demandé ;
   *   • les signalements la concernant, anonymisés de la même façon. Un
   *     signalement qui disparaît quand son auteur s'en va laisserait la
   *     modération sans trace de ce qui a été signalé.
   *
   * La session anonyme est fermée dans la foulée : sans cela, le prochain
   * lancement rouvrirait l'application avec la même identité auth, sur un
   * profil qui n'existe plus.
   */
  async function supprimerCompte() {
    if (suppression) return
    setSuppression(true)

    // Avant la suppression, et surtout avant signOut() : la règle d'accès
    // pt_delete_own exige le rôle « authenticated » et user_id = auth.uid().
    // Une fois la session fermée, la requête part en anonyme, ne correspond à
    // aucune règle, et n'efface rien — sans lever la moindre erreur, puisqu'un
    // DELETE qui ne touche aucune ligne n'en est pas une. Le jeton restait donc
    // dans la base après que la personne ait demandé la suppression de tout.
    await unregisterPush()

    const { error } = await supabase.from('vacanciers').delete().eq('id', vacancier.id)
    if (error) {
      console.error('Suppression du compte échouée :', error)
      setSuppression(false)
      setConfirmerSuppression(false)
      toast(t('profil.suppr_erreur'), 'erreur')
      return
    }
    await supabase.auth.signOut()
    onLogout()
  }

  const interests = codesInterets(vacancier.interests)

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
                {libelleInteret(tag)}
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
                {/* L'avatar se choisissait à l'inscription, puis plus jamais. */}
                <ChoixEmoji
                  libelle={t('onb.avatar')}
                  valeur={form.avatar_emoji}
                  suggestions={SUGGESTIONS_AVATARS}
                  onChange={avatar_emoji => setForm(f => ({ ...f, avatar_emoji }))}
                />
                <Champ
                  libelle={t('profil.pseudo')}
                  value={form.pseudo}
                  maxLength={40}
                  onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))}
                />
                <Champ
                  libelle={t('profil.emplacement')}
                  value={form.emplacement}
                  placeholder={t('onb.emplacement_ph')}
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
                  {AVEC.map(a => (
                    <Puce key={a} taille="sm" actif={form.avec === a}
                          onClick={() => setForm(f => ({ ...f, avec: a }))}>{libelleAvec(a)}</Puce>
                  ))}
                </Groupe>

                <Groupe libelle={t('profil.interets')}>
                  {INTERETS.map(i => (
                    <Puce key={i} taille="sm" actif={form.interests.includes(i)}
                          onClick={() => toggleInteret(i)}>{libelleInteret(i)}</Puce>
                  ))}
                </Groupe>

                <Pile direction="ligne" espace="sm">
                  <Bouton variante="secondaire" style={{ flex: 1 }}
                          onClick={() => { setEditing(false); setForm(vide(vacancier)) }}>
                    {t('commun.annuler')}
                  </Bouton>
                  <Bouton charge={saving} disabled={!form.pseudo.trim()} onClick={sauvegarder} style={{ flex: 2 }}>
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
                {vacancier.avec && <Ligne label={t('profil.avec')} value={libelleAvec(vacancier.avec)} />}
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

        {/* Vacanciers bloqués */}
        <Carte hauteur="posee" padding={`${espace.lg}px 18px`}>
          <Pile espace="md">
            <Texte variante="libelle" as="h2">{t('moderation.bloques_titre')}</Texte>
            {bloques?.length === 0 && <Texte variante="doux">{t('moderation.aucun_bloque')}</Texte>}
            {bloques?.map(b => (
              <Pile key={b.id} direction="ligne" espace="md" aligner="center">
                <span aria-hidden="true" style={{ fontSize: 22, flexShrink: 0 }}>{b.avatar_emoji || '🏕️'}</span>
                <Texte variante="corps" as="span" style={{
                  flex: 1, minWidth: 0, color: couleur.texte, fontWeight: graisse.fort,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {b.pseudo || t('moderation.ce_vacancier')}
                </Texte>
                <Bouton variante="secondaire" taille="sm" style={{ flexShrink: 0 }}
                        onClick={() => retirerBlocage(b)}>
                  {t('moderation.debloquer')}
                </Bouton>
              </Pile>
            ))}
          </Pile>
        </Carte>

        <Pile espace="sm">
          {/* Le plus gros bouton rouge de l'écran : un appui de travers renvoyait
              à la recherche du camping, avec tout le parcours d'arrivée à refaire. */}
          <Bouton variante="danger" taille="lg" pleineLargeur onClick={() => setConfirmerDeconnexion(true)}>
            {t('profil.deconnexion')}
          </Bouton>

          {/* Se déconnecter et supprimer son compte ne sont pas la même chose,
              et rien ne doit laisser croire le contraire : le second est écrit
              en clair, séparé, et demande une confirmation. */}
          <Bouton variante="discret" pleineLargeur
                  onClick={() => setConfirmerSuppression(true)}
                  style={{ color: couleur.danger }}>
            {t('profil.suppr_compte')}
          </Bouton>

          {/* L'entrée gérant n'existait que sur l'écran de recherche : une fois
              le camping rejoint, Onboarding ne s'affiche plus et la console
              devenait injoignable sans supprimer son compte. Un gérant est
              d'abord un vacancier de son propre camping — il lui faut une
              porte depuis l'intérieur. */}
          {isNative && (
            <Bouton variante="discret" pleineLargeur
                    onClick={() => setAppMode('gerant')}
                    style={{ textDecoration: 'underline' }}>
              {t('profil.espace_gerant')}
            </Bouton>
          )}
        </Pile>

        <Texte variante="micro" style={{ textAlign: 'center' }}>
          CampConnect — {camping?.nom}
        </Texte>
        {VERSION && (
          <Texte variante="micro" style={{ textAlign: 'center', opacity: 0.6, marginTop: -espace.md }}>
            {VERSION}
          </Texte>
        )}
      </Pile>

      {confirmerDeconnexion && (
        <Sheet onClose={() => setConfirmerDeconnexion(false)}>
          <Pile espace="lg">
            <Pile espace="xs">
              <Texte variante="section" as="h2">{t('profil.deconnexion_titre')}</Texte>
              <Texte variante="corps">{t('profil.deconnexion_texte')}</Texte>
            </Pile>
            {/* Empilés : « Se déconnecter » se coupait en deux lignes à 320 px. */}
            <Pile espace="sm">
              <Bouton variante="danger" taille="lg" pleineLargeur onClick={onLogout}>
                {t('profil.deconnexion')}
              </Bouton>
              <Bouton variante="secondaire" taille="lg" pleineLargeur
                      onClick={() => setConfirmerDeconnexion(false)}>
                {t('commun.annuler')}
              </Bouton>
            </Pile>
          </Pile>
        </Sheet>
      )}

      {confirmerSuppression && (
        <Sheet onClose={() => !suppression && setConfirmerSuppression(false)}>
          <Pile espace="lg">
            <Pile espace="xs">
              <Texte variante="section" as="h2">{t('profil.suppr_titre')}</Texte>
              <Texte variante="corps">{t('profil.suppr_texte')}</Texte>
            </Pile>

            <Carte hauteur="posee" padding={espace.md}
                   style={{ background: couleur.dangerFond, border: '1px solid #fecaca' }}>
              <Texte variante="doux" style={{ color: couleur.danger, fontWeight: graisse.fort }}>
                {t('profil.suppr_definitif')}
              </Texte>
            </Carte>

            <Pile direction="ligne" espace="sm">
              <Bouton variante="secondaire" taille="lg" style={{ flex: 1 }}
                      disabled={suppression}
                      onClick={() => setConfirmerSuppression(false)}>
                {t('commun.annuler')}
              </Bouton>
              <Bouton variante="danger" taille="lg" style={{ flex: 1 }}
                      charge={suppression} onClick={supprimerCompte}>
                {suppression ? t('profil.suppr_en_cours') : t('profil.suppr_confirmer')}
              </Bouton>
            </Pile>
          </Pile>
        </Sheet>
      )}
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
