import { useId } from 'react'
import { Texte, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function ColorPicker({ label, value, onChange }) {
  // Le libellé était un <label> sans `for` : un lecteur d'écran annonçait
  // « sélecteur de couleur » sans dire de quelle couleur il s'agissait, et un
  // appui sur le texte n'ouvrait pas le sélecteur.
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>
        <Texte variante="libelle" as="span" style={{ fontSize: 12 }}>{label}</Texte>
      </label>
      <Pile direction="ligne" espace="md" aligner="center" style={{ marginTop: espace.sm }}>
        <input
          id={id}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 48, height: 48, borderRadius: rayon.md,
            border: `1.5px solid ${jetons.bordure}`,
            cursor: 'pointer', padding: 3, background: jetons.surface,
          }}
        />
        <Pile espace={2}>
          <Texte variante="corps" as="span" style={{
            fontSize: 15, fontWeight: graisse.fort, color: jetons.texte, fontFamily: 'monospace',
          }}>{value}</Texte>
          <Texte variante="doux" as="span">Cliquer pour changer</Texte>
        </Pile>
        <span aria-hidden="true" style={{
          width: 80, height: 32, borderRadius: rayon.sm,
          background: value,
          border: '1px solid rgba(26, 26, 26, 0.1)',
          marginLeft: 'auto',
        }} />
      </Pile>
    </div>
  )
}
