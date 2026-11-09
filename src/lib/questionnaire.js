// Questionnaire Vague 1 — formulations figées (règle d'or : ne pas les modifier
// d'une vague à l'autre, sinon la comparaison ne vaut plus).

// Point ouvert du cahier des charges : question dédiée à la facturation (C6).
// Passer à true pour l'activer (la colonne existe déjà en base).
export const INCLURE_C6 = false

export const TITRE = 'Votre avis sur votre venue au Centre Diagnostic de Libreville'

export const INTRO = [
  'Chère patiente, cher patient,',
  "Votre avis nous aide à améliorer l'accueil et la prise en charge au CDL. Ce questionnaire prend environ 2 minutes. Vos réponses sont confidentielles.",
  'Merci pour votre temps.',
]
export const SIGNATURE = 'Service Expérience Patient & Hospitalité'

// Message de fin : à remplacer par le texte actuel si besoin.
// « prompt rétablissement » retiré du parcours Consultation.
export const MESSAGE_FIN = {
  consultation: 'Merci pour vos réponses, elles ont bien été enregistrées. Toute l’équipe du Centre Diagnostic vous remercie de votre confiance. Prenez soin de vous.',
  sejour: 'Merci pour vos réponses, elles ont bien été enregistrées. Toute l’équipe du Centre Diagnostic vous remercie de votre confiance et vous souhaite un prompt rétablissement.',
}

export const ECHELLE = [
  { v: 1, l: 'Très insatisfait' },
  { v: 2, l: 'Insatisfait' },
  { v: 3, l: 'Moyen' },
  { v: 4, l: 'Satisfait' },
  { v: 5, l: 'Très satisfait' },
]

// Collecteurs : un lien (et un QR code) par canal de diffusion.
export const CANAUX = {
  accueil: { label: 'Accueil', parcours: 'consultation', support: 'QR code à l’accueil' },
  salle_attente: { label: 'Salle d’attente', parcours: 'consultation', support: 'QR code en salle d’attente' },
  caisse: { label: 'Caisse', parcours: 'consultation', support: 'QR code à la caisse' },
  sortie: { label: 'Document de sortie', parcours: 'sejour', support: 'QR code sur le document de sortie' },
  sms: { label: 'SMS après la sortie', parcours: 'sejour', support: 'Lien envoyé par SMS le lendemain de la sortie' },
  direct: { label: 'Lien direct', parcours: null, support: 'Lien sans canal précisé' },
}

export function normaliserCanal(brut) {
  const c = (brut || '').toLowerCase().trim().replace(/-/g, '_')
  return CANAUX[c] ? c : 'direct'
}

export const PARCOURS = {
  consultation: 'Consultation',
  sejour: 'Séjour',
}

// --- Aiguillage -------------------------------------------------------
const Q1 = {
  id: 'parcours',
  type: 'choix',
  obligatoire: true,
  titre: 'Lors de votre dernière venue au CDL, vous étiez venu(e) pour :',
  options: [
    { v: 'consultation', l: 'Une consultation, un examen (laboratoire, imagerie) ou tout autre passage sans hospitalisation' },
    { v: 'sejour', l: 'Une hospitalisation (médecine, chirurgie, maternité), y compris en ambulatoire' },
  ],
}

// --- Parcours Consultation ---------------------------------------------
export const C2_OPTIONS = [
  { v: 'moins_15', l: 'Moins de 15 minutes' },
  { v: '15_30', l: 'De 15 à 30 minutes' },
  { v: '30_60', l: 'De 30 minutes à 1 heure' },
  { v: 'plus_60', l: 'Plus d’1 heure' },
]

const CONSULTATION = [
  { id: 'c1', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous l’accueil et les formalités (prise de rendez-vous, accueil, caisse) ?' },
  { id: 'c2', type: 'choix', obligatoire: true, titre: 'Combien de temps avez-vous attendu avant d’être reçu(e) ?', options: C2_OPTIONS },
  { id: 'c3', type: 'note', obligatoire: true, titre: 'Les explications du médecin ou du professionnel qui vous a reçu(e) étaient-elles claires ?' },
  { id: 'c4', type: 'note', obligatoire: true, nonConcerne: 'Pas d’examen', titre: 'Si vous avez fait un examen (laboratoire, imagerie), comment évaluez-vous la remise de vos résultats : délai et clarté ?' },
  { id: 'c5', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous la propreté et le confort des locaux (salle d’attente, cabinets, sanitaires) ?' },
  ...(INCLURE_C6
    ? [{ id: 'c6', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous la clarté des tarifs et de la facture ?' }]
    : []),
]

// --- Parcours Séjour -----------------------------------------------------
export const S1_OPTIONS = [
  { v: 'medecine', l: 'Hospitalisation en médecine' },
  { v: 'chirurgie', l: 'Intervention chirurgicale' },
  { v: 'maternite', l: 'Accouchement / maternité' },
]

const SEJOUR = [
  { id: 's1', type: 'choix', obligatoire: true, titre: 'Quel type de séjour avez-vous effectué ?', options: S1_OPTIONS },
  { id: 's2', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous votre accueil et les formalités d’admission ?' },
  { id: 's3', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous l’écoute et la disponibilité de l’équipe soignante (infirmiers, aides-soignants) ?' },
  { id: 's4', type: 'note', obligatoire: true, titre: 'Les explications des médecins sur votre état de santé et votre traitement étaient-elles claires ?' },
  { id: 's5', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous votre chambre : propreté, confort et calme ?' },
  { id: 's6', type: 'note', obligatoire: true, titre: 'Comment évaluez-vous l’organisation de votre sortie (informations, ordonnances, facture) ?' },
]

// --- Questions de fin communes -----------------------------------------
export const F3_OPTIONS = [
  { v: 'accueil', l: 'L’accueil et les formalités' },
  { v: 'attente', l: 'Le temps d’attente' },
  { v: 'explications', l: 'Les explications des médecins' },
  { v: 'ecoute', l: 'L’écoute et la disponibilité des soignants' },
  { v: 'proprete', l: 'La propreté et le confort des locaux ou de la chambre' },
  { v: 'repas', l: 'Les repas', seulement: 'sejour' },
  { v: 'resultats', l: 'La remise des résultats d’examens', seulement: 'consultation' },
  { v: 'tarifs', l: 'La clarté des tarifs et de la facture' },
  { v: 'sortie', l: 'L’organisation de la sortie', seulement: 'sejour' },
  { v: 'rien', l: 'Rien de particulier' },
  { v: 'autre', l: 'Autre (précisez)' },
]

export const f3Options = (parcours) =>
  F3_OPTIONS.filter((o) => !o.seulement || o.seulement === parcours)

const FIN = [
  { id: 'f1', type: 'note', obligatoire: true, sansNonConcerne: true, titre: 'Dans l’ensemble, êtes-vous satisfait(e) de votre venue au CDL ?' },
  { id: 'f2', type: 'nps', obligatoire: true, titre: 'Sur une échelle de 0 à 10, recommanderiez-vous le CDL à un proche ?' },
  { id: 'f3', type: 'choix', obligatoire: true, titre: 'Sur quel point devrions-nous progresser en priorité ?', aide: 'Un seul choix.' },
  { id: 'f4', type: 'texte', obligatoire: false, titre: 'Si vous pouviez changer une seule chose au CDL, ce serait…' },
  { id: 'f5', type: 'recontact', obligatoire: false, titre: 'Accepteriez-vous d’être recontacté(e) dans quelques semaines pour nous dire si les choses se sont améliorées ?' },
]

export function construireEtapes(parcours) {
  const p = parcours || 'consultation'
  const fin = FIN.map((q) => (q.id === 'f3' ? { ...q, options: f3Options(p) } : q))
  return [Q1, ...(p === 'sejour' ? SEJOUR : CONSULTATION), ...fin]
}

export const IDS_PARCOURS = {
  consultation: CONSULTATION.map((q) => q.id),
  sejour: SEJOUR.map((q) => q.id),
}

// Téléphone : formats gabonais usuels (077 12 34 56, +241 77 12 34 56…)
export function telephoneValide(t) {
  const n = (t || '').replace(/[\s.\-()]/g, '')
  return /^\+?[0-9]{8,15}$/.test(n)
}
export function normaliserTelephone(t) {
  return (t || '').replace(/[\s.\-()]/g, '')
}
