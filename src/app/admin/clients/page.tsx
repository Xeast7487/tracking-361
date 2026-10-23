import { createSupabaseServerClient } from '@/lib/supabase-server'
import ClientsManager from './ClientsManager'

export default async function AdminClientsPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: clients }, { data: entries }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, is_web_client, projects(id, name)')
      .order('name'),
    supabase
      .from('time_entries')
      .select('started_at, ended_at, total_paused_ms')
      .not('ended_at', 'is', null),
  ])

  const totalMs = (entries ?? []).reduce((sum, e) => {
    const ms =
      new Date(e.ended_at!).getTime() -
      new Date(e.started_at).getTime() -
      (e.total_paused_ms ?? 0)
    return sum + Math.max(0, ms)
  }, 0)
  const totalHours = totalMs / 3_600_000

  return (
    <ClientsManager
      initialClients={clients ?? []}
      totalHours={totalHours}
    />
  )
}
