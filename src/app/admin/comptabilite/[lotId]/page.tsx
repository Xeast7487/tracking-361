import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
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
  source: string
  notes: string | null
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

export default async function LotPage({ params }: { params: { lotId: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const [{ data: lot }, { data: rawEntrees }] = await Promise.all([
    supabase.from('compta_lots').select('*').eq('id', params.lotId).single(),
    supabase.from('compta_entrees').select('*').eq('lot_id', params.lotId).order('date_transaction', { ascending: true }),
  ])

  if (!lot) notFound()

  const entrees: Entree[] = (rawEntrees ?? []) as Entree[]

  const revenus  = entrees.filter(e => e.type === 'revenu')
  const depenses = entrees.filter(e => e.type === 'depense')

  const totalRevenuHT  = revenus.reduce((s, e)  => s + Number(e.montant_ht), 0)
  const totalDepenseHT = depenses.reduce((s, e) => s + Number(e.montant_ht), 0)
  const beneficeNet    = totalRevenuHT - totalDepenseHT

  const tpsCollected = revenus.reduce((s, e)  => s + Number(e.tps), 0)
  const tvqCollected = revenus.reduce((s, e)  => s + Number(e.tvq), 0)
  const tpsITC       = depenses.reduce((s, e) => s + Number(e.tps), 0)
  const tvqITC       = depenses.reduce((s, e) => s + Number(e.tvq), 0)
  const netTPS       = tpsCollected - tpsITC
  const netTVQ       = tvqCollected - tvqITC
  const totalSalaires = entrees.filter(e => e.categorie === 'salaire').reduce((s, e) => s + Number(e.montant_ht), 0)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/comptabilite" className="text-slate-400 hover:text-slate-200 transition-colors mt-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white leading-snug">{lot.periode_label ?? 'Rapport'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Créé le {new Date(lot.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{entrees.length} entrée{entrees.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Revenus HT</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalRevenuHT)}</p>
          <p className="text-xs text-slate-600 mt-1">{revenus.length} entrée{revenus.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Dépenses HT</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalDepenseHT)}</p>
          <p className="text-xs text-slate-600 mt-1">{depenses.length} entrée{depenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Bénéfice net</p>
          <p className={`text-xl font-bold ${beneficeNet >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(beneficeNet)}</p>
          <p className="text-xs text-slate-600 mt-1">avant impôts</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Masse salariale</p>
          <p className="text-xl font-bold text-slate-200">{fmt(totalSalaires)}</p>
          <p className="text-xs text-slate-600 mt-1">HT</p>
        </div>
      </div>

      {/* Taxes */}
      <div className="card grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">TPS nette</p>
          <p className={`text-lg font-bold ${netTPS > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(netTPS)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{fmt(tpsCollected)} − {fmt(tpsITC)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">TVQ nette</p>
          <p className={`text-lg font-bold ${netTVQ > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(netTVQ)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{fmt(tvqCollected)} − {fmt(tvqITC)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Provision impôts</p>
          <p className="text-lg font-bold text-blue-400">{fmt(Math.max(0, beneficeNet * 0.25))}</p>
          <p className="text-xs text-slate-600 mt-0.5">~25 % bénéfice net</p>
        </div>
      </div>

      {/* Entrées */}
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
