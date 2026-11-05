'use client'

import { useState, useTransition } from 'react'
import { createAdjustmentRequestAction } from '@/app/actions'

interface Props {
  entryId: string
  currentStartedAt: string
  currentEndedAt: string | null
  clientName: string | null
  projectName: string | null
  onClose: () => void
}

export default function AdjustmentRequestModal({
  entryId,
  currentStartedAt,
  currentEndedAt,
  clientName,
  projectName,
  onClose,
}: Props) {
  const toLocalInput = (iso: string) => {
    const d = new Date(iso)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  const [startedAt, setStartedAt] = useState(toLocalInput(currentStartedAt))
  const [endedAt,   setEndedAt]   = useState(currentEndedAt ? toLocalInput(currentEndedAt) : toLocalInput(new Date().toISOString()))
  const [reason,    setReason]    = useState('')
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) { setError('Explique la raison de la demande.'); return }
    if (new Date(endedAt) <= new Date(startedAt)) { setError('L\'heure de fin doit être après le début.'); return }
    setError('')
    startTransition(async () => {
      const res = await createAdjustmentRequestAction(
        entryId,
        new Date(startedAt).toISOString(),
        new Date(endedAt).toISOString(),
        reason.trim(),
      )
      if (res?.error) { setError(res.error); return }
      setDone(true)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white">Demande d'ajustement</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center space-y-3">
            <div className="text-green-400 mx-auto w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-white font-medium">Demande envoyée</p>
            <p className="text-slate-400 text-sm">L'admin va la réviser et l'approuver sous peu.</p>
            <button onClick={onClose} className="mt-2 text-sm text-slate-400 hover:text-white transition-colors">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {(clientName || projectName) && (
              <p className="text-xs text-slate-500">
                {[clientName, projectName].filter(Boolean).join(' — ')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Début</label>
                <input
                  type="datetime-local"
                  value={startedAt}
                  onChange={e => setStartedAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fin</label>
                <input
                  type="datetime-local"
                  value={endedAt}
                  onChange={e => setEndedAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Raison *</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: J'ai oublié de me puncher out à 17h30..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
                {pending ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
