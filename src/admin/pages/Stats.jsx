import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#639922', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899', '#14b8a6']

function groupByDate(items, dateField) {
  const counts = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    counts[key] = 0
  }
  for (const item of items) {
    const d = new Date(item[dateField])
    const key = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    if (key in counts) counts[key]++
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

function countBy(items, field) {
  const counts = {}
  for (const item of items) {
    const val = item[field]
    if (val) counts[val] = (counts[val] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export default function Stats({ camping }) {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [camping.id])

  async function load() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString()

    const [
      { data: vacanciers },
      { data: groupes },
      { data: animations },
      { data: allVacanciers },
    ] = await Promise.all([
      supabase.from('vacanciers').select('created_at').eq('camping_id', camping.id).gte('created_at', since),
      supabase.from('groupes').select('created_at').eq('camping_id', camping.id).gte('created_at', since),
      supabase.from('animations').select('id, titre, places_max').eq('camping_id', camping.id).eq('publiee', true),
      supabase.from('vacanciers').select('tranche_age, avec, interets').eq('camping_id', camping.id),
    ])

    // Inscriptions par animation
    let animStats = []
    const animIds = (animations || []).map(a => a.id)
    if (animIds.length > 0) {
      const { data: inscs } = await supabase
        .from('inscriptions')
        .select('animation_id')
        .in('animation_id', animIds)

      const counts = {}
      for (const ins of (inscs || [])) {
        counts[ins.animation_id] = (counts[ins.animation_id] || 0) + 1
      }
      animStats = (animations || []).map(a => ({
        name: a.titre.length > 20 ? a.titre.slice(0, 18) + '…' : a.titre,
        inscrits: counts[a.id] || 0,
        taux: a.places_max ? Math.round(((counts[a.id] || 0) / a.places_max) * 100) : null,
      })).sort((a, b) => b.inscrits - a.inscrits).slice(0, 8)
    }

    // Top intérêts (flatten arrays)
    const interetCounts = {}
    for (const v of (allVacanciers || [])) {
      if (Array.isArray(v.interets)) {
        for (const interet of v.interets) {
          interetCounts[interet] = (interetCounts[interet] || 0) + 1
        }
      }
    }
    const topInterets = Object.entries(interetCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    setData({
      vacParJour:   groupByDate(vacanciers || [], 'created_at'),
      grpParJour:   groupByDate(groupes || [], 'created_at'),
      trancheAge:   countBy(allVacanciers || [], 'tranche_age'),
      avec:         countBy(allVacanciers || [], 'avec'),
      topInterets,
      animStats,
    })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => <div key={i} style={{ height: 240, borderRadius: 14, background: '#e8e4da' }} />)}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Statistiques</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>30 derniers jours</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Vacanciers par jour */}
        <ChartCard title="Inscriptions vacanciers par jour">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.vacParJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Line type="monotone" dataKey="count" stroke="#639922" strokeWidth={2.5} dot={false} name="Inscrits" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top animations */}
        {data.animStats.length > 0 && (
          <ChartCard title="Top animations — nombre d'inscrits">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.animStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Bar dataKey="inscrits" fill="#639922" radius={[0, 4, 4, 0]} name="Inscrits" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Répartition âge + avec */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <ChartCard title="Répartition par tranche d'âge">
            {data.trancheAge.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.trancheAge} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {data.trancheAge.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <ChartCard title="Avec qui voyagent-ils ?">
            {data.avec.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.avec} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {data.avec.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>
        </div>

        {/* Top intérêts */}
        {data.topInterets.length > 0 && (
          <ChartCard title="Top centres d'intérêt">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topInterets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Vacanciers" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Groupes par jour */}
        <ChartCard title="Groupes créés par jour">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.grpParJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Groupes" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(0,0,0,0.07)' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>{title}</h2>
      {children}
    </div>
  )
}

function Empty() {
  return <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>Pas encore de données.</div>
}
