import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CANAUX } from '../lib/questionnaire'
import { exporterCsv } from '../lib/export'
import Resultats from '../components/admin/Resultats.jsx'
import Verbatims from '../components/admin/Verbatims.jsx'
import Volontaires from '../components/admin/Volontaires.jsx'
import QrCodes from '../components/admin/QrCodes.jsx'

const DEBUT_VAGUE_1 = '2026-10-16'
const ONGLETS = [
  { id: 'resultats', l: 'Résultats' },
  { id: 'verbatims', l: 'Verbatims' },
  { id: 'volontaires', l: 'Volontaires Vague 2' },
  { id: 'qr', l: 'Liens et QR codes' },
]

const aujourdhui = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Libreville' })
const decaler = (jours) => {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Libreville' })
}
// Bornes en heure de Libreville (UTC+1)
const debutJour = (d) => new Date(`${d}T00:00:00+01:00`).toISOString()
const finJour = (d) => new Date(new Date(`${d}T00:00:00+01:00`).getTime() + 86400000).toISOString()

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [estAdmin, setEstAdmin] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setEstAdmin(null); return }
    supabase.rpc('is_admin').then(({ data, error }) => setEstAdmin(!error && data === true))
  }, [session])

  if (session === undefined) return <Chargement />
  if (!session) return <Connexion />
  if (estAdmin === null) return <Chargement />
  if (!estAdmin) {
    return (
      <Cadre>
        <div className="carte mx-auto mt-16 max-w-md text-center">
          <h1 className="text-xl font-semibold">Accès réservé</h1>
          <p className="mt-3 text-cdl-encre/80">
            Le compte {session.user.email} n’est pas déclaré comme administrateur du baromètre. Demandez à l’administrateur Supabase de l’ajouter à la table <code>admins</code>.
          </p>
          <button className="btn-secondaire mt-6" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </Cadre>
    )
  }
  return <Tableau email={session.user.email} />
}

function Tableau({ email }) {
  const [onglet, setOnglet] = useState('resultats')
  const [du, setDu] = useState(DEBUT_VAGUE_1)
  const [au, setAu] = useState(aujourdhui())
  const [canal, setCanal] = useState('tous')
  const [rows, setRows] = useState([])
  const [etat, setEtat] = useState('chargement')
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    setEtat('chargement')
    setErreur('')
    try {
      const taille = 1000
      let depart = 0
      let tout = []
      for (;;) {
        let requete = supabase
          .from('reponses')
          .select('*')
          .gte('created_at', debutJour(du))
          .lt('created_at', finJour(au))
          .order('created_at', { ascending: false })
          .range(depart, depart + taille - 1)
        if (canal !== 'tous') requete = requete.eq('canal', canal)
        const { data, error } = await requete
        if (error) throw error
        tout = tout.concat(data)
        if (data.length < taille) break
        depart += taille
      }
      setRows(tout)
      setEtat('pret')
    } catch (e) {
      console.error(e)
      setErreur('Les réponses n’ont pas pu être chargées. Vérifiez la connexion puis cliquez sur « Actualiser ».')
      setEtat('erreur')
    }
  }, [du, au, canal])

  useEffect(() => { charger() }, [charger])

  const majLigne = (id, champs) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...champs } : r)))
  const nomExport = useMemo(() => `satisfaction-cdl_${du}_${au}${canal !== 'tous' ? '_' + canal : ''}.csv`, [du, au, canal])

  return (
    <Cadre email={email}>
      <section className="flex flex-wrap items-end gap-3 border-b border-cdl-ligne pb-5">
        <Filtre label="Période">
          <select
            className="champ py-2"
            value=""
            onChange={(e) => {
              const v = e.target.value
              if (v === 'vague') { setDu(DEBUT_VAGUE_1); setAu(aujourdhui()) }
              if (v === '7') { setDu(decaler(6)); setAu(aujourdhui()) }
              if (v === '30') { setDu(decaler(29)); setAu(aujourdhui()) }
              if (v === 'retour') { setDu(DEBUT_VAGUE_1); setAu('2026-10-28') }
            }}
          >
            <option value="" disabled>Raccourcis…</option>
            <option value="vague">Depuis le début de la Vague 1</option>
            <option value="retour">Collecte du retour du 31 octobre (16–28 oct.)</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
          </select>
        </Filtre>
        <Filtre label="Du"><input type="date" className="champ py-2" value={du} max={au} onChange={(e) => e.target.value && setDu(e.target.value)} /></Filtre>
        <Filtre label="Au"><input type="date" className="champ py-2" value={au} min={du} onChange={(e) => e.target.value && setAu(e.target.value)} /></Filtre>
        <Filtre label="Canal">
          <select className="champ py-2" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="tous">Tous les canaux</option>
            {Object.entries(CANAUX).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
        </Filtre>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondaire py-2" onClick={charger}>Actualiser</button>
          <button className="btn-primaire py-2" disabled={!rows.length} onClick={() => exporterCsv(rows, nomExport)}>
            Exporter ({rows.length})
          </button>
        </div>
      </section>

      <nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="Sections">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            aria-current={onglet === o.id ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-4 py-2 font-medium transition ${
              onglet === o.id ? 'bg-white text-cdl-tealfonce shadow-[inset_0_-3px_0_#41B8AC]' : 'text-cdl-encre/70 hover:bg-white/60'
            }`}
          >
            {o.l}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {erreur && <p role="alert" className="mb-4 rounded-xl bg-[#FBEDE9] px-4 py-3 text-cdl-alerte">{erreur}</p>}
        {etat === 'chargement' && onglet !== 'qr' ? (
          <p className="py-16 text-center text-cdl-gris">Chargement des réponses…</p>
        ) : (
          <>
            {onglet === 'resultats' && <Resultats rows={rows} />}
            {onglet === 'verbatims' && <Verbatims rows={rows} majLigne={majLigne} />}
            {onglet === 'volontaires' && <Volontaires rows={rows} />}
            {onglet === 'qr' && <QrCodes />}
          </>
        )}
      </div>
    </Cadre>
  )
}

function Filtre({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-cdl-encre/80">
      {label}
      {children}
    </label>
  )
}

function Cadre({ email, children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-cdl-ligne bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <img src="/logo-centre-diagnostic.png" alt="Centre Diagnostic" className="h-9 w-auto" />
          <div className="hidden h-8 w-px bg-cdl-ligne sm:block" />
          <p className="hidden font-semibold sm:block">Baromètre satisfaction patient</p>
          {email && (
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="hidden text-cdl-gris md:inline">{email}</span>
              <button className="btn-secondaire px-3 py-1.5 text-sm" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  )
}

function Chargement() {
  return <div className="flex min-h-screen items-center justify-center text-cdl-gris">Chargement…</div>
}

function Connexion() {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function connecter(e) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp })
    if (error) setErreur('E-mail ou mot de passe incorrect.')
    setEnvoi(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={connecter} className="carte w-full max-w-sm">
        <img src="/logo-centre-diagnostic.png" alt="Centre Diagnostic" className="mx-auto h-12 w-auto" />
        <h1 className="mt-6 text-center text-xl font-semibold">Baromètre satisfaction patient</h1>
        <p className="mt-1 text-center text-sm text-cdl-gris">Espace d’analyse</p>
        <label className="mt-6 block text-sm font-medium">E-mail
          <input type="email" required autoComplete="username" className="champ mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-4 block text-sm font-medium">Mot de passe
          <input type="password" required autoComplete="current-password" className="champ mt-1" value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </label>
        {erreur && <p role="alert" className="mt-4 text-sm text-cdl-alerte">{erreur}</p>}
        <button type="submit" className="btn-primaire mt-6 w-full" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </div>
  )
}
