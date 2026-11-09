import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  TITRE, INTRO, SIGNATURE, MESSAGE_FIN, ECHELLE, IDS_PARCOURS,
  construireEtapes, normaliserCanal, telephoneValide, normaliserTelephone,
} from '../lib/questionnaire'

const DELAI_AVANCE = 260

export default function Questionnaire() {
  const canal = useMemo(
    () => normaliserCanal(new URLSearchParams(window.location.search).get('canal')),
    []
  )
  const [phase, setPhase] = useState('intro') // intro | questions | envoi | fin
  const [index, setIndex] = useState(0)
  const [rep, setRep] = useState({})
  const [erreur, setErreur] = useState('')
  const debut = useRef(null)
  const minuteur = useRef(null)
  const titreRef = useRef(null)

  const etapes = useMemo(() => construireEtapes(rep.parcours), [rep.parcours])
  const q = etapes[index]
  const derniere = index === etapes.length - 1

  useEffect(() => () => clearTimeout(minuteur.current), [])
  useEffect(() => {
    if (phase === 'questions') titreRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [index, phase])

  function commencer() {
    debut.current = Date.now()
    setPhase('questions')
  }

  function repondre(id, valeur, avancer = true) {
    setErreur('')
    setRep((prev) => {
      let suivant = { ...prev, [id]: valeur }
      // Changement de parcours : on efface les réponses de l'autre parcours.
      if (id === 'parcours' && prev.parcours && prev.parcours !== valeur) {
        suivant = { parcours: valeur, f1: prev.f1, f2: prev.f2, f4: prev.f4, f5: prev.f5, telephone: prev.telephone }
      }
      return suivant
    })
    if (avancer) {
      clearTimeout(minuteur.current)
      minuteur.current = setTimeout(() => setIndex((i) => i + 1), DELAI_AVANCE)
    }
  }

  function peutContinuer() {
    if (!q) return false
    const v = rep[q.id]
    if (q.id === 'f3') return v !== undefined && (v !== 'autre' || (rep.f3_autre || '').trim().length > 0)
    if (q.id === 'f5') return v !== 'oui' || telephoneValide(rep.telephone)
    if (q.obligatoire) return v !== undefined && v !== null && v !== ''
    return true
  }

  function suivant() {
    if (!peutContinuer()) {
      if (q.id === 'f5') setErreur('Indiquez un numéro de téléphone valide, ou choisissez « Non ».')
      else if (q.id === 'f3') setErreur('Précisez le point à améliorer.')
      else setErreur('Choisissez une réponse pour continuer.')
      return
    }
    if (derniere) envoyer()
    else setIndex((i) => i + 1)
  }

  function precedent() {
    clearTimeout(minuteur.current)
    setErreur('')
    if (index === 0) setPhase('intro')
    else setIndex((i) => i - 1)
  }

  async function envoyer() {
    setPhase('envoi')
    setErreur('')
    const p = rep.parcours
    const ligne = {
      vague: 1,
      canal,
      parcours: p,
      f1: rep.f1,
      f2: rep.f2,
      f3: rep.f3,
      f3_autre: rep.f3 === 'autre' ? rep.f3_autre.trim().slice(0, 300) : null,
      f4: (rep.f4 || '').trim().slice(0, 2000) || null,
      f5: rep.f5 === 'oui' ? true : rep.f5 === 'non' ? false : null,
      telephone: rep.f5 === 'oui' ? normaliserTelephone(rep.telephone) : null,
      duree_secondes: debut.current ? Math.min(86400, Math.round((Date.now() - debut.current) / 1000)) : null,
    }
    IDS_PARCOURS[p].forEach((id) => { ligne[id] = rep[id] })

    const { error } = await supabase.from('reponses').insert(ligne)
    if (error) {
      console.error(error)
      setErreur('Vos réponses n’ont pas pu être envoyées. Vérifiez votre connexion internet puis appuyez à nouveau sur « Envoyer mes réponses ».')
      setPhase('questions')
      return
    }
    setPhase('fin')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between py-2">
        <img src="/logo-centre-diagnostic.png" alt="Centre Diagnostic" className="h-10 w-auto" />
      </header>

      {phase === 'intro' && <Intro onStart={commencer} />}

      {(phase === 'questions' || phase === 'envoi') && q && (
        <main className="flex flex-1 flex-col">
          <Progression actuel={index + 1} total={etapes.length} />

          <h1
            ref={titreRef}
            tabIndex={-1}
            className="mt-7 text-[1.45rem] font-semibold leading-snug tracking-[-0.01em] text-cdl-encre outline-none sm:text-2xl"
          >
            {q.titre}
          </h1>
          <p className="mt-2 text-sm text-cdl-gris">
            {q.aide || (q.obligatoire ? '' : 'Facultatif.')}
          </p>

          <div className="mt-6 flex-1">
            <Champ q={q} rep={rep} repondre={repondre} onValider={suivant} />
          </div>

          {erreur && (
            <p role="alert" className="mt-5 rounded-xl bg-[#FBEDE9] px-4 py-3 text-sm text-cdl-alerte">{erreur}</p>
          )}

          <nav className="mt-8 flex items-center gap-3">
            <button type="button" onClick={precedent} className="btn-secondaire" disabled={phase === 'envoi'}>
              Précédent
            </button>
            {(!autoAvance(q, rep) || derniere || rep[q.id] !== undefined) && (
              <button type="button" onClick={suivant} className="btn-primaire flex-1" disabled={phase === 'envoi'}>
                {phase === 'envoi'
                  ? 'Envoi en cours…'
                  : derniere
                    ? 'Envoyer mes réponses'
                    : !q.obligatoire && !rep[q.id]
                      ? 'Passer'
                      : 'Suivant'}
              </button>
            )}
          </nav>
        </main>
      )}

      {phase === 'fin' && <Fin parcours={rep.parcours} />}
    </div>
  )
}

// Questions à choix unique : on avance automatiquement après le choix.
function autoAvance(q, rep) {
  if (q.type === 'note' || q.type === 'nps') return true
  if (q.type === 'choix') return !(q.id === 'f3' && rep.f3 === 'autre')
  return false
}

function Intro({ onStart }) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mt-8 h-1.5 w-16 rounded-full bg-gradient-to-r from-cdl-teal to-cdl-ciel" />
      <h1 className="mt-6 text-[1.9rem] font-bold leading-[1.15] tracking-[-0.02em] text-cdl-encre sm:text-4xl">
        {TITRE}
      </h1>
      <div className="mt-6 space-y-3 text-[1.05rem] leading-relaxed text-cdl-encre/90">
        {INTRO.map((p) => <p key={p}>{p}</p>)}
        <p className="font-medium text-cdl-tealfonce">{SIGNATURE}</p>
      </div>
      <div className="mt-auto pt-10">
        <button type="button" onClick={onStart} className="btn-primaire w-full py-4 text-lg">
          Donner mon avis
        </button>
        <p className="mt-3 text-center text-sm text-cdl-gris">Environ 2 minutes, une question par écran</p>
      </div>
    </main>
  )
}

function Progression({ actuel, total }) {
  const pct = Math.round((actuel / total) * 100)
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-cdl-gris">
        <span>Question {actuel} sur {total}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-cdl-ligne"
        role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={actuel}
        aria-label={`Question ${actuel} sur ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-cdl-teal to-cdl-ciel transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Champ({ q, rep, repondre, onValider }) {
  const valeur = rep[q.id]

  if (q.type === 'choix') {
    return (
      <div className="space-y-3" role="radiogroup" aria-label={q.titre}>
        {q.options.map((o) => (
          <Option
            key={o.v}
            choisi={valeur === o.v}
            onClick={() => repondre(q.id, o.v, !(q.id === 'f3' && o.v === 'autre'))}
          >
            {o.l}
          </Option>
        ))}
        {q.id === 'f3' && valeur === 'autre' && (
          <input
            autoFocus
            className="champ mt-1"
            maxLength={300}
            placeholder="Précisez le point à améliorer"
            value={rep.f3_autre || ''}
            onChange={(e) => repondre('f3_autre', e.target.value, false)}
            onKeyDown={(e) => e.key === 'Enter' && onValider()}
          />
        )}
      </div>
    )
  }

  if (q.type === 'note') {
    return (
      <div role="radiogroup" aria-label={q.titre}>
        <div className="space-y-2.5">
          {ECHELLE.map((e) => (
            <button
              key={e.v}
              type="button"
              role="radio"
              aria-checked={valeur === e.v}
              onClick={() => repondre(q.id, e.v)}
              className={`flex w-full items-center gap-4 rounded-xl border-2 bg-white px-4 py-3 text-left transition ${
                valeur === e.v ? 'border-cdl-teal bg-cdl-teal/10' : 'border-cdl-ligne hover:border-cdl-ciel'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                  valeur === e.v ? 'bg-cdl-tealfonce text-white' : 'bg-cdl-brume text-cdl-encre'
                }`}
              >
                {e.v}
              </span>
              <span className="text-[1.05rem] font-medium">{e.l}</span>
            </button>
          ))}
        </div>
        {!q.sansNonConcerne && (
          <button
            type="button"
            role="radio"
            aria-checked={valeur === 0}
            onClick={() => repondre(q.id, 0)}
            className={`mt-4 w-full rounded-xl border-2 border-dashed px-4 py-3 text-center font-medium transition ${
              valeur === 0 ? 'border-cdl-teal bg-cdl-teal/10 text-cdl-encre' : 'border-cdl-ligne text-cdl-gris hover:border-cdl-gris'
            }`}
          >
            {q.nonConcerne || 'Non concerné'}
          </button>
        )}
      </div>
    )
  }

  if (q.type === 'nps') {
    return (
      <div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label={q.titre}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={valeur === n}
              aria-label={`${n} sur 10`}
              onClick={() => repondre(q.id, n)}
              className={`aspect-square rounded-xl border-2 text-lg font-semibold transition ${
                valeur === n ? 'border-cdl-tealfonce bg-cdl-tealfonce text-white' : 'border-cdl-ligne bg-white hover:border-cdl-ciel'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-sm text-cdl-gris">
          <span>0 = pas du tout</span>
          <span>10 = certainement</span>
        </div>
      </div>
    )
  }

  if (q.type === 'texte') {
    return (
      <div>
        <textarea
          className="champ min-h-[9rem] resize-y"
          maxLength={2000}
          placeholder="Votre réponse"
          value={valeur || ''}
          onChange={(e) => repondre(q.id, e.target.value, false)}
        />
        <p className="mt-1 text-right text-xs text-cdl-gris">{(valeur || '').length} / 2000</p>
      </div>
    )
  }

  if (q.type === 'recontact') {
    return (
      <div className="space-y-3" role="radiogroup" aria-label={q.titre}>
        <Option choisi={valeur === 'oui'} onClick={() => repondre('f5', 'oui', false)}>Oui</Option>
        {valeur === 'oui' && (
          <div className="pl-1">
            <label htmlFor="tel" className="mb-1.5 block text-sm font-medium">Numéro de téléphone</label>
            <input
              id="tel"
              autoFocus
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="champ"
              placeholder="Ex. 077 12 34 56"
              value={rep.telephone || ''}
              onChange={(e) => repondre('telephone', e.target.value, false)}
            />
          </div>
        )}
        <Option choisi={valeur === 'non'} onClick={() => repondre('f5', 'non', false)}>Non</Option>
      </div>
    )
  }
  return null
}

function Option({ choisi, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={choisi}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 bg-white px-4 py-3.5 text-left text-[1.05rem] leading-snug transition ${
        choisi ? 'border-cdl-teal bg-cdl-teal/10' : 'border-cdl-ligne hover:border-cdl-ciel'
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          choisi ? 'border-cdl-tealfonce' : 'border-cdl-gris/60'
        }`}
      >
        {choisi && <span className="h-2.5 w-2.5 rounded-full bg-cdl-tealfonce" />}
      </span>
      <span className="font-medium">{children}</span>
    </button>
  )
}

function Fin({ parcours }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      <svg viewBox="0 0 64 64" className="h-20 w-20" aria-hidden>
        <path
          d="M32 54 C14 42 6 32 6 21 C6 13 12 7 20 7 C25.5 7 29.5 10 32 14 C34.5 10 38.5 7 44 7 C52 7 58 13 58 21 C58 32 50 42 32 54 Z"
          fill="none" stroke="url(#g)" strokeWidth="4" strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#41B8AC" />
            <stop offset="1" stopColor="#5AC2EC" />
          </linearGradient>
        </defs>
      </svg>
      <h1 className="mt-6 text-3xl font-bold tracking-[-0.02em]">Merci !</h1>
      <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-cdl-encre/90">
        {MESSAGE_FIN[parcours] || MESSAGE_FIN.consultation}
      </p>
      <p className="mt-6 font-medium text-cdl-tealfonce">{SIGNATURE}</p>
    </main>
  )
}
