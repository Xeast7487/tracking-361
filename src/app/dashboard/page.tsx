import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClockWidget from '@/components/ClockWidget'
import EntryList from '@/components/EntryList'
import TaskNotificationModal from '@/components/TaskNotificationModal'
import { fetchPendingTaskNotificationsAction } from '@/app/actions'
import { todayISO } from '@/lib/utils'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const t = translations[lang].dashboard
  const today = todayISO()
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA'

  const [profileRes, activeRes, clientsRes, projectsRes, todayRes, summaryRes, rawPendingNotifs] = await Promise.all([
    supabase.from('profiles').select('full_name, is_web_dept').eq('id', user.id).single(),
    supabase.from('time_entries')
      .select('id, started_at, notes, is_billable, charge_client, client_hourly_rate, paused_at, total_paused_ms, clients(name), projects(name)')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .maybeSingle(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('projects').select('id, client_id, name').order('name'),
    supabase.from('time_entries')
      .select('id, started_at, ended_at, notes, is_billable, charge_client, client_hourly_rate, total_paused_ms, client_id, project_id, clients(name), projects(name)')
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .order('started_at', { ascending: false }),
    supabase.from('daily_summaries')
      .select('id, content')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    fetchPendingTaskNotificationsAction(),
  ])

  const pendingNotifs = (rawPendingNotifs ?? []).map(({ id, title, description, due_date }: any) => ({ id, title, description, due_date }))
  const hasSummary = !!(summaryRes.data?.content?.trim())

  const isWebDept = profileRes.data?.is_web_dept ?? false
  const fullName  = profileRes.data?.full_name
    ?? (user.user_metadata?.full_name as string | undefined)
    ?? t.defaultName
  const activeEntry = activeRes.data ?? null
  const clients  = clientsRes.data  ?? []
  const projects = projectsRes.data ?? []
  const todayEntries = (todayRes.data ?? []) as any[]

  const now = new Date()
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23' }).format(now)
  )
  const greeting = localHour < 12 ? t.greetingMorning : t.greetingEvening
  const dateStr = now.toLocaleDateString(locale, { timeZone: 'America/Toronto', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
    <TaskNotificationModal tasks={pendingNotifs} firstName={fullName.split(' ')[0]} />
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-slate-500 text-xs sm:text-sm capitalize">{dateStr}</p>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white">{greeting}, {fullName.split(' ')[0]}</h1>
        </div>
      </div>

      {/* Daily summary status */}
      {hasSummary ? (
        <Link href="/dashboard/resume" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 hover:bg-emerald-500/12 transition-colors">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300">Résumé du jour complété</p>
            <p className="text-xs text-emerald-500/70 truncate">{summaryRes.data?.content?.slice(0, 80)}…</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 flex-shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
          <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Résumé de la journée non complété</p>
            <p className="text-xs text-red-400/60">Prends 2 minutes pour noter ce sur quoi tu as travaillé.</p>
          </div>
          <Link
            href="/dashboard/resume"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/25 transition-all whitespace-nowrap"
          >
            Faire mon résumé
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 sm:gap-6 items-start">
        <ClockWidget
          activeEntry={activeEntry as any}
          clients={clients as any}
          projects={projects as any}
          isWebDept={isWebDept}
        />

        {/* Today's entries */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-300">{t.today}</h2>
          <EntryList entries={todayEntries as any} allowEdit />
        </div>
      </div>
    </div>
    </>
  )
}
