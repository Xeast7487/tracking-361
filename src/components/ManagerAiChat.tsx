'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { label: "Résumé d'aujourd'hui", prompt: "Génère un résumé structuré de la journée d'aujourd'hui pour toute l'équipe : qui a travaillé sur quoi, combien d'heures, et les points importants mentionnés dans leurs résumés." },
  { label: 'Rapport de la semaine', prompt: "Génère un rapport complet de la semaine en cours : heures totales par client, résumé de l'avancement par projet, et points importants à retenir." },
  { label: 'Résumé client (à envoyer)', prompt: "Rédige un résumé professionnel de la semaine en cours, prêt à être partagé avec un client ou en réunion d'équipe." },
  { label: 'Résumés manquants', prompt: "Y a-t-il des journées cette semaine où des employés ont punché des heures mais n'ont pas écrit de résumé ? Liste-les." },
  { label: 'Heures par client', prompt: 'Quels clients ont été travaillés cette semaine et combien d\'heures chacun ? Classe par ordre décroissant.' },
  { label: 'Activité équipe (7j)', prompt: "Donne-moi un aperçu complet de l'activité de l'équipe sur les 7 derniers jours : qui a travaillé, sur quoi, et les tendances." },
]

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-slate-700/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-violet-300">{part.slice(1, -1)}</code>
    return part
  })
}

function renderMessage(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="font-bold text-white text-sm mt-3 first:mt-0 mb-0.5">{renderInline(line.slice(4))}</p>)
    } else if (line.startsWith('## ')) {
      elements.push(<p key={i} className="font-bold text-white mt-4 first:mt-0 mb-1">{renderInline(line.slice(3))}</p>)
    } else if (line.startsWith('# ')) {
      elements.push(<p key={i} className="font-bold text-white text-base mt-4 first:mt-0 mb-1">{renderInline(line.slice(2))}</p>)
    } else if (/^[-•] /.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-violet-400/60 flex-shrink-0" />
          <span className="leading-relaxed">{renderInline(line.replace(/^[-•] /, ''))}</span>
        </div>
      )
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="flex-shrink-0 text-violet-400/60 font-medium min-w-[1.25rem]">{num}.</span>
          <span className="leading-relaxed">{renderInline(line.replace(/^\d+\. /, ''))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />)
    } else {
      elements.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>)
    }
  }

  return elements
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700/60 text-slate-500 hover:text-slate-300"
      title="Copier"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  )
}

export default function ManagerAiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
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
    <div className="flex flex-col h-[calc(100vh-11rem)] min-h-[560px] max-h-[900px] bg-slate-950 border border-slate-800/60 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
              <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Assistant IA</p>
            <p className="text-[11px] text-slate-500">Résumés · Rapports · Analyse</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            disabled={streaming}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700/50 transition-all disabled:opacity-40"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-800/40 flex-shrink-0">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={streaming}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Prêt à analyser</p>
              <p className="text-xs text-slate-600 mt-1">Utilise les actions rapides ou pose une question<br />sur l'équipe, les heures ou les projets.</p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                  <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
                </svg>
              </div>
            )}

            <div className={`group relative flex items-start gap-1.5 max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`rounded-xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-violet-600/20 text-violet-100 border border-violet-500/20'
                  : 'bg-slate-800/70 text-slate-200 border border-slate-700/40'
              }`}>
                {m.role === 'assistant' && m.content !== '' ? (
                  <div className="space-y-0.5">{renderMessage(m.content)}</div>
                ) : m.role === 'assistant' && streaming && i === messages.length - 1 && m.content === '' ? (
                  <span className="inline-flex gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
              {m.role === 'assistant' && m.content && <CopyButton text={m.content} />}
            </div>

            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 text-[9px] font-bold text-slate-300">
                M
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 py-2 text-red-400 text-xs border-t border-slate-800/40 flex-shrink-0">{error}</p>}

      {/* Input */}
      <div className="flex gap-2 items-end p-4 border-t border-slate-800/60 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={streaming}
          placeholder="Ex : Résume la semaine de Jean, où en est-on avec Centris ?"
          rows={2}
          className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {streaming ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-700 pb-2 flex-shrink-0">Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
    </div>
  )
}
