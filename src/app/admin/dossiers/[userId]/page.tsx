import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fetchDossierEntriesAction, fetchDossierActivityAction, logDossierViewAction } from '@/app/actions'
import { DossierEntryFormClient } from './DossierEntryFormClient'
import { DossierFiltersClient } from './DossierFiltersClient'
import { EntryCardClient } from './EntryCardClient'

const TYPE_LABELS: Record<string, string> = {
  rencontre:            'Rencontre',
  performance:          'Analyse de performance',
  disciplinaire:        'Rencontre disciplinaire',
  avertissement:        'Avertissement',
  avertissement_ecrit:  'Avertissement écrit',
  avertissement_verbal: 'Avertissement verbal',
  felicitation:         'Félicitation',
  note:                 'Note',
}

const TYPE_COLORS: Record<string, string> = {
  rencontre:            'bg-blue-500/15 text-blue-400 border-blue-500/25',
  performance:          'bg-violet-500/15 text-violet-400 border-violet-500/25',
  disciplinaire:        'bg-red-500/15 text-red-400 border-red-500/25',
  avertissement:        'bg-amber-500/15 text-amber-400 border-amber-500/25',
  avertissement_ecrit:  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  avertissement_verbal: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  felicitation:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  note:                 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

const ACTION_LABELS: Record<string, string> = {
  view:   'Consulté',
  create: 'Entrée ajoutée',
  edit:   'Entrée modifiée',
  delete: 'Entrée supprimée',
  sign:   'Entrée signée',
  export: 'Export PDF',
}

export default async function AdminDossierEmployeePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: { type?: string; search?: string; from?: string; to?: string }
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: employee } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('id', params.userId)
    .single()

  if (!employee) redirect('/admin/dossiers')

  const filters = {
    type:   searchParams.type,
    search: searchParams.search,
    from:   searchParams.from,
    to:     searchParams.to,
  }

  const [entries, activity] = await Promise.all([
    fetchDossierEntriesAction(params.userId, filters),
    fetchDossierActivityAction(params.userId),
  ])

  // Log view asynchronously (don't await)
  logDossierViewAction(params.userId)

  const initials = employee.full_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Summary counts (from all entries, unfiltered)
  const allEntries = await fetchDossierEntriesAction(params.userId)
  const typeCounts: Record<string, number> = {}
  for (const e of allEntries) {
    typeCounts[(e as any).type] = (typeCounts[(e as any).type] ?? 0) + 1
  }

  const hasFilters = searchParams.type || searchParams.search || searchParams.from || searchParams.to

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/admin/dossiers"
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{employee.full_name}</h1>
            <p className="text-slate-500 text-sm">{employee.email}</p>
          </div>
        </div>
        <Link
          href={`/admin/dossiers/${params.userId}/export`}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter PDF
        </Link>
      </div>

      {/* Stats summary */}
      {allEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([type, count]) => (
              <div key={type} className={`rounded-xl px-4 py-3 border ${TYPE_COLORS[type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium opacity-80 truncate">{TYPE_LABELS[type] ?? type}</p>
              </div>
            ))}
        </div>
      )}

      {/* Filters */}
      <DossierFiltersClient />

      {/* New entry form */}
      <DossierEntryFormClient employeeId={params.userId} />

      {/* Entries timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm">{hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucune entrée dans ce dossier.'}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Historique — {entries.length} entrée{entries.length !== 1 ? 's' : ''}
              {hasFilters && <span className="ml-1 text-blue-500">(filtré)</span>}
            </h2>
          </div>

          {/* Timeline container */}
          <div className="relative space-y-3 before:absolute before:left-1.5 before:top-5 before:bottom-5 before:w-px before:bg-slate-800">
            {entries.map((entry: any) => (
              <EntryCardClient key={entry.id} entry={entry} employeeId={params.userId} />
            ))}
          </div>
        </div>
      )}

      {/* Activity log */}
      {activity.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Historique d'activité
          </h2>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60">
            {activity.map((log: any) => {
              const logDate = new Date(log.created_at).toLocaleDateString('fr-CA', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              const logTime = new Date(log.created_at).toLocaleTimeString('fr-CA', {
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.action === 'delete' ? 'bg-red-500' :
                    log.action === 'sign'   ? 'bg-teal-500' :
                    log.action === 'create' ? 'bg-blue-500' :
                    log.action === 'edit'   ? 'bg-violet-500' :
                    log.action === 'export' ? 'bg-orange-500' :
                    'bg-slate-600'
                  }`} />
                  <span className="text-slate-400">{ACTION_LABELS[log.action] ?? log.action}</span>
                  <span className="text-slate-600">—</span>
                  <span className="text-slate-500">{log.actor?.full_name ?? '—'}</span>
                  <span className="ml-auto text-xs text-slate-600 whitespace-nowrap">{logDate} {logTime}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
