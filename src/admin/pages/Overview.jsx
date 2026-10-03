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
import { tauxRemplissage } from '../lib/animations'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, Squelette, Vide, Icone, couleur as jetons, espace, graisse, rayon, texte as tailles } from '../../design'

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
    { fait: !!camping?.logo_url || (!!camping?.couleur_principale && camping.couleur_principale !== jetons.marque),
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
  const [stats, setStats]           = useState({ vacanciers: 0, groupes: 0, inscriptions: 0, taux: 0, animations: 0, signalements: 0 })
  const [departs, setDeparts]       = useState({ aujourdhui: [], semaine: 0 })
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

    const today = todayISO()
    const in7j = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const [
      { data: vacs },
      { data: grpActifs },
      { data: anims },
      { data: grps },
      { count: animTotal },
      { count: sigCount },
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
    ])
    const grpCount = (grpActifs || []).filter(g => estActuel(g)).length
    const vacCount = vacs.filter(v => estPresent(v)).length
    const departsAuj = vacs.filter(v => v.date_depart === today)
      .sort((a, b) => (a.pseudo || '').localeCompare(b.pseudo || ''))
    const departsSem = vacs.filter(v => v.date_depart >= today && v.date_depart <= in7j).length
    const vacParId = new Map(vacs.map(v => [v.id, v]))

    const animIds = (anims || []).map(a => a.id)

    let inscCount = 0
    let taux = 0
    let recentInscs = []

    if (animIds.length > 0) {
      const [{ count: iCount }, { data: allInscs }, { data: recentI }] = await Promise.all([
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
      recentInscs = (recentI || []).map(i => ({ ...i, vacanciers: vacParId.get(i.vacancier_id) || null }))

      taux = tauxRemplissage(anims, allInscs)
    }

    setStats({ vacanciers: vacCount || 0, groupes: grpCount, inscriptions: inscCount, taux, animations: animTotal || 0, signalements: sigCount || 0 })
    setDeparts({ aujourdhui: departsAuj, semaine: departsSem })
    setRecentGroupes(grps || [])
    setRecentInscriptions(recentInscs)
    setLoading(false)
  }

  return (
    <Pile espace="xl">
      <EnTete
        titre="Vue d'ensemble"
        sous={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Ce qui attend le gérant passe avant tout le reste : un signalement ne
          se voyait qu'en allant le chercher dans sa page. */}
      {stats.signalements > 0 && (
        <Link to="/admin/signalements" style={{
          display: 'flex', alignItems: 'center', gap: espace.md,
          padding: `14px ${espace.lg}px`, borderRadius: rayon.lg, textDecoration: 'none',
          background: jetons.dangerFond, border: '1px solid #fecaca',
        }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>🚩</span>
          <Texte variante="corps" as="span" style={{ flex: 1, fontWeight: graisse.fort, color: jetons.danger }}>
            {stats.signalements === 1
              ? '1 nouveau signalement à traiter'
              : `${stats.signalements} nouveaux signalements à traiter`}
          </Texte>
          <Icone nom="chevron" taille={17} style={{ color: jetons.danger }} />
        </Link>
      )}

      {/* Masqué dès que toutes les étapes sont faites. */}
      <GuideDemarrage camping={camping} stats={stats} />

      {/* Le code d'accès d'abord : c'est ce que la réception demande vingt
          fois par jour. Il commençait sous la ligne de flottaison du téléphone. */}
      <AccessCodeCard camping={camping} />

      {/* Deux colonnes dès 320 px (288 px utiles : 2 × 130 + 12), les cinq
          tuiles sur une ligne à l'écran. Avec 172 px, il fallait 402 px. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 12 }}>
        <StatCard icone="tente"     valeur={stats.vacanciers}   libelle="Vacanciers présents" sous="Actuellement au camping" />
        <StatCard icone="sortie"    valeur={departs.semaine}    libelle="Départs sous 7 jours"
                  sous={departs.aujourdhui.length ? `dont ${departs.aujourdhui.length} aujourd'hui` : "Aucun aujourd'hui"}
                  couleur="#0284c7" />
        <StatCard icone="personnes" valeur={stats.groupes}      libelle="Groupes actifs" sous="En ce moment" couleur="#b45309" />
        <StatCard icone="agenda"    valeur={stats.inscriptions} libelle="Inscriptions aujourd'hui" sous="Depuis minuit" couleur="#6d28d9" />
        <StatCard icone="tendance"  valeur={`${stats.taux}%`}   libelle="Taux de remplissage" sous="Animations à venir, places limitées" couleur="#be123c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: espace.xl }}>

        {/* Départs du jour */}
        {departs.aujourdhui.length > 0 && (
          <Bloc titre="👋 Départs aujourd'hui">
            <Pile espace="sm">
              {departs.aujourdhui.map((v, idx) => (
                <Pile key={idx} direction="ligne" espace="md" aligner="center"
                      style={{ padding: '10px 0', borderBottom: `1px solid ${jetons.fond}` }}>
                  <span aria-hidden="true" style={{
                    width: 38, height: 38, borderRadius: rayon.rond, background: '#e0f2fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {v.avatar_emoji || '🙂'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Texte variante="corps" style={{ fontWeight: graisse.fort, color: jetons.texte }}>{v.pseudo}</Texte>
                    {v.emplacement && <Texte variante="doux" style={{ marginTop: 2 }}>📍 Emplacement {v.emplacement}</Texte>}
                  </div>
                </Pile>
              ))}
            </Pile>
          </Bloc>
        )}

        {/* Derniers groupes */}
        <Bloc titre="Derniers groupes créés">
          {loading ? (
            <Squelette lignes={3} hauteur={44} libelle="Chargement…" />
          ) : recentGroupes.length === 0 ? (
            <Vide emoji="👥" texte="Aucun groupe pour le moment." />
          ) : (
            <Pile espace="sm">
              {recentGroupes.map(g => (
                <Pile key={g.id} direction="ligne" espace="md" aligner="center"
                      style={{ padding: '10px 0', borderBottom: `1px solid ${jetons.fond}` }}>
                  <span aria-hidden="true" style={{
                    width: 38, height: 38, borderRadius: rayon.md, background: jetons.fond,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>
                    {g.emoji || '👥'}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Texte variante="corps" style={{ fontWeight: graisse.fort, color: jetons.texte, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.titre}</Texte>
                    <Texte variante="doux" style={{ marginTop: 2 }}>
                      {new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {g.lieu && ` · 📍 ${g.lieu}`}
                    </Texte>
                  </div>
                </Pile>
              ))}
            </Pile>
          )}
        </Bloc>

        {/* Dernières inscriptions */}
        <Bloc titre="Dernières inscriptions">
          {loading ? (
            <Squelette lignes={3} hauteur={44} libelle="Chargement…" />
          ) : recentInscriptions.length === 0 ? (
            <Vide emoji="📅" texte="Aucune inscription pour le moment." />
          ) : (
            <Pile espace="sm">
              {recentInscriptions.map((ins, idx) => (
                <Pile key={idx} direction="ligne" espace="md" aligner="center"
                      style={{ padding: '10px 0', borderBottom: `1px solid ${jetons.fond}` }}>
                  <span aria-hidden="true" style={{
                    width: 38, height: 38, borderRadius: rayon.rond,
                    background: 'var(--cc-accent-voile)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0, color: jetons.marqueTexte, fontWeight: graisse.titre,
                  }}>
                    {ins.vacanciers?.pseudo?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Texte variante="corps" style={{ fontWeight: graisse.fort, color: jetons.texte }}>{ins.vacanciers?.pseudo || '—'}</Texte>
                    <Texte variante="doux" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      → {ins.animations?.titre || '—'}
                    </Texte>
                  </div>
                  <Texte variante="micro" style={{ flexShrink: 0 }}>
                    {new Date(ins.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Texte>
                </Pile>
              ))}
            </Pile>
          )}
        </Bloc>

      </div>
    </Pile>
  )
}

function AccessCodeCard({ camping }) {
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
      setRemaining(`${m}m ${String(s).padStart(2, '0')}s`)
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
      gap: 14,
    }}>
      {/* Code tournant */}
      <div className="cc-sombre" style={{
        background: jetons.marqueSombre, borderRadius: rayon.lg, padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: espace.xl,
      }}>
        <div style={{ flex: 1 }}>
          <Texte variante="libelle" as="span" style={{ color: 'rgba(151,196,89,0.7)', display: 'block', marginBottom: 6 }}>
            Code d'accès vacanciers
          </Texte>
          {/* Le code change toutes les heures : une région live l'annonce au
              lieu de le laisser muter en silence sous les yeux du gérant. */}
          <div role="status" style={{
            fontFamily: 'monospace', fontSize: 42, fontWeight: graisse.affiche,
            color: '#97C459', letterSpacing: 8, lineHeight: 1,
          }}>
            {code}
          </div>
          <Texte variante="micro" style={{ color: 'rgba(255,255,255,0.45)', marginTop: espace.sm }}>
            {echec && !acces
              ? 'Code indisponible : vérifiez la connexion et rechargez la page.'
              : <>Change dans <strong style={{ color: 'rgba(151,196,89,0.8)' }}>{remaining}</strong></>}
          </Texte>
        </div>
        <div style={{ textAlign: 'center' }}>
          {/* Sur le bloc sombre, l'icône hérite d'une couleur de texte presque
              noire et disparaît : la teinte est posée explicitement. */}
          <Icone nom="cle" taille={26} style={{
            marginBottom: espace.xs, marginLeft: 'auto', marginRight: 'auto',
            color: 'rgba(151,196,89,0.85)',
          }} />
          <Texte variante="micro" style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
            Affiché à<br/>la réception
          </Texte>
        </div>
      </div>

      {/* Lien QR / accès direct */}
      <Bloc>
        <Texte variante="libelle" as="span">Lien QR code direct</Texte>
        <div style={{
          fontFamily: 'monospace', fontSize: tailles.petit, color: jetons.marqueTexte,
          background: '#f0fdf4', borderRadius: rayon.sm, padding: `10px ${espace.md}px`,
          wordBreak: 'break-all',
        }}>
          {joinUrl}
        </div>
        {/* « Générez un QR code » laissait croire qu'il fallait un outil
            externe : l'application le génère déjà, dans Paramètres. */}
        <Texte variante="doux" style={{ lineHeight: 1.6 }}>
          Votre QR code est prêt dans Paramètres : affichez-le à la réception. Les vacanciers qui le scannent entrent sans code.
        </Texte>
        <Pile direction="ligne" espace="sm" retour>
          <Link to="/admin/parametres#qr" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
            padding: `0 ${espace.lg}px`, borderRadius: rayon.sm, textDecoration: 'none',
            background: jetons.marque, color: '#fff', fontWeight: graisse.fort, fontSize: tailles.petit,
          }}>
            Voir le QR code <Icone nom="chevron" taille={15} />
          </Link>
          <Bouton
            variante="secondaire" taille="sm"
            onClick={copier}
            style={{ minHeight: 44, borderRadius: rayon.sm, border: 'none', background: jetons.fond, color: jetons.marqueTexte }}
          >
            Copier le lien
          </Bouton>
        </Pile>
      </Bloc>
    </div>
  )
}
