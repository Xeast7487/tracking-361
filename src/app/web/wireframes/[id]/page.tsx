import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import WireframeBuilder from '@/components/wireframe/WireframeBuilder'

export const metadata = { title: 'Wireframe Builder — Agence 361' }

export default async function WireframeEditPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()

  const [wfRes, clientsRes] = await Promise.all([
    supabase.from('wireframes').select('*').eq('id', params.id).single(),
    supabase.from('clients').select('id, name').eq('is_web_client', true).order('name'),
  ])

  if (!wfRes.data) notFound()

  return (
    <WireframeBuilder
      wireframe={wfRes.data as any}
      clients={clientsRes.data ?? []}
    />
  )
}
