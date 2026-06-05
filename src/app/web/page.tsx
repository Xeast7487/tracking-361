import { createSupabaseServerClient } from '@/lib/supabase-server'
import WebProjectChecklist from '@/components/WebProjectChecklist'

export const metadata = { title: 'Projets Web — Agence 361' }

export default async function WebProjectsPage() {
  const supabase = await createSupabaseServerClient()

  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('id, name').eq('is_web_client', true).order('name'),
    supabase.from('web_projects').select('*'),
  ])

  const clients = clientsRes.data ?? []
  const webProjects = projectsRes.data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Projets Web</h1>
        <p className="text-sm text-slate-400 mt-1">Suivi des étapes de production pour chaque client web</p>
      </div>
      <WebProjectChecklist clients={clients} webProjects={webProjects} />
    </div>
  )
}
