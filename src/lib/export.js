import { libelleTheme, libelleC2, libelleS1, libelleCanal } from './indicateurs'

const note = (x) => (x === null || x === undefined ? '' : x === 0 ? 'Non concerné' : x)

const COLONNES = [
  ['Date', (r) => new Date(r.created_at).toLocaleString('fr-FR', { timeZone: 'Africa/Libreville' })],
  ['Vague', (r) => r.vague],
  ['Parcours', (r) => (r.parcours === 'sejour' ? 'Séjour' : 'Consultation')],
  ['Canal', (r) => libelleCanal(r.canal)],
  ['C1 Accueil et formalités', (r) => note(r.c1)],
  ['C2 Attente', (r) => (r.c2 ? libelleC2(r.c2) : '')],
  ['C3 Explications', (r) => note(r.c3)],
  ['C4 Résultats', (r) => (r.c4 === 0 ? 'Pas d’examen' : note(r.c4))],
  ['C5 Propreté locaux', (r) => note(r.c5)],
  ['C6 Tarifs et facture', (r) => note(r.c6)],
  ['S1 Type de séjour', (r) => (r.s1 ? libelleS1(r.s1) : '')],
  ['S2 Accueil admission', (r) => note(r.s2)],
  ['S3 Écoute soignants', (r) => note(r.s3)],
  ['S4 Explications médecins', (r) => note(r.s4)],
  ['S5 Chambre', (r) => note(r.s5)],
  ['S6 Sortie', (r) => note(r.s6)],
  ['F1 Satisfaction globale', (r) => r.f1],
  ['F2 Recommandation (0-10)', (r) => r.f2],
  ['F3 Priorité', (r) => libelleTheme(r.f3)],
  ['F3 Autre (précision)', (r) => r.f3_autre || ''],
  ['F4 Une chose à changer', (r) => r.f4 || ''],
  ['F5 Recontact', (r) => (r.f5 === true ? 'Oui' : r.f5 === false ? 'Non' : '')],
  ['Téléphone', (r) => r.telephone || ''],
  ['Thème verbatim', (r) => (r.theme_verbatim ? libelleTheme(r.theme_verbatim) : '')],
  ['Durée (s)', (r) => r.duree_secondes ?? ''],
]

const echapper = (v) => {
  const s = String(v ?? '')
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Séparateur « ; » et BOM UTF-8 : s'ouvre directement dans Excel en français.
export function exporterCsv(rows, nomFichier, colonnes = COLONNES) {
  const entete = colonnes.map(([t]) => echapper(t)).join(';')
  const corps = rows.map((r) => colonnes.map(([, f]) => echapper(f(r))).join(';'))
  const blob = new Blob(['\uFEFF' + [entete, ...corps].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const COLONNES_VOLONTAIRES = [
  COLONNES[0], COLONNES[2], COLONNES[3],
  ['Téléphone', (r) => r.telephone || ''],
  COLONNES[16], COLONNES[18], COLONNES[20],
]
