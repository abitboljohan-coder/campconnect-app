import { useId } from 'react'
import { t } from '../i18n'
import { emojiInteret, libelleInteret } from '../lib/profil'
import { accentCourant, teintesPaysage } from '../lib/paysage'
import { Icone, couleur, espace, graisse, texte as tailles } from '../design'

/**
 * « Carte postale » : le paysage, l'avatar et les ronds de centres d'intérêt
 * que partagent le profil et la mini-fiche d'un autre vacancier. Un seul
 * dessin, pour que l'on reconnaisse au premier coup d'œil qu'il s'agit d'une
 * personne, et que chaque camping s'y retrouve à ses couleurs.
 */

/**
 * Paysage aux couleurs du camping. Aucun texte n'est posé dessus : il reste
 * lisible quel que soit l'accent. `fond` est la couleur sur laquelle il se
 * fond en bas — celle de la page, ou le blanc d'une feuille.
 * `compact` coupe le haut du ciel, pour la mini-fiche.
 */
export function Paysage({ fond = couleur.fondClair, compact = false }) {
  const id = useId().replace(/:/g, '')
  const c = teintesPaysage(accentCourant())
  const [haut, hauteur] = compact ? [44, 152] : [0, 196]
  return (
    <svg viewBox={`0 ${haut} 402 ${hauteur}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true"
         style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `402 / ${hauteur}`, maxHeight: compact ? 190 : 260 }}>
      <defs>
        <linearGradient id={`ciel${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.cielHaut} />
          <stop offset="1" stopColor={c.cielBas} />
        </linearGradient>
      </defs>
      <rect y={haut} width="402" height={hauteur} fill={`url(#ciel${id})`} />
      <circle cx="318" cy="78" r="56" fill={c.halo} opacity=".45" />
      <circle cx="318" cy="78" r="31" fill={c.soleil} />
      <g fill="none" stroke={c.oiseaux} strokeWidth="1.6" strokeLinecap="round" opacity=".5">
        <path d="M92 66q5-5 10 0q5-5 10 0" /><path d="M122 54q4-4 8 0q4-4 8 0" />
      </g>
      <path d="M0 118 C60 92 110 96 168 112 S280 90 402 106 V196 H0Z" fill={c.lointain} />
      <path d="M0 138 C70 128 140 140 210 134 S330 126 402 134 V196 H0Z" fill={c.colline} />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5">
        <path d="M150 150q10-4 20 0" /><path d="M250 146q12-4 24 0" /><path d="M320 156q8-3 16 0" />
      </g>
      <path d="M0 164 C80 154 170 166 260 160 S360 150 402 156 V196 H0Z" fill={c.avant} />
      <g fill={c.foret}>
        <path d="M26 166 L44 112 L62 166Z" /><path d="M50 168 L74 92 L98 168Z" /><path d="M90 170 L106 128 L122 170Z" />
        <rect x="72" y="166" width="4" height="10" /><rect x="42" y="164" width="4" height="10" />
      </g>
      {/* La tente, et une lanterne allumée : il y a quelqu'un. */}
      <circle cx="334" cy="166" r="14" fill={c.lueur} opacity=".28" />
      <path d="M300 174 L334 128 L368 174Z" fill={c.tente} />
      <path d="M334 128 L368 174 L346 174Z" fill={c.tenteOmbre} />
      <path d="M334 150 L326 174 L342 174Z" fill={c.lueur} />
      <path d="M0 182 C100 176 220 186 402 178 V196 H0Z" fill={fond} />
    </svg>
  )
}

/** Avatar qui chevauche le paysage. */
export function AvatarPostale({ emoji, petit = false, fond = couleur.fondClair }) {
  const c = teintesPaysage(accentCourant())
  return (
    <div aria-hidden="true" style={{
      width: petit ? 88 : 'clamp(84px, 27vw, 112px)', aspectRatio: '1', flexShrink: 0,
      borderRadius: '50%', background: couleur.surface, border: `5px solid ${fond}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: petit ? 44 : 'clamp(44px, 14vw, 58px)', lineHeight: 1,
      boxShadow: `0 8px 22px ${c.avant}40`,
    }}>
      {emoji || '🏕️'}
    </div>
  )
}

const TAILLE = 72

/** Un rond « story » : anneau aux couleurs du camping, emoji au centre. */
function Rond({ code, eteint = false, coche = false, fond, c }) {
  return (
    <span style={{
      position: 'relative', display: 'block', width: TAILLE, height: TAILLE, borderRadius: '50%',
      padding: eteint ? 1.5 : 3, flexShrink: 0,
      background: eteint ? couleur.bordure : `conic-gradient(from 200deg, ${c.anneau}, ${c.anneauClair}, ${c.anneau})`,
    }}>
      <span aria-hidden="true" style={{
        width: '100%', height: '100%', borderRadius: '50%',
        border: `${eteint ? 4.5 : 3}px solid ${fond}`,
        background: eteint ? couleur.surface : c.disque,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, lineHeight: 1,
      }}>
        {emojiInteret(code) || '✨'}
      </span>
      {coche && (
        <span aria-hidden="true" style={{
          position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: '50%',
          background: c.texte, color: '#fff', border: `2px solid ${fond}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icone nom="coche" taille={13} epaisseur={3} />
        </span>
      )}
    </span>
  )
}

const libelleRond = {
  width: TAILLE + 8, fontSize: tailles.petit, fontWeight: graisse.fort, color: couleur.texteMoyen,
  lineHeight: 1.25, textAlign: 'center', overflowWrap: 'anywhere',
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
}

/**
 * Centres d'intérêt en ronds défilants, comme des « stories ».
 *
 * Avec `communs`, ceux que l'on partage sont cochés et les autres s'effacent :
 * l'œil va droit à ce qui donne envie de se parler. Sans centre d'intérêt et
 * avec `onAjouter`, un rond « + » invite à en choisir.
 */
export function RondsInterets({ codes, communs, onAjouter, fond = couleur.fondClair, libelle }) {
  const c = teintesPaysage(accentCourant())

  if (!codes.length && onAjouter) {
    return (
      <button type="button" onClick={onAjouter} style={{
        display: 'flex', alignItems: 'center', gap: espace.lg, width: '100%', minHeight: 44,
        padding: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
        color: couleur.texte, fontFamily: 'inherit',
      }}>
        <span aria-hidden="true" style={{
          width: TAILLE, height: TAILLE, borderRadius: '50%', flexShrink: 0,
          border: `2px dashed ${c.anneauClair}`, color: c.texte,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icone nom="plus" taille={28} epaisseur={2} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: tailles.moyen, fontWeight: graisse.fort, lineHeight: 1.3 }}>
            {t('profil.interets_vide')}
          </span>
          <span style={{ display: 'block', marginTop: 3, fontSize: tailles.petit + 1, color: couleur.texteDoux, lineHeight: 1.4 }}>
            {t('profil.interets_vide_aide')}
          </span>
        </span>
      </button>
    )
  }

  return (
    // Le ruban déborde jusqu'aux bords de l'écran : on devine qu'il défile.
    <ul aria-label={libelle} className="cc-defile-x" style={{
      display: 'flex', gap: espace.md, alignItems: 'flex-start', listStyle: 'none',
      margin: `0 -${espace.lg + 4}px`, padding: `2px ${espace.lg + 4}px 4px`,
      overflowX: 'auto', scrollSnapType: 'x proximity', scrollPaddingLeft: espace.lg + 4,
    }}>
      {codes.map(code => {
        const commun = communs?.has(code)
        return (
          <li key={code} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            scrollSnapAlign: 'start',
          }}>
            <Rond code={code} eteint={communs && !commun} coche={commun} fond={fond} c={c} />
            <span style={libelleRond}>
              {libelleInteret(code)}
              {commun && <span className="cc-sr"> · {t('fiche.en_commun')}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Les mêmes ronds, à choisir : le mode édition du profil. */
export function GrilleInterets({ codes, choisis, onBasculer, fond = couleur.fondClair }) {
  const c = teintesPaysage(accentCourant())
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${TAILLE + 8}px, 1fr))`,
      gap: `${espace.lg}px ${espace.xs}px`,
    }}>
      {codes.map(code => {
        const actif = choisis.includes(code)
        return (
          <button key={code} type="button" aria-pressed={actif} onClick={() => onBasculer(code)} style={{
            minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Rond code={code} eteint={!actif} coche={actif} fond={fond} c={c} />
            <span style={{ ...libelleRond, color: actif ? couleur.texte : couleur.texteDoux }}>
              {libelleInteret(code)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
