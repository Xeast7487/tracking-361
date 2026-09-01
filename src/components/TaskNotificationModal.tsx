'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissTaskNotificationAction, acknowledgeTaskNotificationAction } from '@/app/actions'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
}

interface Props {
  tasks: Task[]
  firstName: string
}

export default function TaskNotificationModal({ tasks, firstName }: Props) {
  const [visible, setVisible] = useState(tasks.length > 0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!visible || tasks.length === 0) return null

  const count = tasks.length
  const firstTask = tasks[0]

  function handleSee() {
    startTransition(async () => {
      await Promise.all(tasks.map(t => acknowledgeTaskNotificationAction(t.id)))
      setVisible(false)
      router.push('/dashboard/taches')
    })
  }

  function handleDismiss() {
    startTransition(async () => {
      await Promise.all(tasks.map(t => dismissTaskNotificationAction(t.id)))
      setVisible(false)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-5">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>

          {/* Message */}
          <h2 className="text-lg font-bold text-white mb-2">
            Bonjour {firstName} 👋
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-1">
            {count === 1
              ? <>Vous avez <span className="text-blue-400 font-semibold">1 tâche en attente</span> :</>
              : <>Vous avez <span className="text-blue-400 font-semibold">{count} tâches en attente</span>.</>
            }
          </p>

          {/* Task preview */}
          <div className="mt-4 mb-6 space-y-2">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Échéance : {new Date(task.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {count > 3 && (
              <p className="text-xs text-slate-500 text-center">+ {count - 3} autre{count - 3 > 1 ? 's' : ''}</p>
            )}
          </div>

          <p className="text-slate-400 text-sm mb-6">Voulez-vous voir vos tâches maintenant ?</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSee}
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
            >
              {isPending ? '...' : 'Voir mes tâches'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold py-3 px-5 rounded-xl border border-slate-700/50 transition-colors text-sm"
            >
              Plus tard
            </button>
          </div>

          <p className="text-xs text-slate-600 text-center mt-4">
            En cliquant sur "Plus tard", vous serez rappelé à votre prochaine connexion.
          </p>
        </div>
      </div>
    </div>
  )
}
