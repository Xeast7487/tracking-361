import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface LotRaw {
  id: string
  periode_label: string | null
  periode_debut: string | null
  periode_fin:   string | null
  nb_entrees:    number
  created_at:    string
  compta_entrees: { type: string; montant_ht: number }[]
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

  const [{ data: rawLots }, { data: rawOrphans }] = await Promise.all([
    supabase
      .from('compta_lots')
      .select('id, periode_label, periode_debut, periode_fin, nb_entrees, created_at, compta_entrees(type, montant_ht)')
      .order('created_at', { ascending: false }) as Promise<{ data: LotRaw[] | null }>,
    supabase
      .from('compta_entrees')
      .select('type, montant_ht, created_at')
      .is('lot_id', null)
      .order('created_at', { ascending: false }),
  ])

  const lots = (rawLots ?? []).map(lot => {
    const entrees = lot.compta_entrees ?? []
    return {
      ...lot,
      totalRevenus:  entrees.filter(e => e.type === 'revenu') .reduce((s, e) => s + Number(e.montant_ht), 0),
      totalDepenses: entrees.filter(e => e.type === 'depense').reduce((s, e) => s + Number(e.montant_ht), 0),
    }
  })

  // Regrouper par année
  const byYear: Record<number, typeof lots> = {}
  for (const lot of lots) {
    const year = new Date(lot.created_at).getFullYear()
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(lot)
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  const orphans = rawOrphans ?? []
  const orphanRevenus  = orphans.filter(e => e.type === 'revenu') .reduce((s, e) => s + Number(e.montant_ht), 0)
  const orphanDepenses = orphans.filter(e => e.type === 'depense').reduce((s, e) => s + Number(e.montant_ht), 0)

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Comptabilité</h1>
        <Link href="/admin/comptabilite/nouvelle" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau rapport
        </Link>
      </div>

      {/* Entrées sans lot (sauvegardées avant la notion de rapport) */}
      {orphans.length > 0 && (
        <Link href="/admin/comptabilite/orphelins" className="card flex items-center gap-4 hover:bg-slate-700/60 transition-colors cursor-pointer group border border-slate-600/50">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
            <svg className="text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium">Entrées sans rapport</p>
            <p className="text-slate-500 text-xs mt-0.5">{orphans.length} entrée{orphans.length !== 1 ? 's' : ''} sauvegardées avant la mise à jour</p>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            {orphanRevenus  > 0 && <p className="text-green-400 text-sm font-medium">+{fmt(orphanRevenus)}</p>}
            {orphanDepenses > 0 && <p className="text-red-400 text-sm">-{fmt(orphanDepenses)}</p>}
          </div>
          <svg className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      )}

      {lots.length === 0 && orphans.length === 0 ? (
        <div className="card text-center py-14 text-slate-500">
          <svg className="mx-auto mb-4 text-slate-600" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="text-sm">Aucun rapport pour l&apos;instant.</p>
          <Link href="/admin/comptabilite/nouvelle" className="btn-primary mt-4 inline-flex">Créer le premier rapport</Link>
        </div>
      ) : lots.length > 0 ? (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year} className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{year}</h2>
              {byYear[year].map(lot => (
                <Link
                  key={lot.id}
                  href={`/admin/comptabilite/${lot.id}`}
                  className="card flex items-center gap-4 hover:bg-slate-700/60 transition-colors cursor-pointer group"
                >
                  {/* Icône */}
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                    <svg className="text-blue-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug truncate">
                      {lot.periode_label ?? 'Période inconnue'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {lot.nb_entrees} entrée{lot.nb_entrees !== 1 ? 's' : ''} · créé le{' '}
                      {new Date(lot.created_at).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Totaux */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    {lot.totalRevenus > 0 && (
                      <p className="text-green-400 text-sm font-medium">+{fmt(lot.totalRevenus)}</p>
                    )}
                    {lot.totalDepenses > 0 && (
                      <p className="text-red-400 text-sm">-{fmt(lot.totalDepenses)}</p>
                    )}
                  </div>

                  {/* Flèche */}
                  <svg className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
