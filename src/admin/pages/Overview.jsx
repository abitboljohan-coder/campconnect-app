import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, presentFilter, todayISO } from '../../supabase'
import StatCard from '../components/StatCard'
import { getHourlyCode } from '../../pages/Onboarding'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, Squelette, Vide, couleur as jetons, espace, graisse, rayon, texte as tailles } from '../../design'

function OnboardingChecklist({ camping, stats }) {
  const hasLogo      = !!camping?.logo_url
  const hasColor     = !!camping?.couleur_principale && camping.couleur_principale !== jetons.marque
  const perimeter    = camping?.carte_config?.perimeter || []
  const pins         = camping?.carte_config?.pins || []
  const hasContour   = perimeter.length >= 3
  const hasPois      = pins.length > 0

  const steps = [
    { done: hasLogo || hasColor, label: 'Personnalisez l\'apparence (logo, couleurs)', to: '/admin/apparence', icon: '🎨' },
    { done: hasContour,          label: 'Tracez le contour de votre camping',          to: '/admin/carte',     icon: '🗺️' },
    { done: hasPois,             label: 'Ajoutez vos points d\'intérêt (piscine, sanitaires…)', to: '/admin/carte', icon: '📍' },
    { done: stats.animations > 0, label: 'Créez votre première animation',             to: '/admin/animations', icon: '🎉' },
  ]
  const doneCount = steps.filter(s => s.done).length
  if (doneCount === steps.length) return null // tout est fait → on masque

  return (
    <Bloc style={{
      background: 'linear-gradient(135deg, #f0fdf4, #ecfccb)',
      border: '1px solid #bbf7d0',
      borderRadius: rayon.lg,
    }}>
      <Pile direction="ligne" espace="md" justifier="space-between" aligner="center">
        <div>
          <Texte variante="sousTitre" as="h2" style={{ fontSize: 16, color: '#1a4d1a' }}>
            🚀 Bienvenue ! Configurez votre camping en 4 étapes
          </Texte>
          <Texte variante="doux" style={{ color: jetons.succes, marginTop: 2 }}>
            {doneCount}/{steps.length} étapes complétées
          </Texte>
        </div>
        {/* La progression est aussi une valeur : annoncée, elle ne dépend plus
            du seul repérage visuel du grand pourcentage. */}
        <div
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-label="Configuration du camping"
          style={{ fontSize: 26, fontWeight: graisse.affiche, color: jetons.succes, flexShrink: 0 }}
        >
          {Math.round((doneCount / steps.length) * 100)}%
        </div>
      </Pile>

      <Pile espace="sm">
        {steps.map((s, i) => (
          <Link key={i} to={s.to} style={{
            display: 'flex', alignItems: 'center', gap: espace.md,
            padding: `10px ${espace.lg}px`,
            background: s.done ? 'rgba(22,101,52,0.08)' : jetons.surface,
            borderRadius: rayon.md, textDecoration: 'none',
            border: `1px solid ${s.done ? 'transparent' : jetons.bordure}`,
            opacity: s.done ? 0.7 : 1,
          }}>
            <span aria-hidden="true" style={{
              width: 26, height: 26, borderRadius: rayon.rond,
              background: s.done ? jetons.marque : jetons.surface,
              border: `2px solid ${s.done ? jetons.marque : jetons.bordure}`,
              color: '#fff', fontSize: 14, fontWeight: graisse.affiche,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {s.done ? '✓' : ''}
            </span>
            <span aria-hidden="true" style={{ fontSize: 20 }}>{s.icon}</span>
            <Texte variante="corps" as="span" style={{
              flex: 1, fontWeight: graisse.fort,
              color: s.done ? jetons.texteDoux : jetons.texte,
              textDecoration: s.done ? 'line-through' : 'none',
            }}>
              {s.label}
            </Texte>
            {!s.done && (
              <Texte variante="doux" as="span" style={{ color: jetons.marqueTexte, fontWeight: graisse.titre }}>
                Commencer →
              </Texte>
            )}
          </Link>
        ))}
      </Pile>
    </Bloc>
  )
}

export default function Overview({ camping }) {
  const [stats, setStats]           = useState({ vacanciers: 0, groupes: 0, inscriptions: 0, taux: 0, animations: 0 })
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
      { count: vacCount },
      { count: grpCount },
      { data: anims },
      { data: grps },
      { data: departsAuj },
      { count: departsSem },
      { count: animTotal },
    ] = await Promise.all([
      supabase.from('vacanciers').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).or(presentFilter()),
      supabase.from('groupes').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).eq('actif', true),
      supabase.from('animations').select('id, titre, places_max').eq('camping_id', camping.id).eq('publiee', true),
      supabase.from('groupes').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('vacanciers').select('pseudo, avatar_emoji, emplacement').eq('camping_id', camping.id).eq('date_depart', today).order('pseudo'),
      supabase.from('vacanciers').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).gte('date_depart', today).lte('date_depart', in7j),
      supabase.from('animations').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id),
    ])

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
          .select('*, vacanciers(pseudo, emplacement), animations(titre)')
          .in('animation_id', animIds)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      inscCount = iCount || 0
      recentInscs = recentI || []

      // Taux de remplissage global
      const totalPlaces = (anims || []).reduce((sum, a) => sum + (a.places_max || 0), 0)
      const totalInscrits = (allInscs || []).length
      taux = totalPlaces > 0 ? Math.round((totalInscrits / totalPlaces) * 100) : 0
    }

    setStats({ vacanciers: vacCount || 0, groupes: grpCount || 0, inscriptions: inscCount, taux, animations: animTotal || 0 })
    setDeparts({ aujourdhui: departsAuj || [], semaine: departsSem || 0 })
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

      {/* Guide de démarrage — masqué quand tout est configuré */}
      <OnboardingChecklist camping={camping} stats={stats} />

      {/* Code d'accès + QR */}
      <AccessCodeCard camping={camping} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
        <StatCard icon="🏕️" value={stats.vacanciers} label="Vacanciers présents" sub="Actuellement au camping" />
        <StatCard icon="👋" value={departs.semaine} label="Départs sous 7 jours" sub={departs.aujourdhui.length ? `dont ${departs.aujourdhui.length} aujourd'hui` : 'Aucun aujourd\'hui'} color="#0ea5e9" />
        <StatCard icon="👥" value={stats.groupes} label="Groupes actifs" sub="En ce moment" color="#f59e0b" />
        <StatCard icon="📅" value={stats.inscriptions} label="Inscriptions aujourd'hui" sub="Nouvelles inscriptions" color="#8b5cf6" />
        <StatCard icon="📈" value={`${stats.taux}%`} label="Taux de remplissage" sub="Animations publiées" color="#ef4444" />
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
  const [code, setCode] = useState(getHourlyCode(camping.id))
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function tick() {
      setCode(getHourlyCode(camping.id))
      const ms = 3_600_000 - (Date.now() % 3_600_000)
      const m = Math.floor(ms / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setRemaining(`${m}m ${String(s).padStart(2, '0')}s`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [camping.id])

  // Toujours le domaine public : ce lien devient un QR imprimé et affiché à la
  // réception. Un gérant qui consulte son admin depuis un poste local ou une
  // URL de test imprimerait sinon un QR en localhost, illisible pour les
  // vacanciers.
  const estLocal = /^(localhost|127\.|192\.168\.|10\.)/.test(window.location.hostname)
  const joinUrl = `${estLocal ? 'https://app.campconnect.fr' : window.location.origin}/join/${camping.slug}`

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
      gap: 14, marginBottom: 24,
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
            Change dans <strong style={{ color: 'rgba(151,196,89,0.8)' }}>{remaining}</strong>
          </Texte>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div aria-hidden="true" style={{ fontSize: 28, marginBottom: espace.xs }}>🔑</div>
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
        <Texte variante="doux" style={{ lineHeight: 1.6 }}>
          Générez un QR code avec ce lien et affichez-le à la réception. Les vacanciers qui scannent ce lien accèdent directement sans code.
        </Texte>
        <Bouton
          variante="secondaire" taille="sm"
          onClick={() => navigator.clipboard?.writeText(joinUrl)}
          style={{ alignSelf: 'flex-start', borderRadius: rayon.sm, border: 'none', background: jetons.fond, color: jetons.marqueTexte }}
        >
          📋 Copier le lien
        </Bouton>
      </Bloc>
    </div>
  )
}
