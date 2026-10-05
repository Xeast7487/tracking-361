'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitLeaveRequestAction } from '../../actions'
import { useToast } from '../../../components/ToastProvider'

const TYPE_LABELS: Record<string, string> = {
  vacances:  'Vacances',
  maladie:   'Maladie',
  personnel: 'Personnel',
  autre:     'Autre',
}

export default function AdminLeaveFormClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError]   = useState('')
  const [open, setOpen]     = useState(false)
  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await submitLeaveRequestAction(fd)
      if (res?.error) { setError(res.error); return }
      toast('Demande envoyée !')
      form.reset()
      router.refresh()
      setTimeout(() => setOpen(false), 400)
    })
  }

  return (
    <div className="card border border-blue-700/30 bg-blue-900/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-blue-300"
      >
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Ma demande de congé
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 px-5 pb-5">
          <div>
            <label className="label">Type de congé</label>
            <select name="type" required className="input">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1" />
          <div>
            <label className="label">Date de début</label>
            <input name="start_date" type="date" required min={today} className="input" />
          </div>
          <div>
            <label className="label">Date de fin</label>
            <input name="end_date" type="date" required min={today} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes (optionnel)</label>
            <input name="notes" type="text" placeholder="Précisions, contexte..." className="input" />
          </div>
          {error && <p className="text-red-400 text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
              {isPending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
