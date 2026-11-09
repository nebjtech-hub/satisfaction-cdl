import { PARCOURS } from '../../lib/questionnaire'
import { libelleTheme, libelleCanal, fmtDate } from '../../lib/indicateurs'
import { exporterCsv, COLONNES_VOLONTAIRES } from '../../lib/export'

export default function Volontaires({ rows }) {
  const liste = rows.filter((r) => r.f5 === true && r.telephone)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-cdl-encre/80">
          {liste.length} patient{liste.length > 1 ? 's ont' : ' a'} accepté d’être recontacté{liste.length > 1 ? 's' : ''} (F5). Ces numéros servent uniquement à la Vague 2 de vérification.
        </p>
        <button className="btn-primaire ml-auto py-2" disabled={!liste.length}
          onClick={() => exporterCsv(liste, 'volontaires-vague-2.csv', COLONNES_VOLONTAIRES)}>
          Exporter la liste
        </button>
      </div>
      {liste.length === 0 ? (
        <div className="carte py-14 text-center text-cdl-encre/70">Aucun volontaire sur cette période.</div>
      ) : (
        <div className="carte overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cdl-brume text-cdl-encre/75">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Parcours</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 text-right font-medium">F1</th>
                <th className="px-4 py-3 font-medium">Priorité F3</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((r) => (
                <tr key={r.id} className="border-t border-cdl-ligne">
                  <td className="px-4 py-3 tabular-nums">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">{PARCOURS[r.parcours]}</td>
                  <td className="px-4 py-3">{libelleCanal(r.canal)}</td>
                  <td className="px-4 py-3 font-medium tabular-nums"><a className="text-cdl-cielfonce underline-offset-2 hover:underline" href={`tel:${r.telephone}`}>{r.telephone}</a></td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.f1}/5</td>
                  <td className="px-4 py-3">{libelleTheme(r.f3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
