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

  useEffect(() => {
    if (content === initialContent) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (content.trim()) handleSave(content)
    }, 2000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const isEmpty = !content.trim()

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-slate-800/40">
          <p className="text-xs text-slate-500">
            {hasPunches
              ? "On genere ton resume depuis tes punches..."
              : "Decris ce sur quoi tu as travaille aujourd'hui."}
          </p>
          <SummaryDraftButton
            ref={draftBtnRef}
            onDraftReady={(text) => { setContent(text); setSaved(false); handleSave(text) }}
            autoLabel={autoTriggered && !initialContent}
          />
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setSaved(false) }}
          placeholder="Sur quoi as-tu travaille aujourd'hui ? Quels clients, quels projets ? Y a-t-il des infos importantes a partager avec l'equipe ?"
          rows={10}
          className="w-full bg-transparent px-5 py-5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none leading-relaxed"
        />
        {isPending && (
          <div className="absolute bottom-3 right-4">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-800/60 bg-slate-900/60">
        <div className="flex items-center gap-3 min-w-0">
          {!isEmpty && (
            <SummaryDraftButton
              ref={draftBtnRef}
              onDraftReady={(text) => { setContent(text); setSaved(false); handleSave(text) }}
              autoLabel={false}
            />
          )}
          <span className="text-xs text-slate-600 truncate">
            {error && <span className="text-red-400">{error}</span>}
            {saved && !error && <span className="text-emerald-400">Sauvegarde automatique</span>}
            {!saved && !error && lastUpdated && (
              <>Derniere sauvegarde {new Date(lastUpdated).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </span>
        </div>
        <button
          onClick={() => handleSave(content)}
          disabled={isPending || isEmpty}
          className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
