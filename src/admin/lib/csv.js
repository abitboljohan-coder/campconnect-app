/**
 * Cellule CSV sûre pour Excel, LibreOffice et Google Sheets.
 *
 * Les pseudos sont saisis par des vacanciers anonymes. Une valeur qui commence
 * par = + - @, une tabulation ou un retour chariot est lue comme une formule
 * (« injection CSV ») : `=LIEN_HYPERTEXTE(…)` s'exécutait à l'ouverture de
 * l'export. L'apostrophe en tête force le tableur à la traiter comme du texte.
 * Les guillemets ne suffisent pas : ils délimitent la cellule, sans la neutraliser.
 */
export function celluleCsv(valeur) {
  let s = String(valeur ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

/** Fichier CSV complet (séparateur « ; » et BOM UTF-8, attendus par Excel en français). */
export function versCsv(entetes, lignes) {
  return '﻿' + [entetes, ...lignes]
    .map(ligne => ligne.map(celluleCsv).join(';'))
    .join('\r\n')
}
