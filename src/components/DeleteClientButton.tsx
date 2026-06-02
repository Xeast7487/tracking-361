'use client'

import { useTransition } from 'react'
import { deleteClientAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

export default function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [isPending, startTransition] = useTransition()
  const { lang } = useLanguage()
  const t = translations[lang].adminClients

  return (
    <button
      onClick={() => {
        const msg = t.deleteClientConfirm.replace('{name}', clientName)
        if (!confirm(msg)) return
        startTransition(async () => { await deleteClientAction(clientId) })
      }}
      disabled={isPending}
      className="text-slate-500 hover:text-red-400 transition text-xs px-2 py-1 rounded hover:bg-red-900/20 flex items-center gap-1"
    >
      {isPending ? '...' : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          <span>{lang === 'fr' ? 'Supprimer' : 'Delete'}</span>
        </>
      )}
    </button>
  )
}
