import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchAllTasksAdminAction, createTaskFormAction, deleteTaskAction } from '@/app/actions'

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

export default async function AdminTachesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tasks, employeesRes] = await Promise.all([
    fetchAllTasksAdminAction() as Promise<any[]>,
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  const employees = (employeesRes.data ?? []) as { id: string; full_name: string }[]

  const pending     = tasks.filter(t => t.status !== 'completed')
  const completed   = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-white">Gestion des tâches</h1>
        <p className="text-slate-500 text-sm mt-1">{tasks.length} tâche{tasks.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Create form */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-5">Nouvelle tâche</h2>
        <form action={createTaskFormAction as any} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Titre *</label>
              <input
                name="title"
                required
                placeholder="Ex. Préparer le rapport mensuel"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assigné à *</label>
              <select
                name="assigned_to"
                required
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              >
                <option value="">Sélectionner un employé…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date d'échéance</label>
              <input
                type="date"
                name="due_date"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description (optionnel)</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Détails supplémentaires…"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Créer la tâche
            </button>
          </div>
        </form>
      </div>

      {/* Active tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Tâches actives</h2>
          <div className="space-y-3">
            {pending.map((task: any) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Complétées</h2>
          <div className="space-y-3">
            {completed.map((task: any) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-20 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p className="text-sm">Aucune tâche créée.</p>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }: { task: any }) {
  const assignedName = task.assigned?.full_name ?? '—'
  const creatorName  = task.creator?.full_name  ?? '—'

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-semibold text-white">{task.title}</p>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
            <span>Assignée à&nbsp;: <span className="text-slate-300">{assignedName}</span></span>
            <span>Par&nbsp;: <span className="text-slate-400">{creatorName}</span></span>
            {task.due_date && (
              <span>
                Échéance&nbsp;:&nbsp;
                <span className="text-slate-300">
                  {new Date(task.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </span>
            )}
            <span>Créée le&nbsp;: <span className="text-slate-400">{new Date(task.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
          </div>
        </div>

        <form action={deleteTaskAction.bind(null, task.id) as any}>
          <button
            type="submit"
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/8 border border-slate-700/40 hover:border-red-500/20 transition-colors"
          >
            Supprimer
          </button>
        </form>
      </div>
    </div>
  )
}
