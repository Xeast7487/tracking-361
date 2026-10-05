import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

function getDateRanges() {
  const now = new Date()
  const tz = 'America/Toronto'
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const [year, month, day] = parts.split('-').map(Number)
  const today = new Date(year, month - 1, day)

  const dow = today.getDay() // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekStart = new Date(year, month - 1, day + mondayOffset)

  const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7)
  const prevWeekEnd   = new Date(weekStart); prevWeekEnd.setDate(weekStart.getDate() - 1)
  const monthStart    = new Date(year, month - 1, 1)
  const prevMonthStart = new Date(year, month - 2, 1)
  const prevMonthEnd  = new Date(year, month - 1, 0)

  const iso = (d: Date) => d.toISOString().split('T')[0]
  return {
    todayStr:       iso(today),
    weekStart:      iso(weekStart),
    prevWeekStart:  iso(prevWeekStart),
    prevWeekEnd:    iso(prevWeekEnd),
    monthStart:     iso(monthStart),
    prevMonthStart: iso(prevMonthStart),
    prevMonthEnd:   iso(prevMonthEnd),
  }
}

function calcHours(entries: any[]) {
  return entries.reduce((sum: number, e: any) => {
    if (!e.ended_at) return sum
    const ms = new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0)
    return sum + Math.max(0, ms) / 3600000
  }, 0)
}

function fmt(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null
  const delta = ((current - prev) / prev) * 100
  const positive = delta >= 0
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '+' : ''}{Math.round(delta)}%
    </span>
  )
}

export default async function StatsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const r = getDateRanges()

  // Last 8 weeks for bar chart
  const chartWeekStarts = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(r.weekStart)
    d.setDate(d.getDate() - (7 - i) * 7)
    return d.toISOString().split('T')[0]
  })

  const [weekRes, prevWeekRes, monthRes, prevMonthRes, chartRes] = await Promise.all([
    supabase.from('time_entries').select('started_at, ended_at, total_paused_ms, is_billable, client_id, clients(name)')
      .eq('user_id', user.id).not('ended_at', 'is', null)
      .gte('started_at', `${r.weekStart}T00:00:00`).lte('started_at', `${r.todayStr}T23:59:59`),
    supabase.from('time_entries').select('started_at, ended_at, total_paused_ms')
      .eq('user_id', user.id).not('ended_at', 'is', null)
      .gte('started_at', `${r.prevWeekStart}T00:00:00`).lte('started_at', `${r.prevWeekEnd}T23:59:59`),
    supabase.from('time_entries').select('started_at, ended_at, total_paused_ms, is_billable, client_id, clients(name)')
      .eq('user_id', user.id).not('ended_at', 'is', null)
      .gte('started_at', `${r.monthStart}T00:00:00`).lte('started_at', `${r.todayStr}T23:59:59`),
    supabase.from('time_entries').select('started_at, ended_at, total_paused_ms')
      .eq('user_id', user.id).not('ended_at', 'is', null)
      .gte('started_at', `${r.prevMonthStart}T00:00:00`).lte('started_at', `${r.prevMonthEnd}T23:59:59`),
    supabase.from('time_entries').select('started_at, ended_at, total_paused_ms')
      .eq('user_id', user.id).not('ended_at', 'is', null)
      .gte('started_at', `${chartWeekStarts[0]}T00:00:00`).lte('started_at', `${r.todayStr}T23:59:59`),
  ])

  const weekEntries      = weekRes.data      ?? []
  const prevWeekEntries  = prevWeekRes.data  ?? []
  const monthEntries     = monthRes.data     ?? []
  const prevMonthEntries = prevMonthRes.data ?? []
  const chartAllEntries  = chartRes.data     ?? []

  // Group chart entries by week
  const chartWeeks = chartWeekStarts.map((ws, i) => {
    const nextWs = chartWeekStarts[i + 1]
    const entries = chartAllEntries.filter(e => {
      const d = e.started_at.slice(0, 10)
      return d >= ws && (nextWs ? d < nextWs : true)
    })
    return { ws, hours: calcHours(entries), isCurrent: i === 7 }
  })
  const maxChartHours = Math.max(...chartWeeks.map(w => w.hours), 1)

  const hoursWeek      = calcHours(weekEntries)
  const hoursPrevWeek  = calcHours(prevWeekEntries)
  const hoursMonth     = calcHours(monthEntries)
  const hoursPrevMonth = calcHours(prevMonthEntries)

  const billableMonth    = calcHours(monthEntries.filter((e: any) => e.is_billable))
  const nonBillableMonth = hoursMonth - billableMonth
  const billablePct      = hoursMonth > 0 ? Math.round((billableMonth / hoursMonth) * 100) : 0

  // Top clients this month
  const clientMap: Record<string, { name: string; hours: number }> = {}
  for (const e of monthEntries) {
    const id   = e.client_id ?? 'sans-client'
    const name = (e as any).clients?.name ?? 'Sans client'
    if (!clientMap[id]) clientMap[id] = { name, hours: 0 }
    const ms = new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0)
    clientMap[id].hours += Math.max(0, ms) / 3600000
  }
  const topClients = Object.values(clientMap).sort((a, b) => b.hours - a.hours).slice(0, 5)
  const maxClientHours = topClients[0]?.hours ?? 1

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes statistiques</h1>
        <p className="text-slate-400 text-sm mt-1">Apercu de tes heures et de ta productivite.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Cette semaine"
          value={fmt(hoursWeek)}
          sub={`vs ${fmt(hoursPrevWeek)} sem. precedente`}
          delta={<DeltaBadge current={hoursWeek} prev={hoursPrevWeek} />}
          color="blue"
        />
        <StatCard
          label="Ce mois"
          value={fmt(hoursMonth)}
          sub={`vs ${fmt(hoursPrevMonth)} mois precedent`}
          delta={<DeltaBadge current={hoursMonth} prev={hoursPrevMonth} />}
          color="indigo"
        />
        <StatCard
          label="Facturable ce mois"
          value={fmt(billableMonth)}
          sub={`${billablePct}% du total`}
          color="emerald"
        />
        <StatCard
          label="Non-facturable ce mois"
          value={fmt(nonBillableMonth)}
          sub={`${100 - billablePct}% du total`}
          color="slate"
        />
      </div>

      {/* Barre facturable */}
      {hoursMonth > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Repartition ce mois</p>
          <div className="flex gap-0.5 h-4 rounded-full overflow-hidden">
            <div className="bg-emerald-500 transition-all" style={{ width: `${billablePct}%` }} />
            <div className="bg-slate-700 flex-1" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-emerald-400">{billablePct}% facturable</span>
            <span className="text-xs text-slate-500">{100 - billablePct}% non-facturable</span>
          </div>
        </div>
      )}

      {/* Top clients */}
      {topClients.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Top clients ce mois</p>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 truncate">{c.name}</span>
                  <span className="text-slate-400 font-mono ml-2 flex-shrink-0">{fmt(c.hours)}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${(c.hours / maxClientHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart — 8 semaines */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">8 dernières semaines</p>
        <div className="flex items-end gap-1.5 h-28">
          {chartWeeks.map((w, i) => {
            const pct = maxChartHours > 0 ? (w.hours / maxChartHours) * 100 : 0
            const [, mm, dd] = w.ws.split('-')
            const label = `${dd}/${mm}`
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {w.hours > 0 ? fmt(w.hours) : ''}
                </span>
                <div className="w-full relative flex items-end" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      w.isCurrent
                        ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                        : 'bg-slate-700 group-hover:bg-slate-600'
                    }`}
                    style={{ height: `${Math.max(pct, w.hours > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-mono ${w.isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {hoursMonth === 0 && (
        <div className="text-center py-12 text-slate-600 text-sm">Aucune heure enregistree ce mois.</div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, delta, color }: {
  label: string; value: string; sub?: string; delta?: React.ReactNode; color: string
}) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-500/8 border-blue-500/20',
    indigo:  'bg-indigo-500/8 border-indigo-500/20',
    emerald: 'bg-emerald-500/8 border-emerald-500/20',
    slate:   'bg-slate-800/60 border-slate-700/40',
  }
  const valueColors: Record<string, string> = {
    blue: 'text-blue-300', indigo: 'text-indigo-300', emerald: 'text-emerald-300', slate: 'text-slate-300',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className={`text-3xl font-bold ${valueColors[color]}`}>{value}</p>
        {delta}
      </div>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}
