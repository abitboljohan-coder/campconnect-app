import { Children, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '../toast'
import { supabase } from '../supabase'
import Sheet from '../components/Sheet'
import ChoixEmoji from '../components/ChoixEmoji'
import { SUGGESTIONS_AVATARS } from '../lib/emojis'
import { isNative, setAppMode } from '../native'
import { unregisterPush } from '../push'
import { chargerBlocages, debloquer } from '../lib/moderation'
import {
  AVEC, INTERETS, codeAvec, codesInterets, emojiAvec, emojiInteret,
  jourLocal, libelleAvec, libelleInteret, nuitsRestantes,
} from '../lib/profil'
import { t, useLangue, locale, LANGUES, setLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Icone, Texte, Pile, Puce,
  couleur, espace, graisse, ombre, rayon, texte as tailles,
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
  // null tant que les compteurs chargent : un « 0 » affiché une demi-seconde
  // invitait à rejoindre un groupe que l'on avait déjà rejoint.
  const [stats, setStats] = useState({ groupes: null, animations: null })
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [confirmerDeconnexion, setConfirmerDeconnexion] = useState(false)
  const [bloques, setBloques] = useState(null)   // null : en cours de chargement
  const [feuille, setFeuille] = useState(null)   // 'langue' | 'bloques'
  const haut = useRef(null)

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

  // L'édition remplace la page : on repart du haut, sinon un appui sur
  // « Ajoutez vos centres d'intérêt », plus bas, ouvrait le formulaire au milieu.
  function ouvrirEdition() {
    setForm(vide(vacancier))
    setEditing(true)
    requestAnimationFrame(() => haut.current?.scrollIntoView({ block: 'start' }))
  }

  function fermerEdition() {
    setEditing(false)
    setForm(vide(vacancier))
    requestAnimationFrame(() => haut.current?.scrollIntoView({ block: 'start' }))
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
    toast(t('profil.enregistre'), 'succes')
    setSaving(false)
    requestAnimationFrame(() => haut.current?.scrollIntoView({ block: 'start' }))
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
  const aujourdhui = jourLocal()
  const depart = vacancier.date_depart >= aujourdhui ? vacancier.date_depart : null
  const nuits = nuitsRestantes(depart, aujourdhui)
  const avec = codeAvec(vacancier.avec)
  const langueActuelle = LANGUES.find(l => l.code === langue)

  // Tuiles d'informations : seulement celles qui sont renseignées. Seule sur
  // sa ligne, une tuile prend toute la largeur plutôt que de laisser un trou.
  const infos = [
    avec && { cle: 'avec', emoji: emojiAvec(avec) || '🧭', etiquette: t('profil.avec'), valeur: libelleAvec(avec) },
    vacancier.tranche_age && { cle: 'age', emoji: '🎂', etiquette: t('profil.tranche_age'), valeur: vacancier.tranche_age },
  ].filter(Boolean)

  return (
    <div ref={haut} style={{ minHeight: '100%' }}>

      {/* En-tête « carte de profil » : un voile aux couleurs du camping qui se
          fond dans le fond de page, sous l'en-tête clair de l'application. */}
      <section style={{
        textAlign: 'center',
        padding: `${espace.xl}px ${espace.lg}px`,
        background: 'radial-gradient(120% 85% at 50% 0%, var(--cc-accent-bordure) 0%, var(--cc-accent-voile) 45%, transparent 100%)',
      }}>
        <Avatar emoji={(editing ? form.avatar_emoji : vacancier.avatar_emoji) || '🏕️'} taille={editing ? 88 : 112} />

        <Texte variante="titre" as="h1" style={{
          marginTop: espace.md, fontSize: 26, letterSpacing: '-0.5px', overflowWrap: 'anywhere',
        }}>
          {editing ? t('profil.modifier') : vacancier.pseudo}
        </Texte>

        {!editing && (vacancier.emplacement || depart) && (
          <Pile direction="ligne" espace="xs" retour justifier="center" style={{ marginTop: espace.sm }}>
            {vacancier.emplacement && (
              <Pastille>📍 {t('profil.emplacement')} {vacancier.emplacement}</Pastille>
            )}
            {depart && (
              <Pastille>
                🗓️ {t('profil.jusquau', {
                  date: new Date(depart + 'T12:00').toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }),
                })}
              </Pastille>
            )}
          </Pile>
        )}

        {!editing && (
          <Bouton onClick={ouvrirEdition} style={{
            marginTop: espace.lg, borderRadius: rayon.rond,
            padding: `${espace.md}px ${espace.xl}px`, boxShadow: ombre.levee,
          }}>
            {t('profil.modifier')}
          </Bouton>
        )}
      </section>

      <Pile espace="xl" style={{ padding: `0 ${espace.lg}px ${espace.xl}px`, maxWidth: 500, margin: '0 auto' }}>
        {editing ? (
          <Pile espace="lg">
            <Carte padding={18} style={{ borderRadius: rayon.xl }}>
              {/* L'avatar se choisissait à l'inscription, puis plus jamais. */}
              <ChoixEmoji
                libelle={t('onb.avatar')}
                valeur={form.avatar_emoji}
                suggestions={SUGGESTIONS_AVATARS}
                onChange={avatar_emoji => setForm(f => ({ ...f, avatar_emoji }))}
              />
            </Carte>

            <Carte padding={18} style={{ borderRadius: rayon.xl }}>
              <Pile espace="lg">
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
                  min={aujourdhui}
                  onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
                />
              </Pile>
            </Carte>

            <Carte padding={18} style={{ borderRadius: rayon.xl }}>
              <Pile espace="xl">
                <Groupe libelle={t('profil.interets')}>
                  {INTERETS.map(i => (
                    <PuceChoix key={i} actif={form.interests.includes(i)} emoji={emojiInteret(i)}
                               onClick={() => toggleInteret(i)}>{libelleInteret(i)}</PuceChoix>
                  ))}
                </Groupe>

                <Groupe libelle={t('profil.avec')}>
                  {AVEC.map(a => (
                    <PuceChoix key={a} actif={form.avec === a} emoji={emojiAvec(a)}
                               onClick={() => setForm(f => ({ ...f, avec: a }))}>
                      {libelleAvec(a)}
                    </PuceChoix>
                  ))}
                </Groupe>

                <Groupe libelle={t('profil.tranche_age')}>
                  {TRANCHES.map(v => (
                    <PuceChoix key={v} actif={form.tranche_age === v}
                               onClick={() => setForm(f => ({ ...f, tranche_age: v }))}>
                      {v}
                    </PuceChoix>
                  ))}
                </Groupe>
              </Pile>
            </Carte>

            <Pile direction="ligne" espace="sm">
              <Bouton variante="secondaire" taille="lg" style={{ flex: 1, minWidth: 0 }} onClick={fermerEdition}>
                {t('commun.annuler')}
              </Bouton>
              <Bouton taille="lg" charge={saving} disabled={!form.pseudo.trim()} onClick={sauvegarder}
                      style={{ flex: 2, minWidth: 0 }}>
                {saving ? t('commun.enregistrement') : t('commun.enregistrer')}
              </Bouton>
            </Pile>
          </Pile>
        ) : (
          <>
            {/* Grille « bento » : l'activité d'abord, puis les infos clés. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: espace.md }}>
              <Tuile to="/groupes" accent emoji="👥" etiquette={t('profil.mes_groupes')}
                     valeur={stats.groupes} vide={t('profil.groupes_vide')} />
              <Tuile to="/agenda" emoji="📅" etiquette={t('profil.mes_animations')}
                     valeur={stats.animations} vide={t('profil.animations_vide')} />
              {nuits !== null && (
                <Tuile large emoji="🌙" etiquette={t('profil.sejour')}
                       texte={nuits === 0 ? t('profil.depart_aujourdhui')
                         : nuits === 1 ? t('profil.encore_nuit')
                         : t('profil.encore_nuits', { n: nuits })} />
              )}
              {infos.map(i => (
                <Tuile key={i.cle} large={infos.length === 1} emoji={i.emoji}
                       etiquette={i.etiquette} texte={i.valeur} />
              ))}
            </div>

            {/* Centres d'intérêt : des puces, ou une invitation quand il n'y en a pas. */}
            <section>
              <Pile espace="md">
                <Texte variante="sousTitre" as="h2">{t('profil.interets')}</Texte>
                {interests.length > 0 ? (
                  <Pile direction="ligne" espace="sm" retour>
                    {interests.map(code => (
                      <span key={code} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%',
                        padding: `${espace.sm}px 14px`, borderRadius: rayon.rond,
                        background: couleur.surface, border: '1px solid var(--cc-accent-bordure)',
                        boxShadow: ombre.posee,
                        fontSize: tailles.base, fontWeight: graisse.fort, color: couleur.texte,
                      }}>
                        {emojiInteret(code) && <span aria-hidden="true">{emojiInteret(code)}</span>}
                        <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{libelleInteret(code)}</span>
                      </span>
                    ))}
                  </Pile>
                ) : (
                  <button type="button" onClick={ouvrirEdition} style={{
                    display: 'flex', alignItems: 'center', gap: espace.md, width: '100%',
                    padding: espace.lg, borderRadius: rayon.xl, textAlign: 'left', cursor: 'pointer',
                    background: 'var(--cc-accent-voile)', border: '1.5px dashed var(--cc-accent-bordure)',
                    color: couleur.texte,
                  }}>
                    <span aria-hidden="true" style={{ fontSize: 26, flexShrink: 0 }}>✨</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <Texte variante="corps" as="span" style={{ display: 'block', color: couleur.texte, fontWeight: graisse.fort }}>
                        {t('profil.interets_vide')}
                      </Texte>
                      <Texte variante="doux" as="span" style={{ display: 'block' }}>{t('profil.interets_vide_aide')}</Texte>
                    </span>
                    <Icone nom="chevron" taille={18} style={{ color: couleur.texteDoux }} />
                  </button>
                )}
              </Pile>
            </section>

            {/* Réglages : sobres, regroupés, chacun à un appui. */}
            <section>
              <Pile espace="sm">
                <Texte variante="libelle" as="h2" style={{ paddingLeft: espace.xs }}>{t('profil.reglages')}</Texte>
                <Liste>
                  <Rangee emoji="🌐" libelle={t('profil.langue')} valeur={langueActuelle?.label}
                          onClick={() => setFeuille('langue')} />
                  <Rangee emoji="🚫" libelle={t('moderation.bloques_titre')}
                          valeur={bloques === null ? '' : String(bloques.length)}
                          onClick={() => setFeuille('bloques')} />
                  {/* L'entrée gérant n'existait que sur l'écran de recherche : une fois
                      le camping rejoint, Onboarding ne s'affiche plus et la console
                      devenait injoignable sans supprimer son compte. Un gérant est
                      d'abord un vacancier de son propre camping — il lui faut une
                      porte depuis l'intérieur. */}
                  {isNative && (
                    <Rangee emoji="🧑‍💼" libelle={t('profil.espace_gerant')} onClick={() => setAppMode('gerant')} />
                  )}
                </Liste>
              </Pile>
            </section>

            <section>
              <Pile espace="sm">
                <Texte variante="libelle" as="h2" style={{ paddingLeft: espace.xs }}>{t('profil.compte')}</Texte>
                {/* Une rangée plutôt que le gros bouton rouge d'autrefois, qui
                    attirait l'œil plus que tout le reste. La confirmation reste. */}
                <Liste>
                  <Rangee icone="sortie" libelle={t('profil.deconnexion')} danger
                          onClick={() => setConfirmerDeconnexion(true)} />
                </Liste>

                {/* Se déconnecter et supprimer son compte ne sont pas la même chose,
                    et rien ne doit laisser croire le contraire : le second est écrit
                    en clair, séparé, et demande une confirmation. */}
                <Bouton variante="discret" pleineLargeur onClick={() => setConfirmerSuppression(true)}
                        style={{ color: couleur.danger, fontWeight: graisse.normal, fontSize: tailles.petit }}>
                  {t('profil.suppr_compte')}
                </Bouton>
              </Pile>
            </section>

            <Pile espace="xs" style={{ textAlign: 'center' }}>
              <Texte variante="micro">CampConnect — {camping?.nom}</Texte>
              {VERSION && <Texte variante="micro" style={{ opacity: 0.6 }}>{VERSION}</Texte>}
            </Pile>
          </>
        )}
      </Pile>

      {feuille === 'langue' && (
        <Sheet onClose={() => setFeuille(null)}>
          <Pile espace="lg">
            <Texte variante="section" as="h2">{t('profil.langue')}</Texte>
            <Liste>
              {LANGUES.map(l => (
                <Rangee key={l.code} emoji={l.drapeau} libelle={l.label} actif={langue === l.code}
                        onClick={() => { setLangue(l.code); setFeuille(null) }} />
              ))}
            </Liste>
          </Pile>
        </Sheet>
      )}

      {feuille === 'bloques' && (
        <Sheet onClose={() => setFeuille(null)}>
          <Pile espace="lg">
            <Texte variante="section" as="h2">{t('moderation.bloques_titre')}</Texte>
            {bloques?.length === 0 && <Texte variante="corps">{t('moderation.aucun_bloque')}</Texte>}
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
            <Bouton variante="secondaire" taille="lg" pleineLargeur onClick={() => setFeuille(null)}>
              {t('commun.fermer')}
            </Bouton>
          </Pile>
        </Sheet>
      )}

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

/** Avatar emoji dans un anneau dégradé aux couleurs du camping. */
function Avatar({ emoji, taille }) {
  return (
    <div aria-hidden="true" style={{
      width: taille, height: taille, margin: '0 auto', padding: 4, borderRadius: rayon.rond,
      background: 'conic-gradient(from 210deg, var(--cc-accent), var(--cc-accent-sombre), var(--cc-accent))',
      boxShadow: '0 10px 30px var(--cc-accent-bordure)',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: rayon.rond,
        background: couleur.surface, boxShadow: `inset 0 0 0 3px ${couleur.surface}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(taille / 2), lineHeight: 1,
      }}>
        {emoji}
      </div>
    </div>
  )
}

/** Petite information sous le pseudo : emplacement, date de départ. */
function Pastille({ children }) {
  return (
    <span style={{
      display: 'inline-block', maxWidth: '100%', padding: `5px ${espace.md}px`,
      borderRadius: rayon.rond, background: 'rgba(255,255,255,0.75)',
      border: `1px solid ${couleur.bordure}`,
      fontSize: tailles.petit, fontWeight: graisse.normal, color: couleur.texteMoyen,
    }}>
      {children}
    </span>
  )
}

/**
 * Tuile de la grille « bento ». Avec `to`, c'est un lien ; avec `valeur`, un
 * compteur — remplacé par l'invitation `vide` quand il vaut 0, car un gros
 * « 0 » n'apprend rien à personne.
 */
function Tuile({ to, accent, large, emoji, etiquette, valeur, vide, texte }) {
  const compteur = valeur !== undefined
  const zero = compteur && valeur === 0
  const Balise = to ? Link : 'div'
  return (
    <Balise to={to} style={{
      gridColumn: large ? '1 / -1' : undefined,
      minWidth: 0, minHeight: large ? 0 : 124,
      display: 'flex', flexDirection: large ? 'row' : 'column',
      alignItems: large ? 'center' : 'stretch', justifyContent: 'space-between',
      gap: espace.md, padding: espace.lg, borderRadius: rayon.xl,
      background: accent ? 'linear-gradient(150deg, var(--cc-accent), var(--cc-accent-sombre))' : couleur.surface,
      border: accent ? '1px solid transparent' : `1px solid ${couleur.bordure}`,
      boxShadow: accent ? '0 8px 22px var(--cc-accent-bordure)' : ombre.posee,
      color: accent ? couleur.texteSurAccent : couleur.texte,
      textDecoration: 'none',
    }}>
      <Pile direction="ligne" justifier="space-between" aligner="flex-start" style={{ flexShrink: 0 }}>
        <span aria-hidden="true" style={{
          width: 40, height: 40, borderRadius: rayon.md, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
          background: accent ? 'rgba(255,255,255,0.18)' : 'var(--cc-accent-voile)',
        }}>
          {emoji}
        </span>
        {to && <Icone nom="chevron" taille={18} style={{ opacity: 0.7 }} />}
      </Pile>
      <div style={{ minWidth: 0, flex: large ? 1 : undefined }}>
        {compteur && !zero && (
          <div style={{ fontSize: 30, fontWeight: graisse.affiche, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            {valeur ?? '–'}
          </div>
        )}
        {(texte || zero) && (
          <div style={{
            fontSize: large ? tailles.grand : tailles.moyen, fontWeight: graisse.titre, lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}>
            {zero ? vide : texte}
          </div>
        )}
        <div style={{
          marginTop: 2, fontSize: tailles.petit, fontWeight: graisse.normal, lineHeight: 1.35,
          color: accent ? 'rgba(255,255,255,0.88)' : couleur.texteDoux,
          overflowWrap: 'anywhere',
        }}>
          {etiquette}
        </div>
      </div>
    </Balise>
  )
}

/** Carte qui empile des rangées, séparées d'un filet. */
function Liste({ children }) {
  return (
    <Carte padding={0} style={{ borderRadius: rayon.xl, overflow: 'hidden' }}>
      {Children.toArray(children).filter(Boolean).map((enfant, i) => (
        <div key={i} style={{ borderTop: i ? `1px solid ${couleur.bordure}` : 'none' }}>{enfant}</div>
      ))}
    </Carte>
  )
}

/** Rangée de réglage : pictogramme, libellé, valeur actuelle, chevron. */
function Rangee({ emoji, icone, libelle, valeur, onClick, danger, actif }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={actif} style={{
      display: 'flex', alignItems: 'center', gap: espace.md, width: '100%', minHeight: 56,
      padding: `${espace.sm}px ${espace.lg}px`, background: 'none', border: 'none',
      textAlign: 'left', cursor: 'pointer', color: danger ? couleur.danger : couleur.texte,
    }}>
      <span aria-hidden="true" style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        background: danger ? couleur.dangerFond : couleur.fond,
      }}>
        {icone ? <Icone nom={icone} taille={19} /> : emoji}
      </span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: tailles.moyen, fontWeight: graisse.fort,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {libelle}
      </span>
      {valeur && (
        <span style={{
          minWidth: 0, maxWidth: '40%', fontSize: tailles.base, color: couleur.texteDoux,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {valeur}
        </span>
      )}
      {actif !== undefined
        ? actif && <Icone nom="coche" taille={20} style={{ color: 'var(--cc-accent)' }} />
        : !danger && <Icone nom="chevron" taille={18} style={{ color: couleur.texteDoux }} />}
    </button>
  )
}

/** Puce de choix du mode édition : emoji, libellé, et une coche quand elle
 *  est choisie — l'état ne repose pas que sur la couleur. */
function PuceChoix({ actif, emoji, children, onClick }) {
  return (
    <Puce actif={actif} onClick={onClick} style={{ maxWidth: '100%' }}>
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
      {actif && <Icone nom="coche" taille={15} epaisseur={2.4} />}
    </Puce>
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

