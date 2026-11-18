import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, todayISO } from '../../supabase'
import { estPresent } from '../../lib/presence'
import { lireVacanciersDuCamping } from '../../lib/vacanciers'
import { toast } from '../../toast'
import StatCard from '../components/StatCard'
import { estActuel } from '../../lib/groupes'
import { lienRejoindre } from '../lib/liens'
import { lireAccesCamping, msAvantNouveauCode } from '../lib/accesCamping'
import { remplissage, animationsDuJour } from '../lib/animations'
import { Bloc, EnTete } from '../components/Bloc'
import { useEtroit } from '../lib/useEtroit'
import { Texte, Pile, Squelette, Icone, espace, graisse, rayon } from '../../design'
import { jetons, barre, bouton, titreSection, couleurCampingParDefaut } from '../theme'

/**
 * Guide de démarrage.
 *
 * Il occupait tout le premier écran même à trois étapes sur quatre : les
 * étapes finies restaient affichées en pleine hauteur, barrées, poussant hors
 * de vue les chiffres du jour. Ce qui reste à faire mérite de la place ; ce
 * qui est fait mérite une ligne.
 */
function GuideDemarrage({ camping, stats }) {
  const perimetre = camping?.carte_config?.perimeter || []
  const pins      = camping?.carte_config?.pins || []

  const etapes = [
    { fait: !!camping?.logo_url || (!!camping?.couleur_principale && camping.couleur_principale !== couleurCampingParDefaut),
      label: "Personnalisez l'apparence", detail: 'Logo et couleurs de votre camping', vers: '/admin/apparence', icone: 'apparence' },
    { fait: perimetre.length >= 3,
      label: 'Tracez le contour du camping', detail: 'Le périmètre sert à situer les vacanciers', vers: '/admin/carte', icone: 'carte' },
    { fait: pins.length > 0,
      label: "Ajoutez vos points d'intérêt", detail: 'Piscine, sanitaires, réception…', vers: '/admin/carte', icone: 'carte' },
    { fait: stats.animations > 0,
      label: 'Créez votre première animation', detail: "Elle apparaîtra dans l'agenda des vacanciers", vers: '/admin/animations', icone: 'agenda' },
    // Tant que le livret est vide, les vacanciers lisent des exemples (Wi-Fi,
    // horaires, numéro de réception) : rien n'invitait à les remplacer.
    { fait: Array.isArray(camping?.infos) && camping.infos.length > 0,
      label: 'Remplissez vos infos pratiques', detail: 'Wi-Fi, horaires, numéros utiles…', vers: '/admin/infos', icone: 'infos' },
  ]

  const faites  = etapes.filter(e => e.fait).length
  const restent = etapes.filter(e => !e.fait)
  if (restent.length === 0) return null

  return (
    <Bloc style={{ border: `1px solid ${jetons.bordure}`, borderRadius: rayon.lg }}>
      <Pile direction="ligne" espace="md" justifier="space-between" aligner="center">
        <Texte variante="sousTitre" as="h2" style={{ fontSize: 16 }}>
          Configurer votre camping
        </Texte>
        <Texte variante="doux" as="span"
               role="progressbar" aria-valuenow={faites} aria-valuemin={0} aria-valuemax={etapes.length}
               aria-label="Configuration du camping"
               style={{ flexShrink: 0, fontWeight: graisse.fort, color: jetons.marqueTexte }}>
          {faites} sur {etapes.length}
        </Texte>
      </Pile>

      {/* Une barre plutôt qu'un grand pourcentage : la progression se lit d'un
          coup d'œil sans occuper le tiers du bloc. */}
      <div aria-hidden="true" style={{
        height: 4, borderRadius: 999, background: jetons.fond, overflow: 'hidden',
      }}>
        <div style={{
          width: `${(faites / etapes.length) * 100}%`, height: '100%',
          background: jetons.marque, borderRadius: 999, transition: 'width 0.3s',
        }} />
      </div>

      <Pile espace="sm">
        {restent.map((e, i) => (
          <Link key={i} to={e.vers} style={{
            display: 'flex', alignItems: 'center', gap: espace.md,
            padding: `12px ${espace.md}px`, minHeight: 56,
            background: jetons.surface, borderRadius: rayon.md,
            border: `1px solid ${jetons.bordure}`, textDecoration: 'none',
          }}>
            <Icone nom={e.icone} taille={20} style={{ color: jetons.marqueTexte }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.texte }}>
                {e.label}
              </Texte>
              <Texte variante="micro" style={{ marginTop: 1 }}>{e.detail}</Texte>
            </div>
            <Icone nom="chevron" taille={17} style={{ color: jetons.texteDoux }} />
          </Link>
        ))}
      </Pile>

      {faites > 0 && (
        <Texte variante="micro" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icone nom="coche" taille={14} style={{ color: jetons.succes }} />
          {faites === 1 ? '1 étape déjà faite' : `${faites} étapes déjà faites`}
        </Texte>
      )}
    </Bloc>
  )
}

export default function Overview({ camping }) {
  const etroit = useEtroit()
  const [stats, setStats]           = useState({ vacanciers: 0, groupes: 0, inscriptions: 0, animations: 0, signalements: 0 })
  const [rempli, setRempli]         = useState({ places: 0, occupees: 0, taux: 0 })
  const [departs, setDeparts]       = useState({ aujourdhui: [], semaine: 0 })
  const [duJour, setDuJour]         = useState({ liste: [], maintenant: 0 })   // animations d'aujourd'hui, avec leurs inscrits
  const [recentGroupes, setRecentGroupes]       = useState([])
  const [recentInscriptions, setRecentInscriptions] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    load()

    // Rafraîchissement automatique toutes les 30s
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [camping.id])

  async function load() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const demainStart = new Date(todayStart)
    demainStart.setDate(demainStart.getDate() + 1)

    const today = todayISO()
    const in7j = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const [
      { data: vacs },
      { data: grpActifs },
      { data: anims },
      { data: grps },
      { count: animTotal },
      { count: sigCount },
      { data: animsJour },
    ] = await Promise.all([
      // Emplacements et dates de départ : par vacanciers_du_camping, réservée
      // aux gérants du camping (la table ne les livrera plus directement).
      lireVacanciersDuCamping(camping.id),
      // Personne ne ferme un groupe : compter la colonne « actif » additionnait
      // les apéros de la semaine dernière. Même règle que côté vacancier.
      supabase.from('groupes').select('heure, created_at').eq('camping_id', camping.id).eq('actif', true),
      supabase.from('animations').select('id, titre, places_max, debut').eq('camping_id', camping.id).eq('publiee', true),
      supabase.from('groupes').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('animations').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id),
      supabase.from('signalements').select('id', { count: 'exact', head: true }).eq('camping_id', camping.id).eq('statut', 'nouveau'),
      // La journée du gérant : les animations d'aujourd'hui, brouillons compris.
      supabase.from('animations').select('id, titre, emoji, lieu, debut, places_max, publiee')
        .eq('camping_id', camping.id)
        .gte('debut', todayStart.toISOString()).lt('debut', demainStart.toISOString())
        .order('debut'),
    ])
    const grpCount = (grpActifs || []).filter(g => estActuel(g)).length
    const vacCount = vacs.filter(v => estPresent(v)).length
    const departsAuj = vacs.filter(v => v.date_depart === today)
      .sort((a, b) => (a.pseudo || '').localeCompare(b.pseudo || ''))
    const departsSem = vacs.filter(v => v.date_depart >= today && v.date_depart <= in7j).length
    const vacParId = new Map(vacs.map(v => [v.id, v]))

    const animIds = (anims || []).map(a => a.id)

    let inscCount = 0
    let detail = { places: 0, occupees: 0, taux: 0 }
    let recentInscs = []
    let allInscs = []

    if (animIds.length > 0) {
      const [{ count: iCount }, { data: toutes }, { data: recentI }] = await Promise.all([
        supabase.from('inscriptions').select('*', { count: 'exact', head: true })
          .in('animation_id', animIds)
          .gte('created_at', todayStart.toISOString()),
        supabase.from('inscriptions').select('animation_id').in('animation_id', animIds),
        supabase.from('inscriptions')
          .select('*, animations(titre)')
          .in('animation_id', animIds)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      inscCount = iCount || 0
      allInscs = toutes || []
      recentInscs = (recentI || []).map(i => ({ ...i, vacanciers: vacParId.get(i.vacancier_id) || null }))

      detail = remplissage(anims, allInscs)
    }

    // Les brouillons n'ont pas d'inscrits : on ne compte que sur les publiées.
    const nbParAnim = {}
    for (const i of allInscs) nbParAnim[i.animation_id] = (nbParAnim[i.animation_id] || 0) + 1

    setStats({ vacanciers: vacCount || 0, groupes: grpCount, inscriptions: inscCount, animations: animTotal || 0, signalements: sigCount || 0 })
    setRempli(detail)
    setDeparts({ aujourdhui: departsAuj, semaine: departsSem })
    // L'heure de la lecture : passée, prochaine et à venir se recalculent à
    // chaque rafraîchissement (30 s), pas à chaque rendu.
    setDuJour({ liste: animationsDuJour(animsJour).map(a => ({ ...a, inscrits: nbParAnim[a.id] || 0 })), maintenant: Date.now() })
    setRecentGroupes(grps || [])
    setRecentInscriptions(recentInscs)
    setLoading(false)
  }

  const aTraiter = (
    <Section titre="À traiter">
      {stats.signalements > 0 ? (
        // Ce qui attend le gérant passe avant tout le reste : un signalement
        // ne se voyait qu'en allant le chercher dans sa page.
        <Link to="/admin/signalements" style={{ ...carte, ...ligneCliquable }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: jetons.dangerFond, color: jetons.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: graisse.affiche, fontVariantNumeric: 'tabular-nums',
          }}>
            {stats.signalements}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={titreLigne}>
              {stats.signalements === 1 ? 'Signalement à traiter' : 'Signalements à traiter'}
            </span>
            <span style={sousLigne}>En attente de votre décision</span>
          </span>
          <Icone nom="chevron" taille={20} style={{ color: jetons.texteDoux }} />
        </Link>
      ) : (
        <div style={{ ...carte, ...ligneCliquable, cursor: 'default' }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: jetons.surfaceDouce, color: jetons.succes,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icone nom="coche" taille={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={titreLigne}>Rien à traiter</span>
            <span style={sousLigne}>Aucun signalement en attente</span>
          </span>
        </div>
      )}
      {/* Masqué dès que toutes les étapes sont faites. */}
      <GuideDemarrage camping={camping} stats={stats} />
    </Section>
  )

  const aujourdhui = (
    <Section titre="Aujourd’hui" lien={{ vers: '/admin/animations', texte: 'Agenda' }}>
      {loading ? (
        <div style={{ ...carte, padding: espace.lg }}><Squelette lignes={3} hauteur={44} libelle="Chargement…" /></div>
      ) : (
        <Frise animations={duJour.liste} maintenant={duJour.maintenant} />
      )}
    </Section>
  )

  const chiffres = (
    <Section titre="Chiffres du jour">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <StatCard compact valeur={stats.vacanciers}   libelle="Vacanciers présents" sous="Actuellement au camping" />
        <StatCard compact valeur={departs.semaine}    libelle="Départs sous 7 jours"
                  sous={departs.aujourdhui.length ? `dont ${departs.aujourdhui.length} aujourd'hui` : "Aucun aujourd'hui"} />
        <StatCard compact valeur={stats.groupes}      libelle="Groupes actifs" sous="En ce moment" />
        <StatCard compact valeur={stats.inscriptions} libelle="Inscriptions du jour" sous="Depuis minuit" />
        {/* « 0 % » et une barre vide se lisaient comme une panne : sans
            animation à places limitées, on le dit ; sinon, places prises
            sur places offertes. */}
        <StatCard compact style={{ gridColumn: '1 / -1' }}
                  libelle="Remplissage des animations à places limitées"
                  valeur={rempli.places === 0 ? '—' : `${rempli.occupees} / ${rempli.places}`}
                  sous={rempli.places === 0
                    ? 'Aucune animation à places limitées à venir'
                    : `places réservées · ${rempli.taux} %`}
                  enfant={rempli.occupees > 0 && (
                    <div aria-hidden="true" style={{ height: 4, borderRadius: 999, background: jetons.surfaceDouce, overflow: 'hidden', margin: '6px 0' }}>
                      <div style={{ width: `${Math.min(100, rempli.taux)}%`, height: '100%', background: jetons.accent }} />
                    </div>
                  )} />
      </div>
    </Section>
  )

  const departsDuJour = departs.aujourdhui.length > 0 && (
    <Section titre="Départs aujourd’hui">
      <div style={carte}>
        {departs.aujourdhui.map((v, idx) => (
          <Ligne key={idx} dernier={idx === departs.aujourdhui.length - 1}
                 pastille={<Pastille rond>{v.avatar_emoji || '🙂'}</Pastille>}
                 titre={v.pseudo} sous={v.emplacement ? `Emplacement ${v.emplacement}` : null} />
        ))}
      </div>
    </Section>
  )

  const inscriptions = (
    <Section titre="Dernières inscriptions">
      <div style={carte}>
        {loading ? (
          <div style={{ padding: espace.lg }}><Squelette lignes={2} hauteur={44} libelle="Chargement…" /></div>
        ) : recentInscriptions.length === 0 ? (
          <ListeVide texte="Aucune inscription pour le moment." />
        ) : recentInscriptions.map((ins, idx) => (
          <Ligne key={idx} dernier={idx === recentInscriptions.length - 1}
                 pastille={<Pastille rond lettre>{ins.vacanciers?.pseudo?.[0]?.toUpperCase() || '?'}</Pastille>}
                 titre={ins.vacanciers?.pseudo || '—'} sous={ins.animations?.titre || '—'}
                 heure={new Date(ins.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
        ))}
      </div>
    </Section>
  )

  const groupes = (
    <Section titre="Derniers groupes créés">
      <div style={carte}>
        {loading ? (
          <div style={{ padding: espace.lg }}><Squelette lignes={3} hauteur={44} libelle="Chargement…" /></div>
        ) : recentGroupes.length === 0 ? (
          <ListeVide texte="Aucun groupe pour le moment." />
        ) : recentGroupes.map((g, idx) => (
          <Ligne key={g.id} dernier={idx === recentGroupes.length - 1}
                 pastille={<Pastille>{g.emoji || '👥'}</Pastille>}
                 titre={g.titre} sous={g.lieu}
                 heure={new Date(g.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
        ))}
      </div>
    </Section>
  )

  const code = <AccessCodeCard camping={camping} grand={!etroit} />

  // Au téléphone, une seule colonne dans l'ordre de la journée ; à l'écran,
  // la journée à gauche (code, frise) et ce qui se surveille à droite.
  if (etroit) {
    return (
      <Pile espace="xl">
        {code}
        {aTraiter}
        {aujourdhui}
        {chiffres}
        {departsDuJour}
        {inscriptions}
        {groupes}
      </Pile>
    )
  }

  return (
    <Pile espace="xl">
      <EnTete
        titre="Bonjour"
        sous={`${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${camping.nom}`}
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: espace.xl, alignItems: 'start',
      }}>
        <Pile espace="xl">{code}{aujourdhui}</Pile>
        <Pile espace="xl">{aTraiter}{chiffres}{departsDuJour}{inscriptions}{groupes}</Pile>
      </div>
    </Pile>
  )
}

// ─── Briques de l'accueil ──────────────────────────────────────────────────

const carte = { background: jetons.surface, borderRadius: rayon.lg, overflow: 'hidden' }
const ligneCliquable = {
  display: 'flex', alignItems: 'center', gap: espace.md + 2,
  padding: `14px ${espace.lg}px`, minHeight: 72, textDecoration: 'none', color: jetons.texte,
}
const titreLigne = { display: 'block', fontSize: 16, fontWeight: 600, color: jetons.texte, lineHeight: 1.3 }
const sousLigne = { display: 'block', fontSize: 14, color: jetons.texteDoux, marginTop: 2, lineHeight: 1.35 }

/** Titre de section, avec un lien à droite si besoin. */
function Section({ titre, lien, children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: espace.md, margin: `0 2px ${espace.md}px` }}>
        <h2 style={titreSection}>{titre}</h2>
        {lien && (
          <Link to={lien.vers} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, minHeight: 44, padding: '0 4px',
            fontSize: 14.5, fontWeight: 600, color: jetons.texteMoyen, textDecoration: 'none',
          }}>
            {lien.texte} <Icone nom="chevron" taille={16} />
          </Link>
        )}
      </div>
      <Pile espace="md">{children}</Pile>
    </section>
  )
}

function Pastille({ rond = false, lettre = false, children }) {
  return (
    <span aria-hidden="true" style={{
      width: 38, height: 38, borderRadius: rond ? rayon.rond : 10, flexShrink: 0,
      background: jetons.surfaceDouce, color: jetons.texteMoyen,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: lettre ? 15 : 19, fontWeight: graisse.titre,
    }}>
      {children}
    </span>
  )
}

function Ligne({ pastille, titre, sous, heure, dernier }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: espace.md, minHeight: 64,
      padding: `10px ${espace.lg}px`, borderBottom: dernier ? 'none' : `1px solid ${jetons.bordure}`,
    }}>
      {pastille}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...titreLigne, fontSize: 15.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titre}</div>
        {sous && <div style={{ ...sousLigne, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sous}</div>}
      </div>
      {heure && <span style={{ fontSize: 14, color: jetons.texteDoux, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{heure}</span>}
    </div>
  )
}

function ListeVide({ texte }) {
  return <p style={{ margin: 0, padding: `20px ${espace.lg}px`, fontSize: 14.5, color: jetons.texteDoux }}>{texte}</p>
}

/**
 * La journée en frise : passées en retrait, la prochaine marquée, les autres
 * à la suite. Le gérant voit d'un coup d'œil ce qui se passe et quand.
 */
function Frise({ animations, maintenant }) {
  if (animations.length === 0) {
    return (
      <div style={{ ...carte, padding: `20px ${espace.lg}px` }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: jetons.texte }}>Aucune animation aujourd’hui</p>
        <p style={{ margin: '4px 0 12px', fontSize: 14, color: jetons.texteDoux }}>
          Les animations du jour s’affichent ici, dans l’ordre des horaires.
        </p>
        <Link to="/admin/animations" style={bouton.secondaire}>
          <Icone nom="agenda" taille={18} /> Ouvrir l’agenda
        </Link>
      </div>
    )
  }
  const prochaine = animations.findIndex(a => new Date(a.debut).getTime() >= maintenant)
  return (
    <ol style={{ ...carte, listStyle: 'none', margin: 0, padding: `6px ${espace.lg}px` }}>
      {animations.map((a, i) => {
        const passee = new Date(a.debut).getTime() < maintenant
        const estProchaine = i === prochaine
        const premier = i === 0
        const dernier = i === animations.length - 1
        const heure = new Date(a.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const inscrits = `${a.inscrits}${a.places_max > 0 ? `/${a.places_max}` : ''} inscrit${a.inscrits > 1 ? 's' : ''}`
        return (
          <li key={a.id} style={{ display: 'grid', gridTemplateColumns: '50px 20px minmax(0, 1fr)', alignItems: 'stretch' }}>
            <span style={{
              paddingTop: 13, fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: passee ? jetons.texteDoux : jetons.texte,
            }}>
              {heure}
            </span>
            <span aria-hidden="true" style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 9, width: 2, background: jetons.bordure,
                top: premier ? 20 : 0, bottom: dernier ? 'calc(100% - 20px)' : 0,
              }} />
              <span style={{
                position: 'absolute', left: 4, top: 15, width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box',
                background: estProchaine ? jetons.texte : jetons.surface,
                border: `2px solid ${estProchaine ? jetons.texte : '#C9CAC5'}`,
                boxShadow: estProchaine ? `0 0 0 4px ${jetons.surfaceDouce}` : 'none',
              }} />
            </span>
            <div style={{ padding: '11px 0 11px 6px', borderBottom: dernier ? 'none' : `1px solid ${jetons.bordure}`, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: passee ? jetons.texteDoux : jetons.texte, lineHeight: 1.3 }}>
                  {a.titre}
                </span>
                {estProchaine && <Etiquette>Prochaine</Etiquette>}
                {!a.publiee && <Etiquette neutre>Brouillon</Etiquette>}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2, fontSize: 14, color: jetons.texteDoux }}>
                {a.lieu && <span>{a.lieu}</span>}
                {a.publiee && <span>{inscrits}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Etiquette({ neutre = false, children }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6, lineHeight: 1.3,
      background: neutre ? jetons.surfaceDouce : jetons.accentVoile,
      color: neutre ? jetons.texteDoux : jetons.marqueTexte,
    }}>
      {children}
    </span>
  )
}

function AccessCodeCard({ camping, grand }) {
  // Code et clé du QR viennent du serveur (acces_camping) : plus aucun calcul
  // ici. Relus à chaque nouvelle heure, et toutes les cinq minutes au cas où
  // la clé aurait été changée depuis un autre appareil.
  const [acces, setAcces] = useState(null)
  const [echec, setEchec] = useState(false)
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    let actif = true
    let heure = Math.floor(Date.now() / 3_600_000)
    async function charger() {
      const { data, error } = await lireAccesCamping(camping.id)
      if (!actif) return
      setEchec(!!error || !data)
      if (data) setAcces(data)
    }
    function tick() {
      const ms = msAvantNouveauCode()
      const m = Math.floor(ms / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setRemaining(`${m} min ${String(s).padStart(2, '0')} s`)
      const h = Math.floor(Date.now() / 3_600_000)
      if (h !== heure) { heure = h; charger() }
    }
    charger()
    tick()
    const iv = setInterval(tick, 1000)
    const relecture = setInterval(charger, 5 * 60_000)
    return () => { actif = false; clearInterval(iv); clearInterval(relecture) }
  }, [camping.id])

  const code = acces?.code || (echec ? '—' : '····')
  const joinUrl = lienRejoindre(camping.slug, acces?.cle)

  // « Copier » ne disait rien, et ne faisait rien là où le presse-papiers est
  // refusé : le gérant ne savait pas s'il pouvait coller.
  async function copier() {
    // Sans la clé, le lien copié ne vaudrait pas preuve de présence.
    if (!acces?.cle) { toast('Lien pas encore chargé : réessayez dans un instant.', 'erreur'); return }
    try {
      await navigator.clipboard.writeText(joinUrl)
      toast('Lien copié', 'succes')
    } catch {
      toast('Copie impossible ici : sélectionnez le lien à la main.', 'erreur')
    }
  }

  // Le geste que la réception fait vingt fois par jour : un seul bloc sombre,
  // le code en très grand, et les deux façons de le transmettre.
  const boutonCode = { ...bouton.principal, flex: '1 1 190px', minHeight: 50, borderRadius: 14, fontSize: 16 }
  return (
    <section aria-label="Code d'accès du jour" className="cc-sombre" style={{
      background: barre.fond, color: '#fff', borderRadius: rayon.xl, padding: grand ? 26 : 22,
    }}>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: barre.texte }}>
        <Icone nom="cle" taille={17} />
        Code d’accès du jour · à donner à l’accueil
      </p>
      {/* Le code change toutes les heures : une région live l'annonce au
          lieu de le laisser muter en silence sous les yeux du gérant. */}
      <div role="status" style={{
        fontSize: grand ? 76 : 64, fontWeight: 700, letterSpacing: '0.14em', lineHeight: 1,
        margin: '16px 0 12px', fontVariantNumeric: 'tabular-nums',
      }}>
        {code}
      </div>
      <p style={{
        margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 14, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)',
      }}>
        <Icone nom="horloge" taille={15} style={{ color: barre.texte }} />
        {echec && !acces
          ? 'Code indisponible : vérifiez la connexion et rechargez la page.'
          : <span>Nouveau code dans <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{remaining}</strong></span>}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
        {/* « Générez un QR code » laissait croire qu'il fallait un outil
            externe : l'application le génère déjà, dans Paramètres. */}
        <Link to="/admin/parametres#qr" style={{ ...boutonCode, background: '#fff', color: jetons.texte, border: '1px solid #fff' }}>
          <Icone nom="qr" taille={19} /> Afficher le QR code
        </Link>
        <button type="button" onClick={copier}
                style={{ ...boutonCode, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}>
          <Icone nom="copier" taille={18} /> Copier le lien
        </button>
      </div>
    </section>
  )
}
