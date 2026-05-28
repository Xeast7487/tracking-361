import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ClockWidget from '@/components/ClockWidget'
import EntryList from '@/components/EntryList'
import { todayISO } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayISO()

  const [profileRes, activeRes, clientsRes, projectsRes, todayRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('time_entries')
      .select('id, started_at, notes, is_billable, clients(name), projects(name)')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .maybeSingle(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('projects').select('id, client_id, name').order('name'),
    supabase.from('time_entries')
      .select('id, started_at, ended_at, notes, is_billable, clients(name), projects(name)')
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .order('started_at', { ascending: false }),
  ])

  const fullName = profileRes.data?.full_name
    ?? (user.user_metadata?.full_name as string | undefined)
    ?? 'Employé'
  const activeEntry = activeRes.data ?? null
  const clients  = clientsRes.data  ?? []
  const projects = projectsRes.data ?? []
  const todayEntries = (todayRes.data ?? []) as any[]

  const now = new Date()
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23' }).format(now)
  )
  const greeting = localHour < 12 ? 'Bonjour' : 'Bonsoir'
  const dateStr = now.toLocaleDateString('fr-CA', { timeZone: 'America/Toronto', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between animate-fade-in-down">
        <div>
          <p className="text-slate-500 text-sm capitalize">{dateStr}</p>
          <h1 className="text-2xl font-bold mt-1 animate-reveal"><span className="text-gradient-animate">{greeting}</span><span className="text-white">, {fullName.split(' ')[0]} 👋</span></h1>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start animate-fade-in-up animation-delay-100">
        <ClockWidget
          activeEntry={activeEntry as any}
          clients={clients as any}
          projects={projects as any}
        />

        {/* Today's entries */}
        <div className="space-y-3 animate-fade-in animation-delay-200">
          <h2 className="font-semibold text-slate-300">Aujourd'hui</h2>
          <EntryList entries={todayEntries as any} />
        </div>
      </div>
    </div>
  )
}
