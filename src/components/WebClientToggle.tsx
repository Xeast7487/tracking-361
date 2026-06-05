'use client'

import { useTransition } from 'react'
import { toggleWebClientAction } from '@/app/actions'

export default function WebClientToggle({ clientId, isWebClient }: { clientId: string; isWebClient: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await toggleWebClientAction(clientId, !isWebClient) })}
      disabled={isPending}
      title={isWebClient ? 'Retirer du web' : 'Ajouter au web'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        isPending ? 'opacity-50' : ''
      } ${isWebClient ? 'bg-blue-600' : 'bg-slate-600'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          isWebClient ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
