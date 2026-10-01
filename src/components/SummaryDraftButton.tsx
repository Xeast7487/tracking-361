'use client'

import { useState } from 'react'

interface Props {
  onDraftReady: (text: string) => void
}

export default function SummaryDraftButton({ onDraftReady }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/draft-summary', { method: 'POST' })
      if (!res.ok) {
        const msg = await res.text()
        setError(msg || 'Erreur lors de la génération')
        return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      if (full.trim()) onDraftReady(full.trim())
      else setError('Aucune entrée de temps trouvée pour aujourd\'hui.')
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
            Génération…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
            </svg>
            Générer un brouillon IA
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
