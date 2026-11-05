import { createSupabaseServerClient } from '@/lib/supabase-server'
import AdjustmentsList from './AdjustmentsList'

export default async function AjustementsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: requests } = await supabase
    .from('time_adjustment_requests')
    .select(`
      id, status, reason, admin_note, created_at,
      requested_started_at, requested_ended_at,
      profiles!user_id(full_name),
      time_entries!entry_id(started_at, ended_at, clients(name), projects(name))
    `)
    .order('created_at', { ascending: false })

  return <AdjustmentsList initialRequests={(requests ?? []) as any} />
}
