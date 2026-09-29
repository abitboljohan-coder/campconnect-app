import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { toast } from '../../toast'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Pile, Puce, Squelette, Vide, Badge as Pastille, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function Moderation({ camping }) {
  const [messages, setMessages] = useState([])
  const [statuts, setStatuts] = useState([])
  const [annonces, setAnnonces] = useState([])
  const [groupes, setGroupes] = useState([])
  const [vacanciers, setVacanciers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('messages')

  async function load() {
    const { data: grps } = await supabase.from('groupes')
      .select('*, vacanciers(pseudo, avatar_emoji, banni)')
      .eq('camping_id', camping.id).order('created_at', { ascending: false })
    const grpIds = (grps || []).map(g => g.id)
    const grpNames = Object.fromEntries((grps || []).map(g => [g.id, g.titre]))

    // Annonces et groupes sont du contenu publié par les vacanciers, photos et
    // titres compris : ils n'avaient pas d'onglet, et le gérant ne pouvait
    // retirer ni une annonce déplacée, ni un groupe au titre injurieux.
    const [{ data: msgs }, { data: sts }, { data: vacs }, { data: anns }] = await Promise.all([
      grpIds.length
        ? supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji, banni)')
            .in('groupe_id', grpIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] }),
      supabase.from('statuts').select('*, vacanciers(pseudo, avatar_emoji, banni)')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('vacanciers').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }),
      supabase.from('annonces').select('*, vacanciers(pseudo, avatar_emoji, banni)')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
    ])
    setMessages((msgs || []).map(m => ({ ...m, groupe_nom: grpNames[m.groupe_id] })))
    setStatuts(sts || [])
    setVacanciers(vacs || [])
    setAnnonces(anns || [])
    setGroupes(grps || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id]) // eslint-disable-line

  // Supprimer se faisait d'un seul appui, sans confirmation ni vérification :
  // un doigt qui glisse effaçait un message, et un échec passait pour un succès.
  async function supprimer(table, id, question, retirer) {
    if (!confirm(question)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.error('Suppression échouée :', error); toast('Suppression impossible pour le moment.', 'erreur'); return }
    retirer(prev => prev.filter(x => x.id !== id))
    toast('Supprimé', 'succes')
  }
  async function toggleBan(vac) {
    const banni = !vac.banni
    if (banni && !confirm(`Bannir ${vac.pseudo} ? Il ne pourra plus rien publier dans votre camping.`)) return
    const { error } = await supabase.from('vacanciers').update({ banni }).eq('id', vac.id)
    if (error) { console.error('Bannissement échoué :', error); toast('Action impossible pour le moment.', 'erreur'); return }
    setVacanciers(prev => prev.map(v => v.id === vac.id ? { ...v, banni } : v))
    toast(banni ? `${vac.pseudo} est banni` : `${vac.pseudo} peut de nouveau publier`, 'succes')
  }

  const fmtDate = iso => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <Pile espace="lg">
      <EnTete titre="Modération" sous="Supprimez les contenus inappropriés et gérez les vacanciers." />

      {/* Onglets */}
      {/* Une ligne qui défile plutôt que trois lignes de pastilles. */}
      <Pile direction="ligne" espace="sm" role="group" aria-label="Type de contenu"
            style={{ overflowX: 'auto', paddingBottom: 2, marginRight: -espace.lg }}>
        {[['messages', `💬 Messages (${messages.length})`],
          ['statuts', `📣 Statuts (${statuts.length})`],
          ['annonces', `📌 Annonces (${annonces.length})`],
          ['groupes', `🏕️ Groupes (${groupes.length})`],
          ['vacanciers', `👥 Vacanciers (${vacanciers.length})`]].map(([k, l]) => (
          <Puce key={k} taille="sm" actif={tab === k} onClick={() => setTab(k)} style={{ flexShrink: 0 }}>{l}</Puce>
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
                <DangerBtn onClick={() => supprimer('messages', m.id, 'Supprimer ce message ?', setMessages)}>Supprimer</DangerBtn>
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
                <DangerBtn onClick={() => supprimer('statuts', s.id, 'Supprimer ce statut ?', setStatuts)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'annonces' && (annonces.length === 0
            ? <Vide emoji="📌" texte="Aucune annonce." />
            : annonces.map(a => (
              <Row key={a.id}>
                {a.photo_url
                  ? <img src={a.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: rayon.sm, objectFit: 'cover', flexShrink: 0 }} />
                  : <span style={{ fontSize: 18, flexShrink: 0 }}>{a.vacanciers?.avatar_emoji || '🙂'}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{a.vacanciers?.pseudo || '—'}</b>
                    {a.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{fmtDate(a.created_at)}{a.resolu ? ' · résolue' : ''}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texte, marginTop: 2, fontWeight: graisse.fort }}>{a.titre}</div>
                  {a.description && <div style={{ fontSize: 13, color: jetons.texteMoyen, marginTop: 2, wordBreak: 'break-word' }}>{a.description}</div>}
                </div>
                <DangerBtn onClick={() => supprimer('annonces', a.id, 'Supprimer cette annonce ?', setAnnonces)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'groupes' && (groupes.length === 0
            ? <Vide emoji="🏕️" texte="Aucun groupe." />
            : groupes.map(g => (
              <Row key={g.id}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{g.emoji || '👥'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: jetons.texte, fontWeight: graisse.fort }}>{g.titre}</div>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    {g.vacanciers?.pseudo ? `par ${g.vacanciers.pseudo} · ` : ''}{fmtDate(g.created_at)}{g.lieu ? ` · ${g.lieu}` : ''}
                  </div>
                </div>
                <DangerBtn onClick={() => supprimer('groupes', g.id, `Supprimer le groupe « ${g.titre} » et toute sa conversation ?`, setGroupes)}>Supprimer</DangerBtn>
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
