'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message { role: 'user' | 'assistant'; content: string }

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

interface LotFile { name: string; type: string; data: string }

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

function parseEntrees(text: string): EntreeData[] {
  const matches = [...text.matchAll(/<entree>([\s\S]*?)<\/entree>/g)]
  return matches.flatMap(m => { try { return [JSON.parse(m[1].trim())] } catch { return [] } })
}

function cleanMessage(text: string) {
  return text.replace(/<entree>[\s\S]*?<\/entree>/g, '').trim()
}

// ─── Single-file mode ────────────────────────────────────────────────────────
function SingleMode() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef   = useRef<HTMLDivElement>(null)

  const [file, setFile]         = useState<LotFile | null>(null)
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
    if (documentId) body.documentId = documentId

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

// ─── Batch mode — workflow en étapes ─────────────────────────────────────────
type BatchPhase = 'upload' | 'identifying' | 'invoice' | 'qa'

function BatchMode() {
  const router          = useRouter()
  const bankInputRef    = useRef<HTMLInputElement>(null)
  const invoiceInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef  = useRef<HTMLInputElement>(null)

  const [bankFiles, setBankFiles]     = useState<LotFile[]>([])
  const [invoiceFile, setInvoiceFile] = useState<LotFile | null>(null)
  const [bankDrop, setBankDrop]       = useState(false)
  const [invoiceDrop, setInvoiceDrop] = useState(false)
  const [phase, setPhase]             = useState<BatchPhase>('upload')
  const [period, setPeriod]           = useState('')
  const [loading, setLoading]         = useState(false)

  // Q&A
  const [qaFiles, setQaFiles]           = useState<LotFile[]>([])
  const [messages, setMessages]         = useState<Message[]>([])
  const [currentMsg, setCurrentMsg]     = useState('')
  const [answeredQAs, setAnsweredQAs]   = useState<{ q: string; a: string }[]>([])
  const [answer, setAnswer]             = useState('')
  const [showHistory, setShowHistory]   = useState(false)
  const [entries, setEntries]           = useState<EntreeData[]>([])
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)

  const readFile = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve((e.target!.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })

  const addBankFiles = useCallback(async (list: FileList) => {
    const newFiles: LotFile[] = []
    for (const f of Array.from(list)) {
      const data = await readFile(f)
      newFiles.push({ name: f.name, type: f.type, data })
    }
    setBankFiles(prev => [...prev, ...newFiles])
  }, [])

  const setInvoiceFromFile = useCallback(async (f: File) => {
    const data = await readFile(f)
    setInvoiceFile({ name: f.name, type: f.type, data })
  }, [])

  // Étape 1 → 2 : identifier la période
  const identifyDates = async () => {
    setLoading(true)
    setPeriod('')
    setPhase('identifying')

    const res = await fetch('/api/compta/analyse-lot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'dates',
        files: bankFiles,
        messages: [{ role: 'user', content: 'Identifie la période couverte par ces relevés.' }],
      }),
    })
    if (!res.ok) { setLoading(false); setPhase('upload'); return }

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let acc = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      acc += decoder.decode(value)
      setPeriod(acc)
    }
    setLoading(false)
    setPhase('invoice')
  }

  // Étape 3 → 4 : démarrer le Q&A avec tous les fichiers
  const startQA = async (useInvoice = true) => {
    const allFiles = (useInvoice && invoiceFile) ? [...bankFiles, invoiceFile] : bankFiles
    setQaFiles(allFiles)
    setPhase('qa')
    setLoading(true)
    setCurrentMsg('')

    const firstMsg = `Voici les documents comptables (${period}). Analyse-les et commence l'analyse. Pose tes questions une par une.`
    const initMessages: Message[] = [{ role: 'user', content: firstMsg }]
    setMessages(initMessages)

    const res = await fetch('/api/compta/analyse-lot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'qa', messages: initMessages, files: allFiles }),
    })
    if (!res.ok) { setLoading(false); return }

    await streamAndUpdate(res, initMessages)
  }

  const streamAndUpdate = async (res: Response, prevMessages: Message[]) => {
    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let acc = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      acc += decoder.decode(value)
      setCurrentMsg(cleanMessage(acc))
      const detected = parseEntrees(acc)
      if (detected.length) {
        setEntries(prev => {
          const all = [...prev, ...detected]
          const seen = new Set<string>()
          return all.filter(e => { const k = `${e.date_transaction}|${e.description}`; if (seen.has(k)) return false; seen.add(k); return true })
        })
      }
    }
    setLoading(false)
    setMessages(prev => [...prev, { role: 'assistant', content: acc }])
    setTimeout(() => answerInputRef.current?.focus(), 50)
  }

  // Répondre à une question
  const sendAnswer = async () => {
    if (!answer.trim() || loading) return

    setAnsweredQAs(prev => [...prev, { q: currentMsg, a: answer }])
    setCurrentMsg('')

    const userMsg: Message = { role: 'user', content: answer }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setAnswer('')
    setLoading(true)

    const res = await fetch('/api/compta/analyse-lot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'qa', messages: newMessages, files: qaFiles }),
    })
    if (!res.ok) { setLoading(false); return }

    await streamAndUpdate(res, newMessages)
  }

  const updateEntry = (idx: number, field: keyof EntreeData, value: string | number) =>
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))

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

  // ─── Saved ─────────────────────────────────────────────────────────────────
  if (saved) return (
    <div className="card border border-green-500/40 bg-green-500/10 text-center py-10">
      <svg className="mx-auto mb-3 text-green-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      <p className="text-green-300 font-semibold text-lg">{entries.length} entrée{entries.length !== 1 ? 's' : ''} sauvegardée{entries.length !== 1 ? 's' : ''} !</p>
      <p className="text-slate-500 text-sm mt-1">Redirection…</p>
    </div>
  )

  // ─── Étape 1 : upload relevés ───────────────────────────────────────────────
  if (phase === 'upload') return (
    <div className="space-y-4">
      <div
        onDrop={async e => { e.preventDefault(); setBankDrop(false); if (e.dataTransfer.files.length) await addBankFiles(e.dataTransfer.files) }}
        onDragOver={e => { e.preventDefault(); setBankDrop(true) }}
        onDragLeave={() => setBankDrop(false)}
        onClick={() => bankInputRef.current?.click()}
        className={`card cursor-pointer border-2 border-dashed transition-colors text-center py-12 ${bankDrop ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/70'}`}
      >
        <svg className="mx-auto mb-3 text-slate-500" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="text-slate-300 font-medium">Glisse tes relevés bancaires ici</p>
        <p className="text-slate-500 text-sm mt-1.5">PDF, JPG, PNG — tous les relevés du mois</p>
        <input ref={bankInputRef} type="file" accept=".pdf,image/*" multiple className="hidden"
          onChange={e => e.target.files && addBankFiles(e.target.files)} />
      </div>

      {bankFiles.length > 0 && (
        <div className="space-y-2">
          {bankFiles.map((f, i) => (
            <div key={i} className="card flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <svg className="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p className="text-sm text-slate-200 flex-1 truncate">{f.name}</p>
              <button onClick={() => setBankFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
          <button onClick={identifyDates} disabled={loading} className="btn-primary w-full mt-2">
            Analyser {bankFiles.length} relevé{bankFiles.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )

  // ─── Étape 2 : identification période (streaming) ──────────────────────────
  if (phase === 'identifying') return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
        Claude lit les relevés…
      </div>
      {period && <p className="text-white text-sm leading-relaxed">{period}</p>}
    </div>
  )

  // ─── Étape 3 : upload rapport de facturation ───────────────────────────────
  if (phase === 'invoice') return (
    <div className="space-y-4">
      <div className="card border border-blue-500/30 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="text-blue-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">Période identifiée</p>
            <p className="text-white text-sm leading-relaxed">{period}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-300 text-sm font-medium">Upload ton rapport de facturation pour cette période</p>

      {!invoiceFile ? (
        <div
          onDrop={async e => { e.preventDefault(); setInvoiceDrop(false); const f = e.dataTransfer.files[0]; if (f) await setInvoiceFromFile(f) }}
          onDragOver={e => { e.preventDefault(); setInvoiceDrop(true) }}
          onDragLeave={() => setInvoiceDrop(false)}
          onClick={() => invoiceInputRef.current?.click()}
          className={`card cursor-pointer border-2 border-dashed transition-colors text-center py-8 ${invoiceDrop ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/70'}`}
        >
          <p className="text-slate-400 text-sm">Glisse ton rapport ici ou clique pour sélectionner</p>
          <p className="text-slate-600 text-xs mt-1">PDF, image, CSV…</p>
          <input ref={invoiceInputRef} type="file" accept=".pdf,image/*,.csv,.xlsx" className="hidden"
            onChange={e => e.target.files?.[0] && setInvoiceFromFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="card flex items-center gap-3 py-3 border border-green-500/30">
          <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
            <svg className="text-green-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p className="text-sm text-slate-200 flex-1 truncate">{invoiceFile.name}</p>
          <button onClick={() => setInvoiceFile(null)} className="text-slate-500 hover:text-red-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => startQA(false)} className="btn-secondary flex-1 text-sm">
          Continuer sans rapport
        </button>
        {invoiceFile && (
          <button onClick={() => startQA(true)} className="btn-primary flex-1 text-sm">
            Analyser avec le rapport
          </button>
        )}
      </div>
    </div>
  )

  // ─── Étape 4 : Q&A une question à la fois ─────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Fichiers en chips */}
      <div className="flex flex-wrap gap-1.5">
        {qaFiles.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {f.name}
          </span>
        ))}
      </div>

      {/* Historique Q&A (collapsible) */}
      {answeredQAs.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${showHistory ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {answeredQAs.length} question{answeredQAs.length > 1 ? 's' : ''} répondue{answeredQAs.length > 1 ? 's' : ''}
          </button>
          {showHistory && (
            <div className="space-y-2.5 pl-3 border-l-2 border-slate-700 ml-1">
              {answeredQAs.map((qa, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-xs text-slate-500 leading-relaxed">{qa.q}</p>
                  <p className="text-xs text-slate-300 flex items-start gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400 flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {qa.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question courante / état de chargement */}
      {(currentMsg || loading) && (
        <div className={`card p-4 ${currentMsg ? 'border border-blue-500/25 bg-slate-800/60' : 'border border-slate-700'}`}>
          {!currentMsg && loading ? (
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
              {currentMsg}
              {loading && <span className="inline-block w-0.5 h-[1em] bg-slate-400 ml-0.5 align-middle animate-pulse" />}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
          {currentMsg ? 'Claude écrit…' : 'Claude réfléchit…'}
        </div>
      )}

      {/* Champ réponse */}
      {!loading && phase === 'qa' && (
        <form onSubmit={e => { e.preventDefault(); sendAnswer() }} className="flex gap-2">
          <input
            ref={answerInputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder={currentMsg ? 'Ta réponse…' : 'Ajouter une précision…'}
            className="input flex-1"
            autoFocus
          />
          <button type="submit" disabled={!answer.trim()} className="btn-primary">
            Répondre
          </button>
        </form>
      )}

      {/* Entrées détectées */}
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
                Supprimer
              </button>
            </div>
          ))}
          <button onClick={confirmAll} disabled={saving || loading} className="btn-primary w-full">
            {saving ? 'Sauvegarde en cours…' : `Sauvegarder ${entries.length} entrée${entries.length !== 1 ? 's' : ''}`}
          </button>
        </div>
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
