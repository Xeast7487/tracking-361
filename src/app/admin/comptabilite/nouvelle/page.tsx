'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface EntreeData {
  date_transaction: string
  description: string
  categorie: string
  type: string
  montant_ht: number
  tps: number
  tvq: number
  montant_total: number
}

type FileStatus = 'pending' | 'analysing' | 'done' | 'error'

interface BatchFile {
  id: string
  name: string
  fileType: string
  data: string
  status: FileStatus
  documentId?: string
  entree?: EntreeData
  errorMsg?: string
  chatMessages: Message[]
  chatOpen: boolean
  chatLoading: boolean
}

const CATEGORIES: Record<string, string> = {
  revenu:           'Revenu',
  depense_materiel: 'Dépense — Matériel',
  depense_logiciel: 'Dépense — Logiciel',
  salaire:          'Salaire',
  sous_traitance:   'Sous-traitance',
  autre:            'Autre',
}

const AUTO_PROMPT = "Analyse ce document de comptabilité. Sans poser de questions, fournis directement l'entrée comptable structurée en faisant de ton mieux avec les informations disponibles."

function parseEntree(text: string): EntreeData | null {
  const match = text.match(/<entree>([\s\S]*?)<\/entree>/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}

function cleanMessage(text: string) {
  return text.replace(/<entree>[\s\S]*?<\/entree>/g, '').trim()
}

// ─── Single-file mode (with chat) ───────────────────────────────────────────
function SingleMode() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef   = useRef<HTMLDivElement>(null)

  const [file, setFile]         = useState<{ name: string; type: string; data: string } | null>(null)
  const [documentId, setDocId]  = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [entreeForm, setForm]   = useState<EntreeData | null>(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const readFile = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve((e.target!.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })

  const handleFile = async (f: File) => {
    const data = await readFile(f)
    setFile({ name: f.name, type: f.type, data })
    setMessages([])
    setDocId(null)
    setForm(null)
    setSaved(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) await handleFile(f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = async (content: string, isFirst = false) => {
    if (!content.trim()) return

    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const body: Record<string, unknown> = { messages: newMessages }
    if (isFirst && file) body.file = file
    if (documentId)      body.documentId = documentId

    const res = await fetch('/api/compta/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) { setLoading(false); return }

    const docId = res.headers.get('X-Document-Id')
    if (docId) setDocId(docId)

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: accumulated }
        return updated
      })
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    setLoading(false)
    const entree = parseEntree(accumulated)
    if (entree) setForm(entree)
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleConfirm = async () => {
    if (!entreeForm) return
    setSaving(true)
    const res = await fetch('/api/compta/sauvegarder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, entrees: [entreeForm] }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => router.push('/admin/comptabilite'), 1200)
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`card cursor-pointer border-2 border-dashed transition-colors text-center py-14 ${
            dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/70'
          }`}
        >
          <svg className="mx-auto mb-4 text-slate-500" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-slate-300 font-medium">Glisse un fichier ici ou clique pour sélectionner</p>
          <p className="text-slate-500 text-sm mt-1.5">PDF, JPG, PNG, WEBP — max 10 Mo</p>
          <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="text-blue-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{file.name}</p>
              <p className="text-slate-500 text-xs">{file.type}</p>
            </div>
          </div>
          {messages.length === 0 && !loading && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setFile(null); setSaved(false) }} className="btn-secondary text-xs py-1.5 px-3 min-h-0">Changer</button>
              <button
                onClick={() => sendMessage('Analyse ce document de comptabilité. Dis-moi ce que tu vois, pose-moi des questions si nécessaire, puis fournis l\'entrée comptable.', true)}
                className="btn-primary text-xs py-1.5 px-3 min-h-0"
              >Analyser avec Claude</button>
            </div>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((m, i) => {
            const text = cleanMessage(m.content)
            const isLast = i === messages.length - 1
            const isStreaming = loading && isLast && m.role === 'assistant'
            return (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${m.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {m.role === 'assistant' ? 'IA' : 'M'}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${m.role === 'assistant' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                  {!text && isStreaming
                    ? <span className="inline-flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    : <>{text}{isStreaming && <span className="inline-block w-0.5 h-[1em] bg-slate-400 ml-0.5 align-middle animate-pulse" />}</>
                  }
                </div>
              </div>
            )
          })}
          {loading && (
            <div className="flex items-center gap-2 pl-10 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              {messages[messages.length - 1]?.content === '' ? 'Claude réfléchit…' : 'Claude écrit…'}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {entreeForm && !saved && (
        <div className="card border border-green-500/30 bg-green-500/5 space-y-4">
          <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Entrée détectée — vérifiez avant de confirmer
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label>
              <input type="date" value={entreeForm.date_transaction} onChange={e => setForm(p => p ? { ...p, date_transaction: e.target.value } : p)} className="input" /></div>
            <div><label className="label">Type</label>
              <select value={entreeForm.type} onChange={e => setForm(p => p ? { ...p, type: e.target.value } : p)} className="input">
                <option value="revenu">Revenu</option><option value="depense">Dépense</option>
              </select></div>
            <div className="col-span-2"><label className="label">Description</label>
              <input type="text" value={entreeForm.description} onChange={e => setForm(p => p ? { ...p, description: e.target.value } : p)} className="input" /></div>
            <div><label className="label">Catégorie</label>
              <select value={entreeForm.categorie} onChange={e => setForm(p => p ? { ...p, categorie: e.target.value } : p)} className="input">
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="label">Montant HT ($)</label>
              <input type="number" step="0.01" value={entreeForm.montant_ht} onChange={e => setForm(p => p ? { ...p, montant_ht: parseFloat(e.target.value) || 0 } : p)} className="input" /></div>
            <div><label className="label">TPS ($)</label>
              <input type="number" step="0.01" value={entreeForm.tps} onChange={e => setForm(p => p ? { ...p, tps: parseFloat(e.target.value) || 0 } : p)} className="input" /></div>
            <div><label className="label">TVQ ($)</label>
              <input type="number" step="0.01" value={entreeForm.tvq} onChange={e => setForm(p => p ? { ...p, tvq: parseFloat(e.target.value) || 0 } : p)} className="input" /></div>
            <div><label className="label">Total ($)</label>
              <input type="number" step="0.01" value={entreeForm.montant_total} onChange={e => setForm(p => p ? { ...p, montant_total: parseFloat(e.target.value) || 0 } : p)} className="input" /></div>
          </div>
          <button onClick={handleConfirm} disabled={saving} className="btn-primary w-full">
            {saving ? 'Sauvegarde en cours…' : 'Confirmer et sauvegarder'}
          </button>
        </div>
      )}

      {saved && (
        <div className="card border border-green-500/40 bg-green-500/10 text-center py-6">
          <svg className="mx-auto mb-2 text-green-400" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-green-300 font-semibold">Entrée sauvegardée !</p>
          <p className="text-slate-500 text-sm mt-1">Redirection…</p>
        </div>
      )}

      {messages.length > 0 && !entreeForm && !loading && (
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Répondre à Claude…" className="input flex-1" />
          <button type="submit" disabled={!input.trim()} className="btn-primary">Envoyer</button>
        </form>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseEntrees(text: string): EntreeData[] {
  const matches = [...text.matchAll(/<entree>([\s\S]*?)<\/entree>/g)]
  return matches.flatMap(m => { try { return [JSON.parse(m[1].trim())] } catch { return [] } })
}

// ─── Batch mode — conversation unifiée ───────────────────────────────────────
interface LotFile { name: string; fileType: string; data: string }

function BatchMode() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef   = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const [files, setFiles]       = useState<LotFile[]>([])
  const [phase, setPhase]       = useState<'upload' | 'chat' | 'review'>('upload')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(false)
  const [input, setInput]       = useState('')
  const [entries, setEntries]   = useState<EntreeData[]>([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const readFile = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve((e.target!.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })

  const addFiles = useCallback(async (fileList: FileList) => {
    const newFiles: LotFile[] = []
    for (const f of Array.from(fileList)) {
      const data = await readFile(f)
      newFiles.push({ name: f.name, fileType: f.type, data })
    }
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) await addFiles(e.dataTransfer.files)
  }, [addFiles])

  const startChat = async () => {
    if (!files.length) return
    const firstMsg = `Voici ${files.length} document${files.length > 1 ? 's' : ''} comptable${files.length > 1 ? 's' : ''} du même mois. Analyse-les tous et dis-moi ce que tu ne comprends pas ou ce qui est ambigu — en précisant quel document et quel montant.`
    setPhase('chat')
    await sendMessage(firstMsg, true)
  }

  const sendMessage = async (content: string, isFirst = false) => {
    if (!content.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const body: Record<string, unknown> = { messages: newMessages }
    if (isFirst) body.files = files

    const res = await fetch('/api/compta/analyse-lot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { setLoading(false); return }

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: accumulated }
        return updated
      })
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    setLoading(false)

    // Extract any entries Claude produced
    const detected = parseEntrees(accumulated)
    if (detected.length) {
      setEntries(prev => {
        const all = [...prev, ...detected]
        // deduplicate by description+date
        const seen = new Set<string>()
        return all.filter(e => { const k = `${e.date_transaction}|${e.description}`; if (seen.has(k)) return false; seen.add(k); return true })
      })
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const updateEntry = (idx: number, field: keyof EntreeData, value: string | number) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const removeEntry = (idx: number) => setEntries(prev => prev.filter((_, i) => i !== idx))

  const confirmAll = async () => {
    if (!entries.length) return
    setSaving(true)
    await fetch('/api/compta/sauvegarder', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entrees: entries }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push('/admin/comptabilite'), 1500)
  }

  if (saved) {
    return (
      <div className="card border border-green-500/40 bg-green-500/10 text-center py-10">
        <svg className="mx-auto mb-3 text-green-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <p className="text-green-300 font-semibold text-lg">{entries.length} entrée{entries.length !== 1 ? 's' : ''} sauvegardée{entries.length !== 1 ? 's' : ''} !</p>
        <p className="text-slate-500 text-sm mt-1">Redirection…</p>
      </div>
    )
  }

  if (phase === 'upload') {
    return (
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`card cursor-pointer border-2 border-dashed transition-colors text-center py-12 ${
            dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/70'
          }`}
        >
          <svg className="mx-auto mb-3 text-slate-500" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-slate-300 font-medium">Glisse tes relevés et factures ici</p>
          <p className="text-slate-500 text-sm mt-1.5">PDF, JPG, PNG, WEBP — tous les documents du mois en une fois</p>
          <input ref={fileInputRef} type="file" accept=".pdf,image/*" multiple className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <svg className="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-200 flex-1 truncate">{f.name}</p>
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            <button onClick={startChat} className="btn-primary w-full mt-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Analyser {files.length} document{files.length > 1 ? 's' : ''} avec Claude
            </button>
          </div>
        )}
      </div>
    )
  }

  // Chat + review phase (same screen, entries appear alongside as Claude extracts them)
  return (
    <div className="space-y-4">
      {/* File chips */}
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {f.name}
          </span>
        ))}
      </div>

      {/* Conversation */}
      <div className="space-y-3">
        {messages.map((m, i) => {
          const text = cleanMessage(m.content)
          const isLast = i === messages.length - 1
          const isStreaming = loading && isLast && m.role === 'assistant'
          return (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${m.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {m.role === 'assistant' ? 'IA' : 'M'}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${m.role === 'assistant' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                {!text && isStreaming
                  ? <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  : <>{text}{isStreaming && <span className="inline-block w-0.5 h-[1em] bg-slate-400 ml-0.5 align-middle animate-pulse" />}</>
                }
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex items-center gap-2 pl-10 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            {messages[messages.length - 1]?.content === '' ? 'Claude réfléchit…' : 'Claude écrit…'}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Entries detected so far */}
      {entries.length > 0 && (
        <div className="border-t border-slate-700/60 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {entries.length} entrée{entries.length !== 1 ? 's' : ''} détectée{entries.length !== 1 ? 's' : ''}
          </p>
          {entries.map((e, idx) => (
            <div key={idx} className="card border border-slate-600/40 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="label text-xs">Date</label>
                  <input type="date" value={e.date_transaction} onChange={ev => updateEntry(idx, 'date_transaction', ev.target.value)} className="input text-sm py-1.5" /></div>
                <div><label className="label text-xs">Type</label>
                  <select value={e.type} onChange={ev => updateEntry(idx, 'type', ev.target.value)} className="input text-sm py-1.5">
                    <option value="revenu">Revenu</option><option value="depense">Dépense</option>
                  </select></div>
                <div className="col-span-2"><label className="label text-xs">Description</label>
                  <input type="text" value={e.description} onChange={ev => updateEntry(idx, 'description', ev.target.value)} className="input text-sm py-1.5" /></div>
                <div><label className="label text-xs">Catégorie</label>
                  <select value={e.categorie} onChange={ev => updateEntry(idx, 'categorie', ev.target.value)} className="input text-sm py-1.5">
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><label className="label text-xs">HT ($)</label>
                  <input type="number" step="0.01" value={e.montant_ht} onChange={ev => updateEntry(idx, 'montant_ht', parseFloat(ev.target.value) || 0)} className="input text-sm py-1.5" /></div>
                <div><label className="label text-xs">TPS ($)</label>
                  <input type="number" step="0.01" value={e.tps} onChange={ev => updateEntry(idx, 'tps', parseFloat(ev.target.value) || 0)} className="input text-sm py-1.5" /></div>
                <div><label className="label text-xs">TVQ ($)</label>
                  <input type="number" step="0.01" value={e.tvq} onChange={ev => updateEntry(idx, 'tvq', parseFloat(ev.target.value) || 0)} className="input text-sm py-1.5" /></div>
                <div><label className="label text-xs">Total ($)</label>
                  <input type="number" step="0.01" value={e.montant_total} onChange={ev => updateEntry(idx, 'montant_total', parseFloat(ev.target.value) || 0)} className="input text-sm py-1.5" /></div>
              </div>
              <button onClick={() => removeEntry(idx)} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                Supprimer cette entrée
              </button>
            </div>
          ))}

          <button onClick={confirmAll} disabled={saving || loading} className="btn-primary w-full">
            {saving ? 'Sauvegarde en cours…' : `Sauvegarder ${entries.length} entrée${entries.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Input */}
      {!loading && (
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={entries.length ? 'Continuer la conversation ou poser une autre question…' : 'Répondre à Claude…'}
            className="input flex-1"
          />
          <button type="submit" disabled={!input.trim()} className="btn-primary">Envoyer</button>
        </form>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NouvelleEntreePage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/comptabilite" className="text-slate-400 hover:text-slate-200 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouvelle entrée</h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          1 document
        </button>
        <button
          onClick={() => setMode('batch')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'batch' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Plusieurs documents
        </button>
      </div>

      {mode === 'single' ? <SingleMode /> : <BatchMode />}
    </div>
  )
}
