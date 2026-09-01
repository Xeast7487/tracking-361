import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchEmployeeTasksAction, updateTaskStatusAction } from '@/app/actions'

const STATUS_LABELS: Record<string, string> = {
  pending:     'En attente',
  in_progress: 'En cours',
  completed:   'Complétée',
}

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
}

export default async function TachesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tasks = await fetchEmployeeTasksAction() as any[]

  const pending     = tasks.filter(t => t.status === 'pending')
  const in_progress = tasks.filter(t => t.status === 'in_progress')
  const completed   = tasks.filter(t => t.status === 'completed')

  const groups = [
    { label: 'En attente',  items: pending },
    { label: 'En cours',    items: in_progress },
    { label: 'Complétées',  items: completed },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-white">Mes tâches</h1>
        <p className="text-slate-500 text-sm mt-1">{tasks.length} tâche{tasks.length !== 1 ? 's' : ''} au total</p>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-20 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
          <p className="text-sm">Aucune tâche assignée.</p>
        </div>
      )}

      {groups.map(group => group.items.length > 0 && (
        <div key={group.label} className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{group.label}</h2>
          <div className="space-y-3">
            {group.items.map((task: any) => (
              <div key={task.id}
                className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {task.due_date && (
                      <span>
                        Échéance&nbsp;:&nbsp;
                        <span className="text-slate-300">
                          {new Date(task.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </span>
                    )}
                    {task.profiles?.full_name && (
                      <span>Assigné par&nbsp;: <span className="text-slate-300">{task.profiles.full_name}</span></span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <form action={updateTaskStatusAction.bind(null, task.id, 'in_progress') as any}>
                        <button type="submit"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/25 transition-colors">
                          Commencer
                        </button>
                      </form>
                    )}
                    {task.status === 'in_progress' && (
                      <form action={updateTaskStatusAction.bind(null, task.id, 'completed') as any}>
                        <button type="submit"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/25 transition-colors">
                          Marquer complétée
                        </button>
                      </form>
                    )}
                    {task.status === 'completed' && (
                      <form action={updateTaskStatusAction.bind(null, task.id, 'pending') as any}>
                        <button type="submit"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 border border-slate-700/50 transition-colors">
                          Rouvrir
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
