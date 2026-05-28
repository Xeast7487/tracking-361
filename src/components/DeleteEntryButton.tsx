'use client'

import { useTransition } from 'react'
import { deleteEntryAction } from '@/app/actions'

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm('Supprimer cette entrée ?')) return
        startTransition(() => deleteEntryAction(entryId))
      }}
      disabled={isPending}
      className="text-slate-600 hover:text-red-400 transition text-xs px-2 py-1 rounded hover:bg-red-900/20"
    >
      {isPending ? '...' : '✕'}
    </button>
  )
}
