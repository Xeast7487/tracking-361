'use client'

import { useState, useRef, useEffect, useTransition } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { label: 'Rapport de la semaine', prompt: 'Génère un rapport complet de la semaine en cours : heures totales par client, résumé de l\'avancement par projet, et points importants à retenir.' },
  { label: 'Trous dans les résumés', prompt: 'Y a-t-il des journées où des employés ont punché des heures mais n\'ont pas écrit de résumé ? Liste-les.' },
  { label: 'Clients cette semaine', prompt: 'Quels clients ont été travaillés cette semaine et combien d\'heures chacun ?' },
  { label: 'Activité de l\'équipe', prompt: 'Donne-moi un aperçu de l\'activité de l\'équipe sur les 7 derniers jours.' },
]

export default function ManagerAiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (userMessage: string) => {
    const trimmed = userMessage.trim()
    if (!trimmed || streaming) return
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Placeholder for streaming response
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/manager-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      if (!res.ok) { setError('Erreur serveur'); setStreaming(false); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: full }
          return copy
        })
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={streaming}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-all disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            disabled={streaming}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700/50 transition-all disabled:opacity-40 ml-auto"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
                  </svg>
                </div>
              )}
              <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600/20 text-violet-100 border border-violet-500/20'
                  : 'bg-slate-800/60 text-slate-200 border border-slate-700/40'
              }`}>
                {m.content}
                {m.role === 'assistant' && streaming && i === messages.length - 1 && m.content === '' && (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-slate-300">
                  M
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={streaming}
          placeholder="Ex : Où en est-on avec Centris ? Qui a travaillé sur les sites web cette semaine ?"
          rows={2}
          className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="flex-shrink-0 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {streaming ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <p className="text-[11px] text-slate-600">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</p>
    </div>
  )
}
