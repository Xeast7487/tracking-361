'use client'

import { useTransition } from 'react'
import { deleteProjectAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [isPending, startTransition] = useTransition()
  const { lang } = useLanguage()
  const t = translations[lang].adminClients

  return (
    <button
      onClick={() => {
        const msg = t.deleteProjectConfirm.replace('{name}', projectName)
        if (!confirm(msg)) return
        startTransition(async () => { await deleteProjectAction(projectId) })
      }}
      disabled={isPending}
      className="text-slate-600 hover:text-red-400 transition text-xs px-2 py-1 rounded hover:bg-red-900/20"
    >
      {isPending ? '...' : '✕'}
    </button>
  )
}
