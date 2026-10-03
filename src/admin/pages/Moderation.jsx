import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { toast } from '../../toast'
import { lireVacanciersDuCamping } from '../../lib/vacanciers'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Champ, Pile, Puce, Squelette, Vide, Badge as Pastille, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function Moderation({ camping }) {
  const [messages, setMessages] = useState([])
  const [statuts, setStatuts] = useState([])
  const [annonces, setAnnonces] = useState([])
  const [groupes, setGroupes] = useState([])
  const [vacanciers, setVacanciers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('messages')
  const [recherche, setRecherche] = useState('')

  async function load() {
    // Les profils (pseudo, avatar, « banni », emplacement) viennent de
    // vacanciers_du_camping, réservée aux gérants : la table ne livrera plus
    // ces colonnes directement. On les rattache ensuite à chaque contenu.
    const [{ data: grps }, { data: vacs }] = await Promise.all([
      supabase.from('groupes').select('*')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }),
      lireVacanciersDuCamping(camping.id),
    ])
    const parId = new Map(vacs.map(v => [v.id, v]))
    const avecAuteur = cle => x => ({ ...x, vacanciers: parId.get(x[cle]) || null })
    const grpIds = (grps || []).map(g => g.id)
    const grpNames = Object.fromEntries((grps || []).map(g => [g.id, g.titre]))

    // Annonces et groupes sont du contenu publié par les vacanciers, photos et
    // titres compris : ils n'avaient pas d'onglet, et le gérant ne pouvait
    // retirer ni une annonce déplacée, ni un groupe au titre injurieux.
    const [{ data: msgs }, { data: sts }, { data: anns }] = await Promise.all([
      grpIds.length
        ? supabase.from('messages').select('*')
            .in('groupe_id', grpIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] }),
      supabase.from('statuts').select('*')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('annonces').select('*')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
    ])
    setMessages((msgs || []).map(m => ({ ...avecAuteur('auteur_id')(m), groupe_nom: grpNames[m.groupe_id] })))
    setStatuts((sts || []).map(avecAuteur('vacancier_id')))
    setVacanciers([...vacs].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))))
    setAnnonces((anns || []).map(avecAuteur('vacancier_id')))
    setGroupes((grps || []).map(avecAuteur('createur_id')))
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
    // Le badge « banni » des contenus de cet auteur suit, dans tous les onglets.
    const marquer = cle => prev => prev.map(x => x[cle] === vac.id ? { ...x, vacanciers: { ...x.vacanciers, banni } } : x)
    setMessages(marquer('auteur_id'))
    setStatuts(marquer('vacancier_id'))
    setAnnonces(marquer('vacancier_id'))
    setGroupes(marquer('createur_id'))
    toast(banni ? `${vac.pseudo} est banni` : `${vac.pseudo} peut de nouveau publier`, 'succes')
  }

  const fmtDate = iso => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  // Bannir l'auteur depuis son contenu : il fallait retenir le pseudo, aller au
  // 5ᵉ onglet et le chercher parmi tous les vacanciers de la saison, alors que
  // les pseudos peuvent être en double. Même action, même confirmation.
  const bannirAuteur = (id, auteur) => (id && auteur && !auteur.banni)
    ? <DangerBtn onClick={() => toggleBan({ id, pseudo: auteur.pseudo || 'ce vacancier', banni: false })}>Bannir l’auteur</DangerBtn>
    : null

  const q = recherche.trim().toLowerCase()
  const vacanciersAffiches = q ? vacanciers.filter(v => (v.pseudo || '').toLowerCase().includes(q)) : vacanciers

  return (
    <Pile espace="lg">
      <EnTete titre="Modération" sous="Supprimez les contenus inappropriés et gérez les vacanciers." />

      {/* Onglets */}
      {/* Les onglets passent à la ligne : en ligne qui défile, « Vacanciers »
          était hors de l'écran à 320 px et personne ne le trouvait. */}
      <Pile direction="ligne" espace="sm" retour role="group" aria-label="Type de contenu">
        {[['messages', `💬 Messages (${messages.length})`],
          ['statuts', `📣 Statuts (${statuts.length})`],
          ['annonces', `📌 Annonces (${annonces.length})`],
          ['groupes', `🏕️ Groupes (${groupes.length})`],
          ['vacanciers', `👥 Vacanciers (${vacanciers.length})`]].map(([k, l]) => (
          <Puce key={k} taille="sm" actif={tab === k} onClick={() => setTab(k)} style={{ flexShrink: 0, minHeight: 44 }}>{l}</Puce>
        ))}
      </Pile>

      {loading ? <Squelette lignes={4} hauteur={64} libelle="Chargement…" /> : (
        <Bloc padding={0} style={{ overflow: 'hidden' }}>

          {tab === 'messages' && (messages.length === 0
            ? <Vide emoji="💬" texte="Aucun message." />
            : messages.map(m => (
              <Row key={m.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{m.vacanciers?.pseudo}</b>
                    {m.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{m.groupe_nom} · {fmtDate(m.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texteMoyen, marginTop: 2, wordBreak: 'break-word' }}>{m.contenu}</div>
                </div>
                <Actions>
                  <DangerBtn onClick={() => supprimer('messages', m.id, 'Supprimer ce message ?', setMessages)}>Supprimer</DangerBtn>
                  {bannirAuteur(m.auteur_id, m.vacanciers)}
                </Actions>
              </Row>
            )))}

          {tab === 'statuts' && (statuts.length === 0
            ? <Vide emoji="📣" texte="Aucun statut." />
            : statuts.map(s => (
              <Row key={s.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{s.vacanciers?.pseudo}</b>
                    {s.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{fmtDate(s.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texteMoyen, marginTop: 2 }}>{s.emoji} {s.texte}</div>
                </div>
                <Actions>
                  <DangerBtn onClick={() => supprimer('statuts', s.id, 'Supprimer ce statut ?', setStatuts)}>Supprimer</DangerBtn>
                  {bannirAuteur(s.vacancier_id, s.vacanciers)}
                </Actions>
              </Row>
            )))}

          {tab === 'annonces' && (annonces.length === 0
            ? <Vide emoji="📌" texte="Aucune annonce." />
            : annonces.map(a => (
              <Row key={a.id}>
                {a.photo_url
                  ? <img src={a.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: rayon.sm, objectFit: 'cover', flexShrink: 0 }} />
                  : <span style={{ fontSize: 18, flexShrink: 0 }}>{a.vacanciers?.avatar_emoji || '🙂'}</span>}
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    <b style={{ color: jetons.texte }}>{a.vacanciers?.pseudo || '—'}</b>
                    {a.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{fmtDate(a.created_at)}{a.resolu ? ' · résolue' : ''}
                  </div>
                  <div style={{ fontSize: 14, color: jetons.texte, marginTop: 2, fontWeight: graisse.fort }}>{a.titre}</div>
                  {a.description && <div style={{ fontSize: 13, color: jetons.texteMoyen, marginTop: 2, wordBreak: 'break-word' }}>{a.description}</div>}
                </div>
                <Actions>
                  <DangerBtn onClick={() => supprimer('annonces', a.id, 'Supprimer cette annonce ?', setAnnonces)}>Supprimer</DangerBtn>
                  {bannirAuteur(a.vacancier_id, a.vacanciers)}
                </Actions>
              </Row>
            )))}

          {tab === 'groupes' && (groupes.length === 0
            ? <Vide emoji="🏕️" texte="Aucun groupe." />
            : groupes.map(g => (
              <Row key={g.id}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{g.emoji || '👥'}</span>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: jetons.texte, fontWeight: graisse.fort }}>{g.titre}</div>
                  <div style={{ fontSize: 12, color: jetons.texteDoux }}>
                    {g.vacanciers?.pseudo ? `par ${g.vacanciers.pseudo} · ` : ''}{fmtDate(g.created_at)}{g.lieu ? ` · ${g.lieu}` : ''}
                  </div>
                </div>
                <Actions>
                  <DangerBtn onClick={() => supprimer('groupes', g.id, `Supprimer le groupe « ${g.titre} » et toute sa conversation ?`, setGroupes)}>Supprimer</DangerBtn>
                  {bannirAuteur(g.createur_id, g.vacanciers)}
                </Actions>
              </Row>
            )))}

          {tab === 'vacanciers' && vacanciers.length > 0 && (
            <div style={{ padding: '13px 18px', borderBottom: `1px solid ${jetons.surfaceDouce}` }}>
              <Champ type="search" placeholder="Rechercher un pseudo" aria-label="Rechercher un vacancier par pseudo"
                     value={recherche} onChange={e => setRecherche(e.target.value)} />
            </div>
          )}
          {tab === 'vacanciers' && (vacanciersAffiches.length === 0
            ? <Vide emoji="👥" texte={q ? 'Aucun vacancier à ce pseudo.' : 'Aucun vacancier.'} />
            : vacanciersAffiches.map(v => (
              <Row key={v.id}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{v.avatar_emoji || '🙂'}</span>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
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
                    flexShrink: 0, borderRadius: rayon.sm, background: 'transparent', minHeight: 44,
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

// Au téléphone, les boutons passent sous le texte : à côté, ils ne lui
// laissaient qu'une colonne de 110 px à 320 px de large.
function Row({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: espace.md, flexWrap: 'wrap',
      padding: '13px 18px', borderBottom: `1px solid ${jetons.surfaceDouce}`,
    }}>
      {children}
    </div>
  )
}
function Actions({ children }) {
  return (
    <div style={{ display: 'flex', gap: espace.sm, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
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
            style={{ flexShrink: 0, minHeight: 44, borderRadius: rayon.sm, background: 'transparent', border: `1.5px solid ${jetons.danger}` }}>
      {children}
    </Bouton>
  )
}
