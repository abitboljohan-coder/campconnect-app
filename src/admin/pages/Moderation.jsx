import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Pile, Puce, Squelette, Vide, Badge as Pastille, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function Moderation({ camping }) {
  const [messages, setMessages] = useState([])
  const [statuts, setStatuts] = useState([])
  const [vacanciers, setVacanciers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('messages')

  async function load() {
    const { data: grps } = await supabase.from('groupes').select('id, titre').eq('camping_id', camping.id)
    const grpIds = (grps || []).map(g => g.id)
    const grpNames = Object.fromEntries((grps || []).map(g => [g.id, g.titre]))

    const [{ data: msgs }, { data: sts }, { data: vacs }] = await Promise.all([
      grpIds.length
        ? supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji, banni)')
            .in('groupe_id', grpIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] }),
      supabase.from('statuts').select('*, vacanciers(pseudo, avatar_emoji, banni)')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('vacanciers').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }),
    ])
    setMessages((msgs || []).map(m => ({ ...m, groupe_nom: grpNames[m.groupe_id] })))
    setStatuts(sts || [])
    setVacanciers(vacs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id]) // eslint-disable-line

  async function supprimerMessage(id) {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }
  async function supprimerStatut(id) {
    await supabase.from('statuts').delete().eq('id', id)
    setStatuts(prev => prev.filter(s => s.id !== id))
  }
  async function toggleBan(vac) {
    const banni = !vac.banni
    if (banni && !confirm(`Bannir ${vac.pseudo} ? Il ne pourra plus poster de messages ni de statuts.`)) return
    await supabase.from('vacanciers').update({ banni }).eq('id', vac.id)
    setVacanciers(prev => prev.map(v => v.id === vac.id ? { ...v, banni } : v))
  }

  const fmtDate = iso => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <Pile espace="lg">
      <EnTete titre="Modération" sous="Supprimez les contenus inappropriés et gérez les vacanciers." />

      {/* Onglets */}
      <Pile direction="ligne" espace="sm" retour role="group" aria-label="Type de contenu">
        {[['messages', `💬 Messages (${messages.length})`],
          ['statuts', `📣 Statuts (${statuts.length})`],
          ['vacanciers', `👥 Vacanciers (${vacanciers.length})`]].map(([k, l]) => (
          <Puce key={k} taille="sm" actif={tab === k} onClick={() => setTab(k)}>{l}</Puce>
        ))}
      </Pile>

      {loading ? <Squelette lignes={4} hauteur={64} libelle="Chargement…" /> : (
        <Bloc padding={0} style={{ overflow: 'hidden' }}>

          {tab === 'messages' && (messages.length === 0
            ? <Vide emoji="💬" texte="Aucun message." />
            : messages.map(m => (
              <Row key={m.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{m.vacanciers?.pseudo}</b>
                    {m.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{m.groupe_nom} · {fmtDate(m.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texteMoyen, marginTop: 2, wordBreak: 'break-word' }}>{m.contenu}</div>
                </div>
                <DangerBtn onClick={() => supprimerMessage(m.id)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'statuts' && (statuts.length === 0
            ? <Vide emoji="📣" texte="Aucun statut." />
            : statuts.map(s => (
              <Row key={s.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{s.vacanciers?.pseudo}</b>
                    {s.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{fmtDate(s.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texteMoyen, marginTop: 2 }}>{s.emoji} {s.texte}</div>
                </div>
                <DangerBtn onClick={() => supprimerStatut(s.id)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'vacanciers' && (vacanciers.length === 0
            ? <Vide emoji="👥" texte="Aucun vacancier." />
            : vacanciers.map(v => (
              <Row key={v.id}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{v.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: jetons.texte }}>
                    {v.pseudo} {v.banni && <Badge red>banni</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    {v.emplacement ? `Empl. ${v.emplacement} · ` : ''}
                    inscrit le {fmtDate(v.created_at)}
                  </div>
                </div>
                <Bouton
                  variante={v.banni ? 'secondaire' : 'danger'}
                  taille="sm"
                  onClick={() => toggleBan(v)}
                  style={{
                    flexShrink: 0, borderRadius: rayon.sm, background: 'transparent',
                    border: `1.5px solid ${v.banni ? jetons.marque : jetons.danger}`,
                    color: v.banni ? jetons.marque : jetons.danger,
                  }}
                >
                  {v.banni ? 'Débannir' : 'Bannir'}
                </Bouton>
              </Row>
            )))}
        </Bloc>
      )}
    </Pile>
  )
}

function Row({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: espace.md,
      padding: '13px 18px', borderBottom: `1px solid ${jetons.surfaceDouce}`,
    }}>
      {children}
    </div>
  )
}
function Badge({ children }) {
  return (
    <Pastille ton="danger" style={{ marginLeft: 6, textTransform: 'uppercase', fontWeight: graisse.affiche }}>
      {children}
    </Pastille>
  )
}
function DangerBtn({ onClick, children }) {
  return (
    <Bouton variante="danger" taille="sm" onClick={onClick}
            style={{ flexShrink: 0, borderRadius: rayon.sm, background: 'transparent', border: `1.5px solid ${jetons.danger}` }}>
      {children}
    </Bouton>
  )
}
