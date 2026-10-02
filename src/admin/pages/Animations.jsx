import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { toast } from '../../toast'
import Sheet from '../../components/Sheet'
import AnimationForm from '../components/AnimationForm'
import { dupliquerAnimation } from '../lib/animations'
import { Bloc, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, Badge, Squelette, Vide, Icone, couleur as jetons, espace, graisse, rayon, texte as tailles } from '../../design'

export default function Animations({ camping }) {
  const [animations, setAnimations] = useState([])
  const [counts, setCounts]         = useState({}) // animId -> nb inscrits
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editAnim, setEditAnim]     = useState(null)
  const [copie, setCopie]           = useState(null) // animation dupliquée, à créer
  const [saving, setSaving]         = useState(false)
  const [inscritsModal, setInscritsModal] = useState(null) // { anim, vacanciers, chargement, erreur }

  async function load() {
    const { data: anims } = await supabase
      .from('animations')
      .select('*')
      .eq('camping_id', camping.id)
      .order('debut', { ascending: false })

    const animsList = anims || []
    setAnimations(animsList)

    if (animsList.length > 0) {
      const { data: allInscs } = await supabase
        .from('inscriptions')
        .select('animation_id')
        .in('animation_id', animsList.map(a => a.id))
      const c = {}
      for (const ins of (allInscs || [])) {
        c[ins.animation_id] = (c[ins.animation_id] || 0) + 1
      }
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id])

  // Aucune de ces trois actions ne vérifiait son résultat : un échec (réseau,
  // session expirée) fermait le formulaire comme si tout était enregistré, et
  // le gérant découvrait plus tard une animation jamais créée.
  async function togglePublie(anim) {
    const { data, error } = await supabase
      .from('animations')
      .update({ publiee: !anim.publiee })
      .eq('id', anim.id)
      .select().single()
    if (error || !data) { console.error('Publication échouée :', error); toast('Impossible de changer la publication.', 'erreur'); return }
    setAnimations(prev => prev.map(a => a.id === data.id ? data : a))
    toast(data.publiee ? 'Animation publiée : les vacanciers sont prévenus' : 'Animation repassée en brouillon', 'succes')
  }

  async function supprimer(animId) {
    if (!confirm('Supprimer cette animation ? Les inscriptions seront aussi supprimées.')) return
    const { error } = await supabase.from('animations').delete().eq('id', animId)   // inscriptions : en cascade
    if (error) { console.error('Suppression échouée :', error); toast('Suppression impossible pour le moment.', 'erreur'); return }
    setAnimations(prev => prev.filter(a => a.id !== animId))
    setCounts(prev => { const c = { ...prev }; delete c[animId]; return c })
  }

  async function sauvegarder(formData) {
    setSaving(true)
    const { data, error } = editAnim
      ? await supabase.from('animations').update(formData).eq('id', editAnim.id).select().single()
      : await supabase.from('animations').insert({ ...formData, camping_id: camping.id }).select().single()
    setSaving(false)
    if (error || !data) {
      console.error('Enregistrement échoué :', error)
      toast("L'animation n'a pas pu être enregistrée. Réessayez.", 'erreur')
      return   // le formulaire reste ouvert : rien n'est perdu
    }
    setAnimations(prev => editAnim ? prev.map(a => a.id === data.id ? data : a) : [data, ...prev])
    toast(editAnim ? 'Animation modifiée' : 'Animation créée', 'succes')
    fermerForm()
  }

  function fermerForm() { setShowForm(false); setEditAnim(null); setCopie(null) }

  // L'aquagym de tous les matins se retapait champ par champ. La copie tombe
  // une semaine plus tard, à la même heure, et reste modifiable avant création.
  function dupliquer(anim) {
    setEditAnim(null)
    setCopie(dupliquerAnimation(anim))
    setShowForm(true)
  }

  // À venir d'abord, dans l'ordre du calendrier ; les passées ensuite, en
  // retrait. Triée du plus lointain au plus ancien, la liste commençait par
  // la fin de saison et noyait la soirée du jour au milieu.
  const [seuil] = useState(() => Date.now() - 2 * 3600 * 1000)   // figé à l'ouverture de la page
  const aVenir = animations.filter(a => !a.debut || new Date(a.debut).getTime() >= seuil)
    .sort((a, b) => new Date(a.debut || 0) - new Date(b.debut || 0))
  const passees = animations.filter(a => a.debut && new Date(a.debut).getTime() < seuil)
    .sort((a, b) => new Date(b.debut) - new Date(a.debut))

  // La feuille s'ouvre tout de suite, avec un indicateur : le gérant ne
  // savait pas si son appui avait été pris en compte, ni si la liste vide
  // venait d'un échec de chargement.
  async function voirInscrits(anim) {
    setInscritsModal({ anim, vacanciers: [], chargement: true, erreur: false })
    const { data, error } = await supabase
      .from('inscriptions')
      .select('*, vacanciers(pseudo, emplacement, tranche_age, avec)')
      .eq('animation_id', anim.id)
      .order('created_at')
    if (error) console.error('Chargement des inscrits échoué :', error)
    setInscritsModal(m => m?.anim.id === anim.id
      ? { anim, vacanciers: (data || []).map(i => i.vacanciers), chargement: false, erreur: !!error }
      : m)
  }

  // Pour la feuille d'appel au bord de la piscine : un texte à coller dans
  // un message ou à imprimer.
  async function copierInscrits({ anim, vacanciers }) {
    const quand = anim.debut
      ? ` — ${new Date(anim.debut).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      : ''
    const lignes = vacanciers.map((v, i) =>
      `${i + 1}. ${v?.pseudo || '—'}${v?.emplacement ? ` (empl. ${v.emplacement})` : ''}`)
    const texte = [`${anim.titre}${quand}`, `${vacanciers.length} inscrit${vacanciers.length > 1 ? 's' : ''}`, '', ...lignes].join('\n')
    try {
      await navigator.clipboard.writeText(texte)
      toast('Liste copiée', 'succes')
    } catch {
      toast('Copie impossible ici.', 'erreur')
    }
  }

  return (
    <Pile espace="lg">
      {/* retour : sur un petit téléphone, le bouton passe sous le titre au lieu
          de sortir de l'écran. */}
      <Pile direction="ligne" espace="md" justifier="space-between" aligner="flex-start" retour>
        <EnTete
          titre="Animations"
          sous={`${animations.length} animation${animations.length !== 1 ? 's' : ''} au total`}
        />
        <Bouton onClick={() => { setEditAnim(null); setShowForm(true) }} style={{ flexShrink: 0 }}>
          + Nouvelle animation
        </Bouton>
      </Pile>

      {loading ? (
        <Squelette lignes={3} hauteur={90} libelle="Chargement…" />
      ) : animations.length === 0 ? (
        <Bloc style={{ border: `2px dashed ${jetons.bordure}` }}>
          <Vide
            emoji="📅"
            titre="Aucune animation pour le moment"
            texte="Cours de natation, tournoi de pétanque, soirée barbecue… créez votre première animation !"
            action={
              <Bouton onClick={() => { setEditAnim(null); setShowForm(true) }}>
                + Créer ma première animation
              </Bouton>
            }
          />
        </Bloc>
      ) : (
        <Pile espace="lg">
          {[['À venir', aVenir], ['Passées', passees]].filter(([, liste]) => liste.length).map(([titreListe, liste]) => (
          <Pile key={titreListe} espace="sm" style={titreListe === 'Passées' ? { opacity: 0.72 } : undefined}>
          <Texte variante="libelle" as="h2">{titreListe} · {liste.length}</Texte>
          {liste.map(anim => {
            const nb = counts[anim.id] || 0
            const debut = anim.debut ? new Date(anim.debut) : null
            // Comparaison explicite : « places_max && … » valait 0 pour une
            // animation sans limite, et React affichait ce 0 à côté du titre.
            const complet = anim.places_max > 0 && nb >= anim.places_max
            return (
              <Bloc key={anim.id} padding="16px 18px" style={{
                borderLeft: `4px solid ${anim.publiee ? jetons.marque : jetons.bordure}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span aria-hidden="true" style={{
                  width: 44, height: 44, borderRadius: rayon.md,
                  background: jetons.fond, fontSize: 22, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {anim.emoji || '🎉'}
                </span>

                {/* Infos */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Texte variante="sousTitre" as="span" style={{ fontSize: tailles.moyen }}>{anim.titre}</Texte>
                    <Badge ton={anim.publiee ? 'succes' : 'neutre'}>
                      {anim.publiee ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {complet && <Badge ton="danger">Complet</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: jetons.texteDoux, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {debut && <span>📅 {debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    {anim.lieu && <span>📍 {anim.lieu}</span>}
                  </div>
                  {/* Un lien souligné de 19 px de haut : trop petit pour le
                      doigt. Un vrai bouton, de 44 px. */}
                  <button
                    type="button"
                    onClick={() => voirInscrits(anim)}
                    aria-label={`Voir les inscrits : ${nb}${anim.places_max > 0 ? ` sur ${anim.places_max}` : ''}`}
                    style={{
                      whiteSpace: 'nowrap',
                      marginTop: espace.sm, minHeight: 44, padding: `0 ${espace.md}px`,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: jetons.marqueTexte, fontWeight: graisse.fort, cursor: 'pointer',
                      background: jetons.fond, border: `1px solid ${jetons.bordure}`, borderRadius: rayon.sm,
                      fontFamily: 'inherit', fontSize: tailles.petit,
                    }}
                  >
                    👥 {nb}{anim.places_max > 0 ? `/${anim.places_max}` : ''} inscrit{nb > 1 ? 's' : ''}
                    <Icone nom="chevron" taille={15} />
                  </button>
                </div>
                </div>

                {/* Actions, sur leur propre ligne : à côté du titre, elles
                    l'écrasaient sur trois lignes dès que l'écran rétrécissait. */}
                <Pile direction="ligne" espace="sm" retour justifier="flex-end">
                  <Bouton
                    variante="secondaire" taille="sm"
                    onClick={() => togglePublie(anim)}
                    style={{
                      ...actionStyle, border: 'none',
                      background: anim.publiee ? jetons.alerteFond : '#f0fdf4',
                      color: anim.publiee ? jetons.alerte : jetons.succes,
                    }}
                  >
                    {anim.publiee ? 'Dépublier' : 'Publier'}
                  </Bouton>
                  <Bouton variante="secondaire" taille="sm"
                          onClick={() => { setCopie(null); setEditAnim(anim); setShowForm(true) }}
                          style={{ ...actionStyle, border: 'none', background: jetons.surfaceDouce }}>
                    Modifier
                  </Bouton>
                  <Bouton variante="secondaire" taille="sm" onClick={() => dupliquer(anim)}
                          style={{ ...actionStyle, border: 'none', background: jetons.surfaceDouce }}>
                    Dupliquer
                  </Bouton>
                  <Bouton variante="danger" taille="sm" onClick={() => supprimer(anim.id)}
                          style={actionStyle}>
                    Supprimer
                  </Bouton>
                </Pile>
              </Bloc>
            )
          })}
          </Pile>
          ))}
        </Pile>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <Sheet onClose={fermerForm}>
          <Texte variante="section" as="h2" style={{ marginBottom: espace.xl }}>
            {editAnim ? 'Modifier l’animation' : copie ? 'Dupliquer l’animation' : 'Nouvelle animation'}
          </Texte>
          <AnimationForm
            initial={editAnim || copie}
            onSave={sauvegarder}
            onCancel={fermerForm}
            saving={saving}
          />
        </Sheet>
      )}

      {/* Modal inscrits */}
      {inscritsModal && (
        <Sheet onClose={() => setInscritsModal(null)}>
          <Pile espace="xs" style={{ marginBottom: espace.xl }}>
            <Texte variante="section" as="h2">
              {inscritsModal.anim.emoji} {inscritsModal.anim.titre}
            </Texte>
            {!inscritsModal.chargement && !inscritsModal.erreur && (
              <Texte variante="corps">
                {inscritsModal.vacanciers.length} inscrit{inscritsModal.vacanciers.length !== 1 ? 's' : ''}
              </Texte>
            )}
          </Pile>
          {inscritsModal.chargement ? (
            <Squelette lignes={3} hauteur={44} libelle="Chargement des inscrits…" />
          ) : inscritsModal.erreur ? (
            <Vide emoji="⚠️" texte="Impossible de charger les inscrits. Vérifiez la connexion et réessayez." />
          ) : inscritsModal.vacanciers.length === 0 ? (
            <Vide emoji="👥" texte="Aucun inscrit." />
          ) : (
            <Pile espace="sm">
              {inscritsModal.vacanciers.map((v, i) => (
                <Pile key={i} direction="ligne" espace="md" aligner="center"
                      style={{ padding: '10px 0', borderBottom: `1px solid ${jetons.fond}` }}>
                  <span aria-hidden="true" style={{
                    width: 36, height: 36, borderRadius: rayon.rond,
                    background: 'var(--cc-accent-voile)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {v?.pseudo?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <Texte variante="corps" style={{ fontWeight: graisse.fort, color: jetons.texte }}>{v?.pseudo}</Texte>
                    <Texte variante="doux">
                      {[v?.emplacement && `Empl. ${v.emplacement}`, v?.tranche_age, v?.avec].filter(Boolean).join(' · ')}
                    </Texte>
                  </div>
                </Pile>
              ))}
            </Pile>
          )}
          {!inscritsModal.chargement && inscritsModal.vacanciers.length > 0 && (
            <Bouton taille="lg" pleineLargeur onClick={() => copierInscrits(inscritsModal)}
                    style={{ marginTop: espace.xl }}>
              Copier la liste
            </Bouton>
          )}
          <Bouton variante="secondaire" taille="lg" pleineLargeur
                  onClick={() => setInscritsModal(null)} style={{ marginTop: espace.md }}>
            Fermer
          </Bouton>
        </Sheet>
      )}
    </Pile>
  )
}

// Boutons d'action d'une animation : 44 px, la cible minimale au doigt.
const actionStyle = { borderRadius: rayon.sm, minHeight: 44 }
