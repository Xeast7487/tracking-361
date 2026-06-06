import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { todayISO, weekStartISO } from '@/lib/utils'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'
import AdminClockOutButton from '@/components/AdminClockOutButton'

export default async function AdminOverviewPage() {
  const supabase = await createSupabaseServerClient()
  const today = todayISO()
  const weekStart = weekStartISO()

  const lang = await getLang()
  const t = translations[lang].adminOverview
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA'

  const [activeRes, weekRes, profilesRes] = await Promise.all([
    supabase.from('time_entries')
      .select('id, started_at, profiles(full_name), clients(name), projects(name)')
      .is('ended_at', null)
      .order('started_at'),
    supabase.from('time_entries')
      .select('started_at, ended_at, is_billable')
      .gte('started_at', `${weekStart}T00:00:00`)
      .not('ended_at', 'is', null),
    supabase.from('profiles').select('id').eq('is_active', true),
  ])

  const activeSessions = (activeRes.data ?? []) as any[]
  const weekEntries    = weekRes.data ?? []
  const employeeCount  = profilesRes.data?.length ?? 0

  const weekMs = weekEntries.reduce((acc, e) =>
    acc + (new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()), 0)
  const weekH = Math.floor(weekMs / 3_600_000)
  const weekM = Math.floor((weekMs % 3_600_000) / 60_000)

  const billableMs = weekEntries.filter(e => e.is_billable).reduce((acc, e) =>
    acc + (new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()), 0)
  const billableH = Math.floor(billableMs / 3_600_000)
  const billableM = Math.floor((billableMs % 3_600_000) / 60_000)

  const stats = [
    {
      label: t.activeSessions,
      value: activeSessions.length.toString(),
      color: 'text-green-400',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: t.weekHours,
      value: `${weekH}h ${weekM.toString().padStart(2,'0')}m`,
      color: 'text-white',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      ),
    },
    {
      label: t.billableHours,
      value: `${billableH}h ${billableM.toString().padStart(2,'0')}m`,
      color: 'text-blue-400',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: t.activeEmployees,
      value: employeeCount.toString(),
      color: 'text-slate-200',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">{t.title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="card animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="text-slate-500 mb-3">{s.icon}</div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <div className="animate-fade-in animation-delay-300">
        <h2 className="font-semibold text-slate-300 mb-3">
          {t.currentSessions} {activeSessions.length > 0 && `(${activeSessions.length})`}
        </h2>
        {activeSessions.length === 0 ? (
          <div className="card text-slate-500 text-sm text-center py-8">{t.noActiveSessions}</div>
        ) : (
          <div className="grid gap-3">
            {activeSessions.map((s: any) => (
              <div key={s.id} className="card flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{s.profiles?.full_name}</p>
                  <p className="text-slate-400 text-xs">{s.clients?.name} — {s.projects?.name}</p>
                </div>
                <span className="text-slate-400 text-xs whitespace-nowrap">
                  {t.since} {new Date(s.started_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' })}
                </span>
                <AdminClockOutButton entryId={s.id} label={t.punchOut} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap animate-fade-in animation-delay-400">
        <Link href="/admin/reports" className="btn-primary">{t.viewReports}</Link>
        <Link href="/admin/users"   className="btn-secondary">{t.manageEmployees}</Link>
      </div>
    </div>
  )
}
