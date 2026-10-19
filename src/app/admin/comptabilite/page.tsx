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
  source: string
  notes: string | null
  created_at: string
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

export default async function ComptabilitePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const year = new Date().getFullYear()
  const { data: rawEntrees } = await supabase
    .from('compta_entrees')
    .select('*')
    .gte('date_transaction', `${year}-01-01`)
    .lte('date_transaction', `${year}-12-31`)
    .order('date_transaction', { ascending: false })

  const entrees: Entree[] = (rawEntrees ?? []) as Entree[]

  // Totals
  const revenus   = entrees.filter(e => e.type === 'revenu')
  const depenses  = entrees.filter(e => e.type === 'depense')

  const totalRevenuHT  = revenus.reduce((s, e)  => s + Number(e.montant_ht),  0)
  const totalDepenseHT = depenses.reduce((s, e) => s + Number(e.montant_ht),  0)
  const beneficeNet    = totalRevenuHT - totalDepenseHT

  const tpsCollected   = revenus.reduce((s, e)  => s + Number(e.tps), 0)
  const tvqCollected   = revenus.reduce((s, e)  => s + Number(e.tvq), 0)
  const tpsITC         = depenses.reduce((s, e) => s + Number(e.tps), 0)
  const tvqITC         = depenses.reduce((s, e) => s + Number(e.tvq), 0)
  const netTPS         = tpsCollected - tpsITC
  const netTVQ         = tvqCollected - tvqITC
  const provisionImpot = Math.max(0, beneficeNet * 0.25)
  const totalSalaires  = entrees
    .filter(e => e.categorie === 'salaire')
    .reduce((s, e) => s + Number(e.montant_ht), 0)

  // Group entries by month
  const byMonth: Record<string, Entree[]> = {}
  for (const e of entrees) {
    const month = e.date_transaction.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(e)
  }

  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Comptabilité {year}</h1>
        <Link href="/admin/comptabilite/nouvelle" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle entrée
        </Link>
      </div>

      {/* Summary cards */}
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
          <p className="text-xs text-slate-600 mt-1">HT (DAS à verser)</p>
        </div>
      </div>

      {/* Tax provisions */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-200">Provisions fiscales — {year}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">TPS nette</p>
            <p className={`text-2xl font-bold ${netTPS > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(netTPS)}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>Perçue : {fmt(tpsCollected)}</p>
              <p>CTI : -{fmt(tpsITC)}</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">TVQ nette</p>
            <p className={`text-2xl font-bold ${netTVQ > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(netTVQ)}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>Perçue : {fmt(tvqCollected)}</p>
              <p>CTI : -{fmt(tvqITC)}</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Provision impôts</p>
            <p className="text-2xl font-bold text-blue-400">{fmt(provisionImpot)}</p>
            <p className="mt-2 text-xs text-slate-500">25 % du bénéfice net estimé</p>
            {totalSalaires > 0 && (
              <p className="mt-1 text-xs text-slate-600">+ DAS sur {fmt(totalSalaires)} de salaires</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Estimation indicative — consulter un comptable pour les montants exacts à remettre.
        </p>
      </div>

      {/* Entries by month */}
      {months.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <p className="text-sm">Aucune entrée pour {year}.</p>
          <Link href="/admin/comptabilite/nouvelle" className="btn-primary mt-4 inline-flex">Ajouter la première entrée</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {months.map(month => {
            const mEntrees = byMonth[month]
            const mRev = mEntrees.filter(e => e.type === 'revenu').reduce((s, e) => s + Number(e.montant_ht), 0)
            const mDep = mEntrees.filter(e => e.type === 'depense').reduce((s, e) => s + Number(e.montant_ht), 0)
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-300 capitalize">{monthLabel(month)}</h3>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-400">+{fmt(mRev)}</span>
                    <span className="text-red-400">-{fmt(mDep)}</span>
                  </div>
                </div>
                <div className="card p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {mEntrees.map((e, i) => (
                        <tr key={e.id} className={`${i !== 0 ? 'border-t border-slate-700/60' : ''} hover:bg-slate-700/30 transition-colors`}>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap w-24">
                            {new Date(e.date_transaction + 'T12:00:00').toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-slate-200 max-w-0 truncate">{e.description}</td>
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                              {CATEGORIE_LABELS[e.categorie] ?? e.categorie}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right whitespace-nowrap font-medium ${e.type === 'revenu' ? 'text-green-400' : 'text-red-400'}`}>
                            {e.type === 'revenu' ? '+' : '-'}{fmt(Number(e.montant_ht))}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap hidden md:table-cell">
                            {e.source === 'ia' ? '🤖' : '✍️'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
