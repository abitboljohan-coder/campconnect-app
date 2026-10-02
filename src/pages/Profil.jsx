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
  AVEC, INTERETS, codeAvec, codesInterets, emojiAvec,
  jourLocal, libelleAvec, nuitsRestantes, phraseAvec,
} from '../lib/profil'
import { accentCourant, teintesPaysage } from '../lib/paysage'
import { AvatarPostale, GrilleInterets, Paysage, RondsInterets } from '../components/CartePostale'
import { t, useLangue, locale, LANGUES, setLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Icone, Texte, Pile, Puce,
  couleur, espace, graisse, rayon, texte as tailles,
} from '../design'

const TRANCHES = ['18-25', '26-35', '36-45', '46-60', '60+']

// Marge latérale du profil : un peu plus que le reste de l'application, comme
// sur la maquette « carte postale » — le texte respire sous le paysage.
const MARGE = 20
const TITRE = { fontSize: 32, fontWeight: graisse.affiche, letterSpacing: '-1px', lineHeight: 1.08, overflowWrap: 'anywhere' }
const TITRE_SECTION = { fontSize: 18, fontWeight: graisse.titre, letterSpacing: '-0.3px', color: couleur.texte }
// L'action principale du profil, à l'encre : l'accent est déjà partout dans
// le paysage, un bouton de plus à sa couleur s'y perdrait.
const BOUTON_ENCRE = {
  background: couleur.texte, color: couleur.texteSurAccent, border: '1px solid transparent',
  borderRadius: rayon.rond, padding: `0 ${espace.lg}px`, minHeight: 44, fontSize: tailles.moyen - 0.5,
}

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
  const langueActuelle = LANGUES.find(l => l.code === langue)
  const accent = teintesPaysage(accentCourant())

  // « En vacances entre amis · 26–35 ans » : seulement ce qui est renseigné.
  const bio = [
    vacancier.avec && phraseAvec(vacancier.avec),
    vacancier.tranche_age && t('profil.age', { tranche: vacancier.tranche_age.replace('-', '–') }),
  ].filter(Boolean).join(' · ')

  return (
    <div ref={haut} style={{ minHeight: '100%', overflowX: 'hidden', paddingBottom: espace.xl }}>

      {/* L'en-tête « carte postale » : le paysage du camping, l'avatar posé
          dessus et, à droite, l'action principale de l'écran. */}
      <Paysage />
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: espace.md,
        // Le chevauchement suit la hauteur du paysage, proportionnelle à la
        // largeur : fixe, il faisait remonter le bouton sur la tente à 320 px.
        padding: `0 ${MARGE}px`, marginTop: 'clamp(-58px, -14vw, -44px)', position: 'relative',
      }}>
        <AvatarPostale emoji={(editing ? form.avatar_emoji : vacancier.avatar_emoji) || '🏕️'} />
        {!editing && (
          <Bouton onClick={ouvrirEdition} icone={<Icone nom="crayon" taille={16} epaisseur={2} />} style={{
            ...BOUTON_ENCRE, marginBottom: espace.sm, flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap',
          }}>
            {t('profil.modifier')}
          </Bouton>
        )}
      </div>

      {editing ? (
        <Pile espace="xl" style={{ padding: `${espace.lg}px ${MARGE}px 0` }}>
          <Texte variante="titre" as="h1" style={TITRE}>{t('profil.modifier')}</Texte>

          <Section titre={t('profil.mes_infos')}>
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
              min={aujourdhui}
              onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
            />
          </Section>

          <Section titre={t('profil.interets')} aide={t('profil.interets_visibles')}>
            <GrilleInterets codes={INTERETS} choisis={form.interests} onBasculer={toggleInteret} />
          </Section>

          <Section titre={t('profil.avec')}>
            <Pile direction="ligne" espace="sm" retour role="group" aria-label={t('profil.avec')}>
              {AVEC.map(a => (
                <PuceChoix key={a} actif={form.avec === a} emoji={emojiAvec(a)}
                           onClick={() => setForm(f => ({ ...f, avec: a }))}>
                  {libelleAvec(a)}
                </PuceChoix>
              ))}
            </Pile>
          </Section>

          <Section titre={t('profil.tranche_age')}>
            <Pile direction="ligne" espace="sm" retour role="group" aria-label={t('profil.tranche_age')}>
              {TRANCHES.map(v => (
                <PuceChoix key={v} actif={form.tranche_age === v}
                           onClick={() => setForm(f => ({ ...f, tranche_age: v }))}>
                  {v.replace('-', '–')}
                </PuceChoix>
              ))}
            </Pile>
          </Section>

          <Pile direction="ligne" espace="sm">
            <Bouton variante="secondaire" taille="lg" style={{ flex: 1, minWidth: 0, borderRadius: rayon.rond }} onClick={fermerEdition}>
              {t('commun.annuler')}
            </Bouton>
            <Bouton taille="lg" charge={saving} disabled={!form.pseudo.trim()} onClick={sauvegarder}
                    style={{ ...BOUTON_ENCRE, flex: 2, minWidth: 0 }}>
              {saving ? t('commun.enregistrement') : t('commun.enregistrer')}
            </Bouton>
          </Pile>
        </Pile>
      ) : (
        <>
          <div style={{ padding: `14px ${MARGE}px 0` }}>
            <Texte variante="titre" as="h1" style={TITRE}>{vacancier.pseudo}</Texte>
            {bio && (
              <Texte variante="corps" style={{ marginTop: 6, fontSize: 16, lineHeight: 1.4, color: couleur.texteMoyen }}>{bio}</Texte>
            )}
            {(vacancier.emplacement || depart) && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: `${espace.xs}px ${espace.lg}px`, marginTop: 10,
                fontSize: tailles.base + 0.5, color: couleur.texteDoux,
              }}>
                {vacancier.emplacement && (
                  <Meta icone="pin" couleurIcone={accent.texte}>{t('profil.emplacement')} {vacancier.emplacement}</Meta>
                )}
                {depart && (
                  <Meta icone="lune" couleurIcone={accent.texte}>
                    {t('profil.jusquau', {
                      date: new Date(depart + 'T12:00').toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }),
                    })}
                  </Meta>
                )}
              </div>
            )}
          </div>

          {/* Compteurs en ligne, à la façon d'un profil social. Les deux
              premiers mènent à la liste qu'ils comptent. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${espace.sm}px 26px`, padding: `${espace.lg}px ${MARGE}px 0` }}>
            <Compteur to="/groupes" valeur={stats.groupes} couleurValeur={accent.texte}
                      libelle={t(stats.groupes === 1 ? 'profil.nb_groupe' : 'profil.nb_groupes')} />
            <Compteur to="/agenda" valeur={stats.animations} couleurValeur={accent.texte}
                      libelle={t(stats.animations === 1 ? 'profil.nb_animation' : 'profil.nb_animations')} />
            {nuits !== null && (nuits === 0
              ? <Compteur valeur="🧳" libelle={t('profil.depart_aujourdhui')} />
              : <Compteur valeur={nuits} libelle={t(nuits === 1 ? 'profil.nb_nuit' : 'profil.nb_nuits')} />)}
          </div>

          <section style={{ padding: `${espace.xxl}px ${MARGE}px 0` }}>
            <Texte variante="sousTitre" as="h2" style={TITRE_SECTION}>{t('profil.interets')}</Texte>
            <Texte variante="doux" style={{ marginTop: 2, marginBottom: 14 }}>{t('profil.interets_visibles')}</Texte>
            <RondsInterets codes={interests} onAjouter={ouvrirEdition} libelle={t('profil.interets')} />
          </section>

          {/* Réglages : calmes, regroupés, chacun à un appui. */}
          <Pile espace="md" style={{ padding: `${espace.xxl}px ${espace.lg}px 0` }}>
            <Liste>
              <Rangee icone="globe" libelle={t('profil.langue')} valeur={langueActuelle?.label}
                      onClick={() => setFeuille('langue')} />
              <Rangee icone="interdit" libelle={t('moderation.bloques_titre')}
                      valeur={bloques === null ? '' : String(bloques.length)}
                      onClick={() => setFeuille('bloques')} />
              {/* L'entrée gérant n'existait que sur l'écran de recherche : une fois
                  le camping rejoint, Onboarding ne s'affiche plus et la console
                  devenait injoignable sans supprimer son compte. Un gérant est
                  d'abord un vacancier de son propre camping — il lui faut une
                  porte depuis l'intérieur. */}
              {isNative && (
                <Rangee icone="cle" libelle={t('profil.espace_gerant')} onClick={() => setAppMode('gerant')} />
              )}
            </Liste>

            <Liste>
              <Rangee icone="sortie" libelle={t('profil.deconnexion')} danger
                      onClick={() => setConfirmerDeconnexion(true)} />
            </Liste>

            {/* Se déconnecter et supprimer son compte ne sont pas la même chose,
                et rien ne doit laisser croire le contraire : le second est écrit
                en clair, séparé, et demande une confirmation. */}
            <Bouton variante="discret" pleineLargeur onClick={() => setConfirmerSuppression(true)}
                    style={{ color: couleur.danger, fontWeight: graisse.normal, fontSize: tailles.base }}>
              {t('profil.suppr_compte')}
            </Bouton>

            <Pile espace="xs" style={{ textAlign: 'center' }}>
              <Texte variante="micro">CampConnect — {camping?.nom}</Texte>
              {VERSION && <Texte variante="micro" style={{ opacity: 0.6 }}>{VERSION}</Texte>}
            </Pile>
          </Pile>
        </>
      )}

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

/** Carte qui empile des rangées, séparées d'un filet. */
function Liste({ children }) {
  return (
    <div style={{ background: couleur.surface, border: `1px solid ${couleur.bordure}`, borderRadius: 18, overflow: 'hidden' }}>
      {Children.toArray(children).filter(Boolean).map((enfant, i) => (
        <div key={i} style={{ borderTop: i ? `1px solid ${couleur.bordure}` : 'none' }}>{enfant}</div>
      ))}
    </div>
  )
}

/** Rangée de réglage : pictogramme, libellé, valeur actuelle, chevron. */
function Rangee({ emoji, icone, libelle, valeur, onClick, danger, actif }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={actif} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 56,
      padding: `${espace.sm}px ${espace.lg}px`, background: 'none', border: 'none',
      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: danger ? couleur.danger : couleur.texte,
    }}>
      <span aria-hidden="true" style={{
        width: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        color: danger ? couleur.danger : couleur.texteDoux,
      }}>
        {icone ? <Icone nom={icone} taille={22} /> : emoji}
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
    <Puce actif={actif} onClick={onClick} style={{ maxWidth: '100%', minHeight: 44 }}>
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
      {actif && <Icone nom="coche" taille={15} epaisseur={2.4} />}
    </Puce>
  )
}

/** Une partie du mode édition : un titre, une aide éventuelle, ses champs.
 *  Pas de carte autour : l'espace et le titre suffisent à séparer. */
function Section({ titre, aide, children }) {
  return (
    <section>
      <Texte variante="sousTitre" as="h2" style={TITRE_SECTION}>{titre}</Texte>
      {aide && <Texte variante="doux" style={{ marginTop: 2 }}>{aide}</Texte>}
      <Pile espace="lg" style={{ marginTop: 14 }}>{children}</Pile>
    </section>
  )
}

/** Emplacement, date de départ : une icône à la couleur du camping, un texte. */
function Meta({ icone, couleurIcone, children }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
      <Icone nom={icone} taille={16} epaisseur={2} style={{ color: couleurIcone }} />
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
    </span>
  )
}

/**
 * Un compteur : le nombre, puis ce qu'il compte. Avec `to`, c'est un lien.
 * null pendant le chargement : un « 0 » affiché une demi-seconde invitait à
 * rejoindre un groupe que l'on avait déjà rejoint.
 */
function Compteur({ to, valeur, libelle, couleurValeur = couleur.texte }) {
  const Balise = to ? Link : 'div'
  return (
    <Balise to={to} style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 44, minWidth: 44,
      textDecoration: 'none', color: couleur.texte,
    }}>
      <span style={{ fontSize: 22, fontWeight: graisse.affiche, letterSpacing: '-0.5px', lineHeight: 1.1, color: couleurValeur }}>
        {valeur ?? '–'}
      </span>
      <span style={{ marginTop: 2, fontSize: tailles.base - 0.5, color: couleur.texteDoux }}>{libelle}</span>
    </Balise>
  )
}
