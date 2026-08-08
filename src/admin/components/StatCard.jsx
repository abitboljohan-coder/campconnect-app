import { Carte, Texte, Pile, couleur as jetons, espace, rayon } from '../../design'

// La couleur reste une propriété : les statistiques de l'administration se
// distinguent entre elles par la teinte (vert pour les vacanciers, orange pour
// les signalements…), ce que l'accent unique du camping ne peut pas exprimer.
export default function StatCard({ icon, value, label, sub, color = jetons.marque }) {
  return (
    <Carte hauteur="posee" padding={20} style={{ borderRadius: 14 }}>
      <Pile direction="ligne" justifier="space-between" aligner="flex-start">
        <div>
          <Texte variante="titre" style={{ fontSize: 28, lineHeight: 1 }}>{value}</Texte>
          <Texte variante="doux" style={{ marginTop: 6 }}>{label}</Texte>
          {sub && <Texte variante="doux" style={{ color, marginTop: espace.xs }}>{sub}</Texte>}
        </div>
        <span aria-hidden="true" style={{
          width: 44, height: 44, borderRadius: rayon.md,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          {icon}
        </span>
      </Pile>
    </Carte>
  )
}
