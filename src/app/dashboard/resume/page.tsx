import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchDailySummariesAction, fetchMySummaryAction } from '@/app/actions'
import ResumeForm from './ResumeForm'
import AiChat from '@/components/AiChat'

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Résumé du jour</h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">{formatDate(today)}</p>
      </div>

      {/* Mon résumé */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Mon résumé</h2>
        </div>
        <ResumeForm
          initialContent={mySummary?.content ?? ''}
          lastUpdated={mySummary?.updated_at ?? null}
          hasPunches={!!(punchesRes.count && punchesRes.count > 0)}
        />
      </div>

      {/* Résumés de l'équipe */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Équipe — {teamSummaries.length} résumé{teamSummaries.length !== 1 ? 's' : ''}
        </h2>

        {teamSummaries.length === 0 && (
          <div className="text-center py-10 text-slate-600">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            <p className="text-sm">Personne d'autre n'a encore écrit son résumé aujourd'hui.</p>
          </div>
        )}

        {teamSummaries.map((s: any) => (
          <div key={s.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white">
                  {(s.profiles?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{s.profiles?.full_name ?? 'Inconnu'}</span>
              </div>
              <span className="text-xs text-slate-600">
                {new Date(s.updated_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-10">{s.content}</p>
          </div>
        ))}
      </div>

      {/* Chat IA */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Demander à l'IA</h2>
        <AiChat />
      </div>
    </div>
  )
}
