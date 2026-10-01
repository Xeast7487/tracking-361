'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { saveDailySummaryAction } from '@/app/actions'
import SummaryDraftButton from '@/components/SummaryDraftButton'

interface Props {
  initialContent: string
  lastUpdated: string | null
  hasPunches?: boolean
}

export default function ResumeForm({ initialContent, lastUpdated, hasPunches }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [autoTriggered, setAutoTriggered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftBtnRef = useRef<{ generate: () => void } | null>(null)

  // Auto-save debounced 2s after typing
  useEffect(() => {
    if (content === initialContent) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (content.trim()) handleSave(content)
    }, 2000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate draft if summary is empty and punches exist
  useEffect(() => {
    if (!initialContent && hasPunches && !autoTriggered) {
      setAutoTriggered(true)
      draftBtnRef.current?.generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave(text: string) {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const res = await saveDailySummaryAction(text)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div className="space-y-3">
      <SummaryDraftButton
        ref={draftBtnRef}
        onDraftReady={(text) => { setContent(text); setSaved(false); handleSave(text) }}
        autoLabel={autoTriggered && !initialContent}
      />
      <div className="relative">
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setSaved(false) }}
          placeholder="Qu'est-ce que tu as fait aujourd'hui ? Sur quels projets ? Y a-t-il des infos importantes à partager avec l'équipe ?"
          rows={6}
          className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/40 transition-all"
        />
        {isPending && (
          <div className="absolute top-3 right-3">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {error && <span className="text-red-400">{error}</span>}
          {saved && !error && <span className="text-emerald-400">Sauvegarde</span>}
          {!saved && !error && lastUpdated && (
            <span>
              Derniere mise a jour :{' '}
              {new Date(lastUpdated).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={() => handleSave(content)}
          disabled={isPending || !content.trim()}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
