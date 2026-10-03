import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { lireVacanciersDuCamping } from '../../lib/vacanciers'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Bloc, EnTete } from '../components/Bloc'
import StatCard from '../components/StatCard'
import { Pile, Texte, Vide, couleur as jetons } from '../../design'
import { codesInterets, libelleAvecFr, libelleInteretFr } from '../../lib/profil'

const COLORS = [jetons.marque, '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899', '#14b8a6']

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
      // Tranche d'âge : par vacanciers_du_camping, réservée aux gérants.
      lireVacanciersDuCamping(camping.id),
    ])

    // Inscriptions par animation
    let animStats = []
    let inscriptions30j = 0
    const animIds = (animations || []).map(a => a.id)
    if (animIds.length > 0) {
      const { data: inscs } = await supabase
        .from('inscriptions')
        .select('animation_id, created_at')
        .in('animation_id', animIds)

      inscriptions30j = (inscs || []).filter(i => i.created_at >= since).length
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

    // Les profils récents enregistrent des codes (« couple », « randonnee »),
    // les anciens des libellés français : tout est ramené au libellé français
    // pour que les deux se cumulent dans la même part du graphique.
    const interetCounts = {}
    for (const v of (allVacanciers || [])) {
      for (const interet of codesInterets(v.interests)) {
        const nom = libelleInteretFr(interet)
        interetCounts[nom] = (interetCounts[nom] || 0) + 1
      }
    }
    const topInterets = Object.entries(interetCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    setData({
      totaux: { vacanciers: (vacanciers || []).length, inscriptions: inscriptions30j, groupes: (groupes || []).length },
      vacParJour:   groupByDate(vacanciers || [], 'created_at'),
      grpParJour:   groupByDate(groupes || [], 'created_at'),
      trancheAge:   countBy(allVacanciers || [], 'tranche_age'),
      avec:         countBy((allVacanciers || []).map(v => ({ avec: libelleAvecFr(v.avec) })), 'avec'),
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
    <Pile espace="xl">
      {/* « 30 derniers jours » en tête de page était faux pour la moitié des
          blocs, calculés sur toute la saison : chaque bloc dit sa période. */}
      <EnTete titre="Statistiques" sous="La fréquentation de votre camping et le profil de vos vacanciers." />

      {/* Trois chiffres à présenter à la direction, avant les courbes. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 12 }}>
        <StatCard icone="tente"     valeur={data.totaux.vacanciers}   libelle="Nouveaux vacanciers" sous={TRENTE_JOURS} />
        <StatCard icone="agenda"    valeur={data.totaux.inscriptions} libelle="Inscriptions aux animations" sous={TRENTE_JOURS} couleur="#6d28d9" />
        <StatCard icone="personnes" valeur={data.totaux.groupes}      libelle="Groupes créés" sous={TRENTE_JOURS} couleur="#b45309" />
      </div>

        {/* Vacanciers par jour. « Inscriptions vacanciers » se confondait avec
            les inscriptions aux animations de l'accueil. */}
        <ChartCard title="Nouveaux vacanciers par jour" sous={TRENTE_JOURS}>
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
          <ChartCard title="Top animations — nombre d'inscrits" sous={SAISON}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.animStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: jetons.texteMoyen }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Bar dataKey="inscrits" fill="#639922" radius={[0, 4, 4, 0]} name="Inscrits" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Répartition âge + avec */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 20 }}>
          <ChartCard title="Répartition par tranche d'âge" sous={SAISON}>
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

          <ChartCard title="Avec qui voyagent-ils ?" sous={SAISON}>
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
          <ChartCard title="Top centres d'intérêt" sous={SAISON}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topInterets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: jetons.texteMoyen }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Vacanciers" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Groupes par jour */}
        <ChartCard title="Groupes créés par jour" sous={TRENTE_JOURS}>
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
    </Pile>
  )
}

const TRENTE_JOURS = '30 derniers jours'
const SAISON = 'Depuis le début de la saison'

function ChartCard({ title, sous, children }) {
  return (
    <Bloc>
      <div>
        <Texte variante="sousTitre" as="h2" style={{ fontSize: 16 }}>{title}</Texte>
        {sous && <Texte variante="micro" style={{ marginTop: 2 }}>{sous}</Texte>}
      </div>
      {children}
    </Bloc>
  )
}

function Empty() {
  return <Vide emoji="📊" texte="Pas encore de données." />
}
