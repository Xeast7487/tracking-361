import { createSupabaseServerClient } from '@/lib/supabase-server'
import ClientsManager from './ClientsManager'

export default async function AdminClientsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, is_web_client, projects(id, name)')
    .order('name')

  return <ClientsManager initialClients={clients ?? []} />
}
