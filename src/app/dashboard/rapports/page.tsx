import RapportClient from './RapportClient'

export const metadata = { title: 'Rapports publicitaires - Agence 361' }

export default function RapportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-100">Rapports publicitaires</h1>
        <p className="text-slate-400 text-sm mt-1">Importe un rapport Swydo PDF - l'IA extrait les métriques et génère un résumé client.</p>
      </div>
      <RapportClient />
    </div>
  )
}
