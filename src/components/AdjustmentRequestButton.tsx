'use client'

import { useState, useTransition, useEffect } from 'react'
import { createAdjustmentRequestAction } from '@/app/actions'

type Entry = {
  id: string
  started_at: string
  ended_at: string
  clients: { name: string } | null
  projects: { name: string } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleString('fr-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16)
}

export default function AdjustmentRequestButton({ userId }: { userId: string }) {
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState<1 | 2>(1)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Entry | null>(null)
  const [search, setSearch]   = useState('')

  const [startedAt, setStartedAt] = useState('')
  const [endedAt,   setEndedAt]   = useState('')
  const [reason,    setReason]    = useState('')
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/my-entries')
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open])

  function handleOpen() {
    setOpen(true)
    setStep(1)
    setSelected(null)
    setSearch('')
    setReason('')
    setError('')
    setDone(false)
  }

  function handleClose() {
    setOpen(false)
  }

  function handleSelectEntry(entry: Entry) {
    setSelected(entry)
    setStartedAt(toLocalInput(entry.started_at))
    setEndedAt(toLocalInput(entry.ended_at))
    setReason('')
    setError('')
    setStep(2)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (!reason.trim()) { setError('Explique la raison de la demande.'); return }
    if (new Date(endedAt) <= new Date(startedAt)) { setError('L\'heure de fin doit être après le début.'); return }
    setError('')
    startTransition(async () => {
      const res = await createAdjustmentRequestAction(
        selected.id,
        new Date(startedAt).toISOString(),
        new Date(endedAt).toISOString(),
        reason.trim(),
      )
      if (res?.error) { setError(res.error); return }
      setDone(true)
    })
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return (
      !q ||
      (e.clients?.name ?? '').toLowerCase().includes(q) ||
      (e.projects?.name ?? '').toLowerCase().includes(q) ||
      fmtShort(e.started_at).includes(q)
    )
  })

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/15 border border-yellow-400/20 px-4 py-2 rounded-xl transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Demander un ajustement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                )}
                <div>
                  <h2 className="font-semibold text-white">Demande d'ajustement</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {step === 1 ? 'Étape 1 — Choisir le chiffre à corriger' : 'Étape 2 — Corriger les heures'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Step indicators */}
            <div className="px-6 pt-4 flex items-center gap-2 flex-shrink-0">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
            </div>

            {/* Content */}
            {done ? (
              <div className="px-6 py-10 text-center space-y-3 flex-1">
                <div className="text-green-400 mx-auto w-14 h-14 rounded-full bg-green-400/10 flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-white font-semibold text-lg">Demande envoyée !</p>
                <p className="text-slate-400 text-sm">L'admin va la réviser et l'approuver sous peu.</p>
                <button onClick={handleClose} className="mt-4 text-sm text-slate-400 hover:text-white transition-colors">Fermer</button>
              </div>

            ) : step === 1 ? (
              <div className="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-3">
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par client, projet ou date..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/50"
                />
                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                  {loading ? (
                    <p className="text-slate-500 text-sm text-center py-8">Chargement...</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">Aucune entrée trouvée.</p>
                  ) : (
                    filtered.map(e => (
                      <button
                        key={e.id}
                        onClick={() => handleSelectEntry(e)}
                        className="w-full text-left bg-white/4 hover:bg-white/8 border border-white/8 hover:border-yellow-400/30 rounded-xl px-4 py-3 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {[e.clients?.name, e.projects?.name].filter(Boolean).join(' — ') || 'Sans projet'}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {fmtShort(e.started_at)} → {fmtShort(e.ended_at)}
                            </p>
                          </div>
                          <svg className="flex-shrink-0 text-slate-600 group-hover:text-yellow-400 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Selected entry recap */}
                <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Chiffre sélectionné</p>
                  <p className="text-sm font-medium text-white">
                    {[selected?.clients?.name, selected?.projects?.name].filter(Boolean).join(' — ') || 'Sans projet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Original : {selected && fmtShort(selected.started_at)} → {selected && fmtShort(selected.ended_at)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Nouveau début</label>
                    <input
                      type="datetime-local"
                      value={startedAt}
                      onChange={e => setStartedAt(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Nouvelle fin</label>
                    <input
                      type="datetime-local"
                      value={endedAt}
                      onChange={e => setEndedAt(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Raison *</label>
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ex: J'ai oublié de me puncher out à 17h30..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/50 resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3 pt-1 pb-2">
                  <button type="button" onClick={handleClose} className="flex-1 btn-secondary">Annuler</button>
                  <button type="submit" disabled={pending} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    {pending ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
