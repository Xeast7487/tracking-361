import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Entree {
  id: string
  date_transaction: string
  description: string
  categorie: string
  type: string
  montant_ht: number
  tps: number
  tvq: number
  montant_total: number
}

const CATEGORIE_LABELS: Record<string, string> = {
  revenu:             'Revenu',
  depense_materiel:   'Matériel',
  depense_logiciel:   'Logiciel',
  salaire:            'Salaire',
  sous_traitance:     'Sous-traitance',
  autre:              'Autre',
}

function fmt(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}

export default async function OrphelinsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const { data: rawEntrees } = await supabase
    .from('compta_entrees')
    .select('*')
    .is('lot_id', null)
    .order('date_transaction', { ascending: true })

  const entrees: Entree[] = (rawEntrees ?? []) as Entree[]

  const revenus  = entrees.filter(e => e.type === 'revenu')
  const depenses = entrees.filter(e => e.type === 'depense')
  const totalRevenuHT  = revenus.reduce((s, e)  => s + Number(e.montant_ht), 0)
  const totalDepenseHT = depenses.reduce((s, e) => s + Number(e.montant_ht), 0)
  const beneficeNet    = totalRevenuHT - totalDepenseHT

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <Link href="/admin/comptabilite" className="text-slate-400 hover:text-slate-200 transition-colors mt-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Entrées sans rapport</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {entrees.length} entrée{entrees.length !== 1 ? 's' : ''} sauvegardées avant la mise à jour
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Revenus HT</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalRevenuHT)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Dépenses HT</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalDepenseHT)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Bénéfice net</p>
          <p className={`text-xl font-bold ${beneficeNet >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(beneficeNet)}</p>
        </div>
      </div>

      {entrees.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Date</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Description</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium hidden sm:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {entrees.map((e, i) => (
                <tr key={e.id} className={`${i !== 0 ? 'border-t border-slate-700/60' : ''} hover:bg-slate-700/30 transition-colors`}>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap w-24">
                    {new Date(e.date_transaction + 'T12:00:00').toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-slate-200 max-w-0 truncate">{e.description}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {CATEGORIE_LABELS[e.categorie] ?? e.categorie}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right whitespace-nowrap font-medium ${e.type === 'revenu' ? 'text-green-400' : 'text-red-400'}`}>
                    {e.type === 'revenu' ? '+' : '-'}{fmt(Number(e.montant_ht))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
