import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import StatCard from '../components/StatCard'
import { getHourlyCode } from '../../pages/Onboarding'

export default function Overview({ camping }) {
  const [stats, setStats]           = useState({ vacanciers: 0, groupes: 0, inscriptions: 0, taux: 0 })
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

    const [
      { count: vacCount },
      { count: grpCount },
      { data: anims },
      { data: grps },
    ] = await Promise.all([
      supabase.from('vacanciers').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id),
      supabase.from('groupes').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).eq('actif', true),
      supabase.from('animations').select('id, titre, places_max').eq('camping_id', camping.id).eq('publiee', true),
      supabase.from('groupes').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(5),
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

    setStats({ vacanciers: vacCount || 0, groupes: grpCount || 0, inscriptions: inscCount, taux })
    setRecentGroupes(grps || [])
    setRecentInscriptions(recentInscs)
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Vue d'ensemble</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Code d'accès + QR */}
      <AccessCodeCard camping={camping} />

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon="🏕️" value={stats.vacanciers} label="Vacanciers inscrits" sub="Total du camping" />
        <StatCard icon="👥" value={stats.groupes} label="Groupes actifs" sub="En ce moment" color="#f59e0b" />
        <StatCard icon="📅" value={stats.inscriptions} label="Inscriptions aujourd'hui" sub="Nouvelles inscriptions" color="#8b5cf6" />
        <StatCard icon="📈" value={`${stats.taux}%`} label="Taux de remplissage" sub="Animations publiées" color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Derniers groupes */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Derniers groupes créés</h2>
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Chargement...</div>
          ) : recentGroupes.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Aucun groupe pour le moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentGroupes.map(g => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f5f2eb',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: '#f5f2eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>
                    {g.emoji || '👥'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.titre}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {g.lieu && ` · 📍 ${g.lieu}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières inscriptions */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Dernières inscriptions</h2>
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Chargement...</div>
          ) : recentInscriptions.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Aucune inscription pour le moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentInscriptions.map((ins, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f5f2eb',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#63992218',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0, color: '#639922', fontWeight: 700,
                  }}>
                    {ins.vacanciers?.pseudo?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{ins.vacanciers?.pseudo || '—'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      → {ins.animations?.titre || '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                    {new Date(ins.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
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

  const joinUrl = `${window.location.origin}/join/${camping.slug}`

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 14, marginBottom: 24,
    }}>
      {/* Code tournant */}
      <div style={{
        background: '#0d1f0d', borderRadius: 16, padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(151,196,89,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Code d'accès vacanciers
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 900, color: '#97C459', letterSpacing: 8, lineHeight: 1 }}>
            {code}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Change dans <strong style={{ color: 'rgba(151,196,89,0.7)' }}>{remaining}</strong>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🔑</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Affiché à<br/>la réception</div>
        </div>
      </div>

      {/* Lien QR / accès direct */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16, padding: '20px 22px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Lien QR code direct
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 12, color: '#639922',
          background: '#f0fdf4', borderRadius: 8, padding: '10px 12px',
          wordBreak: 'break-all', marginBottom: 12,
        }}>
          {joinUrl}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
          Générez un QR code avec ce lien et affichez-le à la réception. Les vacanciers qui scannent ce lien accèdent directement sans code.
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(joinUrl)}
          style={{
            marginTop: 10, background: '#f5f2eb', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 12,
            fontWeight: 600, color: '#639922', cursor: 'pointer',
          }}
        >
          📋 Copier le lien
        </button>
      </div>
    </div>
  )
}
