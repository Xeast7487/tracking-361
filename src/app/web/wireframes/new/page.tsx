import { createSupabaseServerClient } from '@/lib/supabase-server'
import NewWireframePage from './client'

export const metadata = { title: 'Nouveau wireframe — Agence 361' }

export default async function NewWireframeServerPage() {
  const supabase = await createSupabaseServerClient()
  const { data: clients } = await supabase
    .from('clients').select('id, name').eq('is_web_client', true).order('name')
  return <NewWireframePage clients={clients ?? []} />
}
