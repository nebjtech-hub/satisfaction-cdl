import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { CANAUX, PARCOURS } from '../../lib/questionnaire'

const lienCanal = (c) => `${window.location.origin}/?canal=${c.replace(/_/g, '-')}`

export default function QrCodes() {
  const canaux = Object.entries(CANAUX).filter(([k]) => k !== 'direct')
  return (
    <div className="space-y-4">
      <p className="text-cdl-encre/80">
        Un lien par canal de diffusion : chaque réponse garde la trace de son origine. Imprimez le QR code correspondant à chaque emplacement, et utilisez le lien SMS dans le message envoyé le lendemain de la sortie.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canaux.map(([k, c]) => <CarteQr key={k} code={k} canal={c} />)}
      </div>
    </div>
  )
}

function CarteQr({ code, canal }) {
  const lien = lienCanal(code)
  const [img, setImg] = useState('')
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(lien, { width: 720, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#33424F', light: '#FFFFFF' } })
      .then(setImg)
  }, [lien])

  const texteSms = `Centre Diagnostic de Libreville : merci pour votre confiance. Votre avis sur votre séjour nous aide à progresser (2 min) : ${lien}`

  async function copier(texte) {
    try {
      await navigator.clipboard.writeText(texte)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch { /* presse-papiers indisponible */ }
  }

  return (
    <div className="carte flex flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{canal.label}</h3>
        <span className="text-xs text-cdl-gris">{PARCOURS[canal.parcours]}</span>
      </div>
      <p className="mt-1 text-sm text-cdl-encre/70">{canal.support}</p>
      {img && <img src={img} alt={`QR code ${canal.label}`} className="mx-auto mt-4 w-44" />}
      <p className="mt-3 break-all rounded-lg bg-cdl-brume px-3 py-2 text-xs">{lien}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {code === 'sms' ? (
          <button className="btn-primaire flex-1 py-2 text-sm" onClick={() => copier(texteSms)}>
            {copie ? 'Message copié' : 'Copier le message SMS'}
          </button>
        ) : (
          <a className="btn-primaire flex-1 py-2 text-sm" href={img} download={`qr-satisfaction-cdl-${code}.png`}>Télécharger le QR code</a>
        )}
        <button className="btn-secondaire py-2 text-sm" onClick={() => copier(lien)}>{copie && code !== 'sms' ? 'Lien copié' : 'Copier le lien'}</button>
      </div>
    </div>
  )
}
