import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { F3_OPTIONS, PARCOURS } from '../../lib/questionnaire'
import { libelleTheme, libelleCanal, fmtDate } from '../../lib/indicateurs'

const THEMES = F3_OPTIONS.filter((o) => o.v !== 'rien')

export default function Verbatims({ rows, majLigne }) {
  const [parcours, setParcours] = useState('tous')
  const [theme, setTheme] = useState('tous')
  const [enCours, setEnCours] = useState(null)
  const [erreur, setErreur] = useState('')

  const liste = useMemo(() => rows
    .filter((r) => r.f4 || r.f3_autre)
    .filter((r) => parcours === 'tous' || r.parcours === parcours)
    .filter((r) => {
      if (theme === 'tous') return true
      if (theme === 'a_classer') return !r.theme_verbatim
      return (r.theme_verbatim || r.f3) === theme
    }), [rows, parcours, theme])

  const aClasser = rows.filter((r) => (r.f4 || r.f3_autre) && !r.theme_verbatim).length

  async function classer(r, valeur) {
    setEnCours(r.id)
    setErreur('')
    const { error } = await supabase.from('reponses').update({ theme_verbatim: valeur || null }).eq('id', r.id)
    if (error) setErreur('Le classement n’a pas été enregistré. Réessayez.')
    else majLigne(r.id, { theme_verbatim: valeur || null })
    setEnCours(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-cdl-encre/80">Parcours
          <select className="champ py-2" value={parcours} onChange={(e) => setParcours(e.target.value)}>
            <option value="tous">Les deux parcours</option>
            {Object.entries(PARCOURS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-cdl-encre/80">Thème
          <select className="champ py-2" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="tous">Tous les thèmes</option>
            <option value="a_classer">À classer ({aClasser})</option>
            {THEMES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </label>
        <p className="pb-2 text-sm text-cdl-gris">
          {liste.length} commentaire{liste.length > 1 ? 's' : ''}. Le thème proposé par défaut est la réponse du patient à F3 ; corrigez-le si le commentaire parle d’autre chose.
        </p>
      </div>
      {erreur && <p role="alert" className="rounded-xl bg-[#FBEDE9] px-4 py-3 text-cdl-alerte">{erreur}</p>}

      {liste.length === 0 ? (
        <div className="carte py-14 text-center text-cdl-encre/70">Aucun commentaire pour ces filtres.</div>
      ) : (
        <ul className="space-y-3">
          {liste.map((r) => (
            <li key={r.id} className="carte">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cdl-gris">
                <span>{fmtDate(r.created_at)}</span>
                <span>{PARCOURS[r.parcours]}</span>
                <span>{libelleCanal(r.canal)}</span>
                <span>Satisfaction globale : {r.f1}/5</span>
                <span>Recommandation : {r.f2}/10</span>
              </div>
              {r.f4 && <p className="mt-3 whitespace-pre-line text-[1.02rem] leading-relaxed">« {r.f4} »</p>}
              {r.f3_autre && (
                <p className="mt-2 text-sm"><span className="text-cdl-gris">Priorité « Autre » :</span> {r.f3_autre}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cdl-ligne pt-3 text-sm">
                <span className="text-cdl-gris">Priorité choisie : {libelleTheme(r.f3)}</span>
                <label className="ml-auto flex items-center gap-2">
                  <span className="font-medium">Thème du commentaire</span>
                  <select
                    className={`champ w-auto py-1.5 text-sm ${r.theme_verbatim ? '' : 'border-dashed'}`}
                    value={r.theme_verbatim || ''}
                    disabled={enCours === r.id}
                    onChange={(e) => classer(r, e.target.value)}
                  >
                    <option value="">À classer</option>
                    {THEMES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                </label>
                {!r.theme_verbatim && r.f3 && r.f3 !== 'rien' && (
                  <button className="btn-secondaire px-3 py-1.5 text-sm" onClick={() => classer(r, r.f3)} disabled={enCours === r.id}>
                    Classer en « {libelleTheme(r.f3)} »
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
