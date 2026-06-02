'use client'

import { useTransition } from 'react'
import { deleteEntryAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition()
  const { lang } = useLanguage()
  const t = translations[lang].deleteEntry

  return (
    <button
      onClick={() => {
        if (!confirm(t.confirm)) return
        startTransition(async () => { await deleteEntryAction(entryId) })
      }}
      disabled={isPending}
      className="text-slate-600 hover:text-red-400 transition text-xs px-2 py-1 rounded hover:bg-red-900/20"
    >
      {isPending ? '...' : '✕'}
    </button>
  )
}
