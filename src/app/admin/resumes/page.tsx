import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchDailySummariesAction } from '@/app/actions'
import ManagerAiChat from '@/components/ManagerAiChat'

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function AdminResumesPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })
  const selectedDate = params.date ?? today

  const [summaries, activeEmployees] = await Promise.all([
    fetchDailySummariesAction(selectedDate),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).eq('role', 'employee').order('full_name'),
  ])

  const employeesWithSummary = new Set(summaries.map((s: any) => s.user_id))
  const missing = (activeEmployees.data ?? []).filter(e => !employeesWithSummary.has(e.id))

  // Navigation: 7 derniers jours
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' }))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Résumés de l'équipe</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {days.map(d => (
            <a
              key={d}
              href={`/admin/resumes${d === today ? '' : `?date=${d}`}`}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                d === selectedDate
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-700/40'
              }`}
            >
              {d === today ? "Aujourd'hui" : new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' })}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Colonne principale : résumés */}
        <div className="space-y-4">
          {summaries.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Aucun résumé pour cette journée.</p>
            </div>
          )}

          {summaries.map((s: any) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {(s.profiles?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-white text-sm">{s.profiles?.full_name ?? 'Inconnu'}</span>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {new Date(s.updated_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}

          {/* Employés n'ayant pas encore écrit */}
          {missing.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest mb-2">
                Pas encore de résumé
              </p>
              <div className="flex flex-wrap gap-2">
                {missing.map(e => (
                  <span key={e.id} className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                    {e.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne IA */}
        <div className="xl:sticky xl:top-6">
          <ManagerAiChat />
        </div>
      </div>
    </div>
  )
}
