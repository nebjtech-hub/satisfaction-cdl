import { useMemo, useState } from 'react'
import {
  ETAPES, SEUIL_FIABILITE, satisfaction, nps, attente, repartition, repartitionF3,
  repartitionCanaux, repartitionNotes, priorites, fmtPct, fmtNps,
} from '../../lib/indicateurs'
import { C2_OPTIONS, S1_OPTIONS, PARCOURS } from '../../lib/questionnaire'

export default function Resultats({ rows }) {
  const [parcours, setParcours] = useState('consultation')
  const nb = useMemo(() => ({
    consultation: rows.filter((r) => r.parcours === 'consultation').length,
    sejour: rows.filter((r) => r.parcours === 'sejour').length,
  }), [rows])
  const r = useMemo(() => rows.filter((x) => x.parcours === parcours), [rows, parcours])

  const f1 = satisfaction(r, 'f1')
  const n = nps(r)
  const att = attente(r)
  const etapes = ETAPES[parcours].map((e) => ({ ...e, ...satisfaction(r, e.id) }))
    .sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101))
  const f3 = repartitionF3(r, parcours).sort((a, b) => b.n - a.n)
  const prio = priorites(r, parcours)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-cdl-ligne bg-white p-1" role="tablist" aria-label="Parcours">
          {Object.entries(PARCOURS).map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={parcours === k}
              onClick={() => setParcours(k)}
              className={`rounded-lg px-4 py-2 font-medium transition ${parcours === k ? 'bg-cdl-tealfonce text-white' : 'text-cdl-encre/80 hover:bg-cdl-brume'}`}
            >
              {l} <span className="ml-1 opacity-75">({nb[k]})</span>
            </button>
          ))}
        </div>
        {r.length > 0 && r.length < SEUIL_FIABILITE && (
          <p className="rounded-lg bg-[#FFF4DA] px-3 py-2 text-sm text-[#7A5600]">
            Moins de {SEUIL_FIABILITE} réponses : ces chiffres sont des signaux, pas encore des tendances.
          </p>
        )}
      </div>

      {r.length === 0 ? (
        <div className="carte py-14 text-center text-cdl-encre/70">
          Aucune réponse {parcours === 'sejour' ? 'Séjour' : 'Consultation'} sur cette période. Élargissez les dates ou vérifiez que les QR codes sont bien en place.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Chiffre titre="Réponses" valeur={r.length} detail={`${PARCOURS[parcours]} sur la période`} />
            <Chiffre titre="Satisfaction globale" valeur={fmtPct(f1.pct)} detail="Notes 4 et 5 à F1" />
            <Chiffre
              titre="NPS (recommandation)"
              valeur={fmtNps(n.score)}
              detail={`${Math.round(n.promoteurs)} % de 9-10, ${Math.round(n.detracteurs)} % de 0 à 6`}
            />
            {parcours === 'consultation' ? (
              <Chiffre titre="Reçus en moins de 30 min" valeur={fmtPct(att.pct)} detail="Réponses à C2" />
            ) : (
              <Chiffre titre="Durée médiane de réponse" valeur={dureeMediane(r)} detail="Objectif : environ 2 min" />
            )}
          </section>

          <section className="carte">
            <h2 className="text-lg font-semibold">Points à corriger en premier</h2>
            <p className="mt-1 text-sm text-cdl-encre/70">
              Croisement des 3 étapes les moins bien notées et des 3 thèmes les plus cités en F3. Un point mal noté et souvent cité est prioritaire ; les verbatims disent quoi corriger.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-cdl-gris">
                  <tr className="border-b border-cdl-ligne">
                    <th className="py-2 pr-3 font-medium">Point</th>
                    <th className="py-2 pr-3 font-medium">Question</th>
                    <th className="py-2 pr-3 text-right font-medium">Satisfaction</th>
                    <th className="py-2 pr-3 text-right font-medium">Cité en priorité</th>
                    <th className="py-2 font-medium">Lecture</th>
                  </tr>
                </thead>
                <tbody>
                  {prio.map((p) => (
                    <tr key={p.theme + p.question} className="border-b border-cdl-ligne/70 last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{p.libelle}</td>
                      <td className="py-2.5 pr-3 text-cdl-gris">{p.question}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{fmtPct(p.score)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{fmtPct(p.citations)}</td>
                      <td className="py-2.5"><Statut s={p.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="carte">
              <h2 className="text-lg font-semibold">Satisfaction par étape</h2>
              <p className="mt-1 text-sm text-cdl-encre/70">Notes 4 et 5, « Non concerné » exclu. De la moins bien notée à la mieux notée.</p>
              <div className="mt-4 space-y-3">
                {etapes.map((e) => (
                  <Barre key={e.id} libelle={`${e.id.toUpperCase()} · ${e.libelle}`} pct={e.pct} detail={`${e.n} notes`} />
                ))}
              </div>
            </section>

            <section className="carte">
              <h2 className="text-lg font-semibold">Ce que les patients veulent améliorer</h2>
              <p className="mt-1 text-sm text-cdl-encre/70">F3, un seul choix par patient.</p>
              <div className="mt-4 space-y-3">
                {f3.map((o) => (
                  <Barre key={o.v} libelle={o.l} pct={o.pct} detail={`${o.n}`} couleur="ciel" />
                ))}
              </div>
            </section>

            <section className="carte">
              <h2 className="text-lg font-semibold">
                {parcours === 'consultation' ? 'Temps d’attente déclaré (C2)' : 'Type de séjour (S1)'}
              </h2>
              <div className="mt-4 space-y-3">
                {repartition(r, parcours === 'consultation' ? 'c2' : 's1', parcours === 'consultation' ? C2_OPTIONS : S1_OPTIONS).map((o) => (
                  <Barre key={o.v} libelle={o.l} pct={o.pct} detail={`${o.n}`} couleur="ciel" />
                ))}
              </div>
            </section>

            <section className="carte">
              <h2 className="text-lg font-semibold">Satisfaction globale et recommandation</h2>
              <h3 className="mt-4 text-sm font-medium text-cdl-encre/80">F1, de 1 (très insatisfait) à 5 (très satisfait)</h3>
              <Histogramme valeurs={repartitionNotes(r, 'f1')} />
              <h3 className="mt-5 text-sm font-medium text-cdl-encre/80">F2, profil de recommandation</h3>
              <div className="mt-2 flex h-7 overflow-hidden rounded-lg text-xs font-medium">
                <Segment pct={n.detracteurs} classe="bg-[#E6A08F] text-[#5A2316]" l="0-6" />
                <Segment pct={n.passifs} classe="bg-cdl-ligne text-cdl-encre" l="7-8" />
                <Segment pct={n.promoteurs} classe="bg-cdl-teal text-white" l="9-10" />
              </div>
            </section>
          </div>

          <section className="carte">
            <h2 className="text-lg font-semibold">Participation par canal</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {repartitionCanaux(r).map((c) => (
                <div key={c.v} className="rounded-xl bg-cdl-brume px-4 py-3">
                  <p className="text-2xl font-semibold tabular-nums">{c.n}</p>
                  <p className="text-sm text-cdl-encre/70">{c.l}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function dureeMediane(rows) {
  const v = rows.map((r) => r.duree_secondes).filter((x) => x > 0 && x < 3600).sort((a, b) => a - b)
  if (!v.length) return '—'
  const med = v[Math.floor(v.length / 2)]
  return `${Math.floor(med / 60)} min ${String(med % 60).padStart(2, '0')}`
}

function Chiffre({ titre, valeur, detail }) {
  return (
    <div className="carte">
      <p className="text-sm font-medium text-cdl-encre/75">{titre}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-[-0.02em] text-cdl-tealfonce">{valeur}</p>
      <p className="mt-1 text-sm text-cdl-gris">{detail}</p>
    </div>
  )
}

function Barre({ libelle, pct, detail, couleur = 'teal' }) {
  const largeur = pct === null || pct === undefined ? 0 : Math.max(pct, 1.5)
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span>{libelle}</span>
        <span className="shrink-0 tabular-nums text-cdl-encre/80">
          <strong className="font-semibold text-cdl-encre">{fmtPct(pct)}</strong>
          <span className="ml-2 text-cdl-gris">{detail}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 rounded-full bg-cdl-brume">
        <div
          className={`h-full rounded-full ${couleur === 'ciel' ? 'bg-cdl-ciel' : 'bg-cdl-teal'}`}
          style={{ width: `${largeur}%` }}
        />
      </div>
    </div>
  )
}

function Histogramme({ valeurs }) {
  const max = Math.max(1, ...valeurs.map((v) => v.n))
  return (
    <div className="mt-2 flex h-28 items-end gap-3">
      {valeurs.map((v) => (
        <div key={v.v} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs tabular-nums text-cdl-encre/80">{v.n}</span>
          <div
            className={`w-full rounded-t-md ${v.v >= 4 ? 'bg-cdl-teal' : 'bg-cdl-ligne'}`}
            style={{ height: `${(v.n / max) * 72}px` }}
          />
          <span className="text-xs text-cdl-gris">{v.v}</span>
        </div>
      ))}
    </div>
  )
}

function Segment({ pct, classe, l }) {
  if (!pct) return null
  return (
    <div className={`flex items-center justify-center ${classe}`} style={{ width: `${pct}%` }} title={`${l} : ${Math.round(pct)} %`}>
      {pct >= 12 ? `${l} · ${Math.round(pct)} %` : ''}
    </div>
  )
}

function Statut({ s }) {
  if (s === 'prioritaire') return <span className="rounded-full bg-[#FBE3DC] px-2.5 py-1 text-xs font-semibold text-cdl-alerte">Prioritaire</span>
  if (s === 'surveiller') return <span className="rounded-full bg-[#FFF4DA] px-2.5 py-1 text-xs font-semibold text-[#7A5600]">À surveiller</span>
  return <span className="text-xs text-cdl-gris">—</span>
}
