import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { t } from '../i18n'
import Sheet from './Sheet'
import MenuModeration from './MenuModeration'
import { AvatarPostale, Paysage, RondsInterets } from './CartePostale'
import { estBloque } from '../lib/moderation'
import { COLONNES_FICHE, codesInterets, emojiInteret, libelleInteret, phraseAvec, phraseCommuns, pointsCommuns } from '../lib/profil'
import { accentCourant, teintesPaysage } from '../lib/paysage'
import { Bouton, Icone, Pile, Texte, couleur, espace, graisse, rayon, texte as tailles } from '../design'

/**
 * Mini-fiche d'un autre vacancier, ouverte d'un appui sur son avatar ou son
 * pseudo (chat, statuts, annonces). Son but : donner une raison de se parler
 * — d'abord ce que l'on a en commun.
 *
 * `apercu` (pseudo, avatar) vient de l'écran appelant : la fiche s'affiche
 * aussitôt, les centres d'intérêt arrivent ensuite. `contexte` est le contenu
 * d'où l'on vient (message, statut, annonce) : c'est lui que « Signaler »
 * transmet au gérant, qui sait déjà le traiter.
 *
 * Sa propre fiche n'existe pas : on y retrouve son Profil.
 */
export default function MiniFiche({ id, apercu, contexte, camping, vacancier, onClose, onBloque }) {
  const navigate = useNavigate()
  const mien = id === vacancier.id
  const bloque = estBloque(vacancier.id, id)
  const [profil, setProfil] = useState(null)
  const [moderation, setModeration] = useState(null)   // 'motif' | 'bloquer'

  useEffect(() => {
    if (!mien) return
    onClose?.()
    navigate('/profil')
  }, [mien]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mien || bloque) return
    let actif = true
    // Le filtre sur le camping double la règle d'accès de la base : un
    // identifiant venu d'ailleurs ne doit rien ramener.
    supabase.from('vacanciers').select(COLONNES_FICHE)
      .eq('id', id).eq('camping_id', camping.id).maybeSingle()
      .then(({ data }) => { if (actif && data) setProfil(data) })
    return () => { actif = false }
  }, [id, camping.id, mien, bloque])

  if (mien) return null

  if (moderation) {
    return (
      <MenuModeration cible={contexte} camping={camping} vacancier={vacancier}
                      etapeInitiale={moderation} onClose={onClose} onBloque={onBloque} />
    )
  }

  const c = teintesPaysage(accentCourant())
  const pseudo = profil?.pseudo || apercu?.pseudo || t('moderation.ce_vacancier')

  // Bloqué : rien de plus que ce que montre déjà le reste de l'application.
  if (bloque) {
    return (
      <Sheet onClose={onClose}>
        <Pile espace="lg">
          <Pile espace="xs">
            <Texte variante="sousTitre" as="h2">{t('fiche.bloque')}</Texte>
            <Texte variante="doux">{t('fiche.bloque_aide')}</Texte>
          </Pile>
          <Bouton variante="secondaire" taille="lg" pleineLargeur onClick={onClose}>{t('commun.fermer')}</Bouton>
        </Pile>
      </Sheet>
    )
  }

  const siens = codesInterets(profil?.interests)
  const miens = codesInterets(vacancier.interests)
  const communs = pointsCommuns(miens, siens)
  const ensembleCommuns = new Set(communs)
  // Ce que l'on partage d'abord, le reste ensuite.
  const ordonnes = [...communs, ...siens.filter(x => !ensembleCommuns.has(x))]
  const bio = profil?.avec && phraseAvec(profil.avec)

  return (
    <Sheet onClose={onClose} entete={<Paysage compact fond={couleur.surface} />}>
      <div style={{ marginTop: -50, position: 'relative' }}>
        <AvatarPostale emoji={profil?.avatar_emoji || apercu?.avatar_emoji} petit fond={couleur.surface} />
      </div>

      <Texte variante="titre" as="h2" style={{
        marginTop: espace.md, fontSize: 26, letterSpacing: '-0.8px', lineHeight: 1.1, overflowWrap: 'anywhere',
      }}>
        {pseudo}
      </Texte>
      {bio && (
        <Texte variante="corps" style={{ marginTop: 4, fontSize: tailles.moyen + 1, color: couleur.texteMoyen }}>{bio}</Texte>
      )}

      {/* Les points communs : la seule chose mise en avant. */}
      {communs.length > 0 && (
        <div style={{
          marginTop: espace.lg, padding: `${espace.md}px 14px`, borderRadius: rayon.lg,
          background: `${c.avant}14`, display: 'flex', alignItems: 'center', gap: espace.md,
        }}>
          <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
            {communs.slice(0, 3).map((code, i) => (
              <span key={code} style={{
                width: 34, height: 34, borderRadius: '50%', marginLeft: i ? -10 : 0,
                background: couleur.surface, border: `2px solid ${c.avant}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              }}>
                {emojiInteret(code) || '✨'}
              </span>
            ))}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: tailles.moyen, fontWeight: graisse.titre, color: c.texte, lineHeight: 1.3 }}>
              {phraseCommuns(communs)}
            </span>
            {communs.length > 1 && (
              <span style={{ display: 'block', marginTop: 2, fontSize: tailles.petit, color: couleur.texteMoyen, lineHeight: 1.4 }}>
                {communs.map(libelleInteret).join(' · ')}
              </span>
            )}
          </span>
        </div>
      )}

      {profil && (
        <section style={{ marginTop: espace.xl }}>
          {ordonnes.length > 0 ? (
            <>
              <Texte variante="sousTitre" as="h3" style={{ fontSize: tailles.moyen + 1, fontWeight: graisse.titre, marginBottom: espace.md }}>
                {t('fiche.ses_interets')}
              </Texte>
              <RondsInterets codes={ordonnes} communs={miens.length ? ensembleCommuns : undefined}
                             fond={couleur.surface} libelle={t('fiche.ses_interets')} />
            </>
          ) : (
            <Texte variante="doux" style={{ fontSize: tailles.base }}>{t('fiche.vide', { pseudo })}</Texte>
          )}
          {/* Sans centres d'intérêt à soi, aucun point commun possible : la
              fiche le dit et mène là où on les choisit. */}
          {miens.length === 0 && siens.length > 0 && (
            <button type="button" onClick={() => { onClose?.(); navigate('/profil') }} style={{
              marginTop: espace.md, minHeight: 44, padding: 0, background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: tailles.base, fontWeight: graisse.fort, color: c.texte, textAlign: 'left',
            }}>
              {t('fiche.mes_vides')}
              <Icone nom="chevron" taille={16} />
            </button>
          )}
        </section>
      )}

      {/* Signaler et bloquer : présents, mais sans rien imposer. */}
      {contexte && (
        <div style={{
          marginTop: espace.xl, paddingTop: espace.sm, borderTop: `1px solid ${couleur.bordure}`,
          display: 'flex', gap: espace.lg,
        }}>
          <ActionDiscrete icone="drapeau" onClick={() => setModeration('motif')}>{t('fiche.signaler')}</ActionDiscrete>
          <ActionDiscrete icone="interdit" onClick={() => setModeration('bloquer')}>{t('fiche.bloquer')}</ActionDiscrete>
        </div>
      )}
    </Sheet>
  )
}

function ActionDiscrete({ icone, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      minHeight: 44, padding: `0 ${espace.xs}px`, background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      fontSize: tailles.base, fontWeight: graisse.normal, color: couleur.texteDoux,
    }}>
      <Icone nom={icone} taille={17} />
      {children}
    </button>
  )
}
