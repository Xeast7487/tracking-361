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

const CATEGORIES: Record<string, string> = {
  revenu:           'Revenu',
  depense_materiel: 'Dépense — Matériel',
  depense_logiciel: 'Dépense — Logiciel',
  salaire:          'Salaire',
  sous_traitance:   'Sous-traitance',
  autre:            'Autre',
}

function parseEntree(text: string): EntreeData | null {
  const match = text.match(/<entree>([\s\S]*?)<\/entree>/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}

function cleanMessage(text: string) {
  return text.replace(/<entree>[\s\S]*?<\/entree>/g, '').trim()
}

export default function NouvelleEntreePage() {
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/comptabilite" className="text-slate-400 hover:text-slate-200 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouvelle entrée</h1>
      </div>

      {/* File drop zone */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
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
              <button
                onClick={() => { setFile(null); setSaved(false) }}
                className="btn-secondary text-xs py-1.5 px-3 min-h-0"
              >Changer</button>
              <button
                onClick={() => sendMessage('Analyse ce document de comptabilité. Dis-moi ce que tu vois, pose-moi des questions si nécessaire, puis fournis l\'entrée comptable.', true)}
                className="btn-primary text-xs py-1.5 px-3 min-h-0"
              >Analyser avec Claude</button>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((m, i) => {
            const text = cleanMessage(m.content)
            const isLast = i === messages.length - 1
            return (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                  m.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {m.role === 'assistant' ? 'IA' : 'M'}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                  m.role === 'assistant'
                    ? 'bg-slate-800 border border-slate-700 text-slate-100'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}>
                  {text || (loading && isLast
                    ? <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    : null
                  )}
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Detected entry form */}
      {entreeForm && !saved && (
        <div className="card border border-green-500/30 bg-green-500/5 space-y-4">
          <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Entrée détectée — vérifiez avant de confirmer
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={entreeForm.date_transaction}
                onChange={e => setForm(p => p ? { ...p, date_transaction: e.target.value } : p)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={entreeForm.type}
                onChange={e => setForm(p => p ? { ...p, type: e.target.value } : p)}
                className="input"
              >
                <option value="revenu">Revenu</option>
                <option value="depense">Dépense</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input
                type="text"
                value={entreeForm.description}
                onChange={e => setForm(p => p ? { ...p, description: e.target.value } : p)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select
                value={entreeForm.categorie}
                onChange={e => setForm(p => p ? { ...p, categorie: e.target.value } : p)}
                className="input"
              >
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Montant HT ($)</label>
              <input
                type="number" step="0.01"
                value={entreeForm.montant_ht}
                onChange={e => setForm(p => p ? { ...p, montant_ht: parseFloat(e.target.value) || 0 } : p)}
                className="input"
              />
            </div>
            <div>
              <label className="label">TPS ($)</label>
              <input
                type="number" step="0.01"
                value={entreeForm.tps}
                onChange={e => setForm(p => p ? { ...p, tps: parseFloat(e.target.value) || 0 } : p)}
                className="input"
              />
            </div>
            <div>
              <label className="label">TVQ ($)</label>
              <input
                type="number" step="0.01"
                value={entreeForm.tvq}
                onChange={e => setForm(p => p ? { ...p, tvq: parseFloat(e.target.value) || 0 } : p)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Total ($)</label>
              <input
                type="number" step="0.01"
                value={entreeForm.montant_total}
                onChange={e => setForm(p => p ? { ...p, montant_total: parseFloat(e.target.value) || 0 } : p)}
                className="input"
              />
            </div>
          </div>
          <button onClick={handleConfirm} disabled={saving} className="btn-primary w-full">
            {saving ? 'Sauvegarde en cours…' : 'Confirmer et sauvegarder'}
          </button>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="card border border-green-500/40 bg-green-500/10 text-center py-6">
          <svg className="mx-auto mb-2 text-green-400" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-green-300 font-semibold">Entrée sauvegardée !</p>
          <p className="text-slate-500 text-sm mt-1">Redirection…</p>
        </div>
      )}

      {/* Reply input */}
      {messages.length > 0 && !entreeForm && !loading && (
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Répondre à Claude…"
            className="input flex-1"
          />
          <button type="submit" disabled={!input.trim()} className="btn-primary">
            Envoyer
          </button>
        </form>
      )}
    </div>
  )
}
