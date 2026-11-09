import { INCLURE_C6, F3_OPTIONS, f3Options, C2_OPTIONS, S1_OPTIONS, CANAUX } from './questionnaire'

export const SEUIL_FIABILITE = 30

// Étapes notées de 1 à 5, reliées au thème F3 correspondant (pour le croisement).
export const ETAPES = {
  consultation: [
    { id: 'c1', libelle: 'Accueil et formalités', theme: 'accueil' },
    { id: 'c3', libelle: 'Explications du médecin', theme: 'explications' },
    { id: 'c4', libelle: 'Remise des résultats', theme: 'resultats' },
    { id: 'c5', libelle: 'Propreté et confort des locaux', theme: 'proprete' },
    ...(INCLURE_C6 ? [{ id: 'c6', libelle: 'Clarté des tarifs et de la facture', theme: 'tarifs' }] : []),
  ],
  sejour: [
    { id: 's2', libelle: 'Accueil et formalités d’admission', theme: 'accueil' },
    { id: 's3', libelle: 'Écoute et disponibilité des soignants', theme: 'ecoute' },
    { id: 's4', libelle: 'Explications des médecins', theme: 'explications' },
    { id: 's5', libelle: 'Chambre : propreté, confort, calme', theme: 'proprete' },
    { id: 's6', libelle: 'Organisation de la sortie', theme: 'sortie' },
  ],
}

export const libelleTheme = (v) => F3_OPTIONS.find((o) => o.v === v)?.l || v || '—'
export const libelleC2 = (v) => C2_OPTIONS.find((o) => o.v === v)?.l || '—'
export const libelleS1 = (v) => S1_OPTIONS.find((o) => o.v === v)?.l || '—'
export const libelleCanal = (v) => CANAUX[v]?.label || v

// % de notes 4 et 5, « Non concerné » (0) exclu
export function satisfaction(rows, cle) {
  const v = rows.map((r) => r[cle]).filter((x) => x >= 1 && x <= 5)
  return { pct: v.length ? (100 * v.filter((x) => x >= 4).length) / v.length : null, n: v.length }
}

// NPS = % de 9-10 moins % de 0 à 6
export function nps(rows) {
  const v = rows.map((r) => r.f2).filter((x) => x !== null && x !== undefined)
  if (!v.length) return { score: null, n: 0, promoteurs: 0, detracteurs: 0, passifs: 0 }
  const promoteurs = (100 * v.filter((x) => x >= 9).length) / v.length
  const detracteurs = (100 * v.filter((x) => x <= 6).length) / v.length
  return { score: promoteurs - detracteurs, n: v.length, promoteurs, detracteurs, passifs: 100 - promoteurs - detracteurs }
}

// % de patients reçus en moins de 30 minutes (C2)
export function attente(rows) {
  const v = rows.map((r) => r.c2).filter(Boolean)
  return { pct: v.length ? (100 * v.filter((x) => x === 'moins_15' || x === '15_30').length) / v.length : null, n: v.length }
}

export function repartition(rows, cle, options) {
  const v = rows.map((r) => r[cle]).filter((x) => x !== null && x !== undefined && x !== '')
  return options.map((o) => {
    const n = v.filter((x) => x === o.v).length
    return { ...o, n, pct: v.length ? (100 * n) / v.length : 0 }
  })
}

export const repartitionF3 = (rows, parcours) => repartition(rows, 'f3', f3Options(parcours))

export function repartitionCanaux(rows) {
  return Object.keys(CANAUX)
    .map((c) => ({ v: c, l: CANAUX[c].label, n: rows.filter((r) => r.canal === c).length }))
    .filter((x) => x.n > 0)
}

export const repartitionNotes = (rows, cle) =>
  [1, 2, 3, 4, 5].map((v) => ({ v, n: rows.filter((r) => r[cle] === v).length }))

/**
 * Croisement des deux lectures du cahier des charges :
 * les étapes les moins bien notées ET les thèmes les plus cités en F3.
 * Mal noté = parmi les 3 scores les plus bas ; souvent cité = parmi les 3 thèmes les plus cités.
 */
export function priorites(rows, parcours) {
  const lignes = []
  ETAPES[parcours].forEach((e) => {
    lignes.push({ theme: e.theme, libelle: e.libelle, question: e.id.toUpperCase(), score: satisfaction(rows, e.id).pct })
  })
  if (parcours === 'consultation') {
    lignes.push({ theme: 'attente', libelle: 'Temps d’attente (reçus en moins de 30 min)', question: 'C2', score: attente(rows).pct })
  }
  const f3 = repartitionF3(rows, parcours)
  // Thèmes cités sans étape notée (repas, tarifs…)
  f3.filter((o) => o.n > 0 && !['rien', 'autre'].includes(o.v) && !lignes.some((l) => l.theme === o.v)).forEach((o) => {
    lignes.push({ theme: o.v, libelle: o.l, question: 'F3 seul', score: null })
  })
  lignes.forEach((l) => { l.citations = f3.find((o) => o.v === l.theme)?.pct ?? 0 })

  const basNotes = lignes.filter((l) => l.score !== null).sort((a, b) => a.score - b.score).slice(0, 3).map((l) => l.theme)
  const plusCites = lignes.filter((l) => l.citations > 0).sort((a, b) => b.citations - a.citations).slice(0, 3).map((l) => l.theme)

  lignes.forEach((l) => {
    const mal = basNotes.includes(l.theme)
    const cite = plusCites.includes(l.theme)
    l.statut = mal && cite ? 'prioritaire' : mal || cite ? 'surveiller' : 'ok'
  })
  const rang = { prioritaire: 0, surveiller: 1, ok: 2 }
  return lignes.sort((a, b) => rang[a.statut] - rang[b.statut] || b.citations - a.citations || (a.score ?? 101) - (b.score ?? 101))
}

export const fmtPct = (x) => (x === null || x === undefined ? '—' : `${Math.round(x)} %`)
export const fmtNps = (x) => (x === null || x === undefined ? '—' : `${x > 0 ? '+' : ''}${Math.round(x)}`)
export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { timeZone: 'Africa/Libreville', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
