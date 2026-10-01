import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchDailySummariesAction, fetchMySummaryAction } from '@/app/actions'
import ResumeForm from './ResumeForm'

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function ResumePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })

  const [mySummary, allSummaries, punchesRes] = await Promise.all([
    fetchMySummaryAction(),
    fetchDailySummariesAction(),
    supabase.from('time_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`),
  ])

  const teamSummaries = allSummaries.filter((s: any) => s.user_id !== user.id)
  const hasPunches = !!(punchesRes.count && punchesRes.count > 0)

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Résumé du jour</p>
        <h1 className="text-xl font-bold text-white capitalize">{formatDate(today)}</h1>
      </div>

      {/* Writing area */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Mon résumé</span>
          {mySummary?.content?.trim() && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Complété
            </span>
          )}
        </div>
        <ResumeForm
          initialContent={mySummary?.content ?? ''}
          lastUpdated={mySummary?.updated_at ?? null}
          hasPunches={hasPunches}
        />
      </div>

      {/* Team summaries */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Équipe
          </span>
          {teamSummaries.length > 0 && (
            <span className="text-xs text-slate-600 ml-1">
              {teamSummaries.length} résumé{teamSummaries.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {teamSummaries.length === 0 ? (
          <div className="text-center py-10 text-slate-700 border border-slate-800/40 rounded-2xl">
            <p className="text-sm">Personne d&apos;autre n&apos;a encore écrit son résumé aujourd&apos;hui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamSummaries.map((s: any) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800/50 rounded-2xl px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {initials(s.profiles?.full_name ?? '?')}
                    </div>
                    <span className="text-sm font-semibold text-white">{s.profiles?.full_name ?? 'Inconnu'}</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(s.updated_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-9">{s.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
