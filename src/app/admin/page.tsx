import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { todayISO, weekStartISO, formatDuration } from '@/lib/utils'

export default async function AdminOverviewPage() {
  const supabase = await createSupabaseServerClient()
  const today = todayISO()
  const weekStart = weekStartISO()

  const [activeRes, weekRes, profilesRes] = await Promise.all([
    // Sessions actives en ce moment
    supabase.from('time_entries')
      .select('id, started_at, profiles(full_name), clients(name), projects(name)')
      .is('ended_at', null)
      .order('started_at'),
    // Toutes les entrées complètes cette semaine
    supabase.from('time_entries')
      .select('started_at, ended_at, is_billable')
      .gte('started_at', `${weekStart}T00:00:00`)
      .not('ended_at', 'is', null),
    // Nombre d'employés actifs
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Vue d'ensemble</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sessions actives', value: activeSessions.length.toString(), color: 'text-green-400', icon: '⏱' },
          { label: 'Heures cette semaine', value: `${weekH}h ${weekM.toString().padStart(2,'0')}m`, color: 'text-white', icon: '📊' },
          { label: 'Heures facturables', value: `${billableH}h ${billableM.toString().padStart(2,'0')}m`, color: 'text-blue-400', icon: '💰' },
          { label: 'Employés actifs', value: employeeCount.toString(), color: 'text-slate-200', icon: '👥' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <div>
        <h2 className="font-semibold text-slate-300 mb-3">Sessions en cours {activeSessions.length > 0 && `(${activeSessions.length})`}</h2>
        {activeSessions.length === 0 ? (
          <div className="card text-slate-500 text-sm text-center py-8">Aucune session active en ce moment.</div>
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
                  depuis {new Date(s.started_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/reports" className="btn-primary">📋 Voir les rapports</Link>
        <Link href="/admin/users"   className="btn-secondary">👥 Gérer les employés</Link>
      </div>
    </div>
  )
}
