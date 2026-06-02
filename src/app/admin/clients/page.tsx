import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'
import DeleteClientButton from '@/components/DeleteClientButton'
import DeleteProjectButton from '@/components/DeleteProjectButton'

export default async function AdminClientsPage() {
  const supabase = await createSupabaseServerClient()
  const lang = await getLang()
  const t = translations[lang].adminClients

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, projects(id, name)')
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.title}</h1>

      {(!clients || clients.length === 0) ? (
        <div className="card text-slate-500 text-sm text-center py-8">{t.noClients}</div>
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => (
            <div key={client.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">{client.name}</h2>
                <DeleteClientButton clientId={client.id} clientName={client.name} />
              </div>

              {client.projects && client.projects.length > 0 ? (
                <div className="space-y-1 pl-4 border-l border-slate-700">
                  {(client.projects as { id: string; name: string }[]).map(project => (
                    <div key={project.id} className="flex items-center justify-between py-0.5">
                      <span className="text-slate-400 text-sm">{project.name}</span>
                      <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs pl-4">{t.noProjects}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
