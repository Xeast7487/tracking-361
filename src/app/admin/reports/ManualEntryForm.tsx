'use client'

import { useState, useTransition } from 'react'
import { addManualEntryAction } from '@/app/actions'

interface Profile { id: string; full_name: string }
interface Client  { id: string; name: string }
interface Project { id: string; client_id: string; name: string }

export default function ManualEntryForm({
  profiles, clients, projects,
}: {
  profiles: Profile[]
  clients:  Client[]
  projects: Project[]
}) {
  const [isPending, startTransition] = useTransition()
  const [clientId,  setClientId]  = useState('')
  const [billable,     setBillable]     = useState(true)
  const [webDept,      setWebDept]      = useState(false)
  const [chargeClient, setChargeClient] = useState(false)
  const [clientRate,   setClientRate]   = useState('')
  const [error,        setError]        = useState('')
  const [success,   setSuccess]   = useState('')
  const [open,      setOpen]      = useState(false)

  const filteredProjects = projects.filter(p => p.client_id === clientId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('is_billable',       billable ? 'true' : 'false')
    fd.set('charge_web_dept',   webDept ? 'true' : 'false')
    fd.set('charge_client',     chargeClient ? 'true' : 'false')
    fd.set('client_hourly_rate', chargeClient ? clientRate : '')

    const dateStr = fd.get('date') as string
    const startTime = fd.get('start_time') as string
    const endTime   = fd.get('end_time') as string
    const [y, mo, d] = dateStr.split('-').map(Number)
    const [sh, sm]   = startTime.split(':').map(Number)
    const [eh, em]   = endTime.split(':').map(Number)
    fd.set('started_at', new Date(y, mo - 1, d, sh, sm, 0).toISOString())
    fd.set('ended_at',   new Date(y, mo - 1, d, eh, em, 0).toISOString())
    setError('')
    setSuccess('')
    startTransition(async () => {
      const res = await addManualEntryAction(fd)
      if (res?.error) { setError(res.error); return }
      setSuccess('Entrée ajoutée avec succès !')
      ;(e.target as HTMLFormElement).reset()
      setClientId('')
      setBillable(true)
      setWebDept(false)
      setChargeClient(false)
      setClientRate('')
      setTimeout(() => setSuccess(''), 3000)
    })
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Saisie manuelle
    </button>
  )

  return (
    <div className="card border border-purple-700/50 bg-purple-900/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-purple-300 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Saisie manuelle — Super Admin
        </h3>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕ Fermer</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

        <div>
          <label className="label">Employé</label>
          <select name="target_user_id" required className="input">
            <option value="">Choisir...</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Date</label>
          <input name="date" type="date" required
            defaultValue={new Date().toISOString().split('T')[0]} className="input" />
        </div>

        <div>
          <label className="label">Heure début</label>
          <input name="start_time" type="time" required className="input" />
        </div>

        <div>
          <label className="label">Heure fin</label>
          <input name="end_time" type="time" required className="input" />
        </div>

        <div>
          <label className="label">Client</label>
          <select name="client_id" required className="input"
            value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Choisir...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Projet</label>
          <select name="project_id" required disabled={!clientId} className="input disabled:opacity-40">
            <option value="">{clientId ? 'Choisir...' : 'Choisir un client'}</option>
            {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <label className="label">Notes</label>
          <input name="notes" type="text" placeholder="Description du travail..." className="input" />
        </div>

        <div className="flex items-center gap-3 col-span-2">
          <button type="button" onClick={() => setBillable(b => !b)} className="flex items-center gap-2">
            <div className={`relative w-9 h-5 rounded-full transition ${billable ? 'bg-blue-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${billable ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className={`text-sm ${billable ? 'text-slate-200' : 'text-slate-500'}`}>Facturable</span>
          </button>

          <button type="button" onClick={() => setWebDept(b => !b)} className="flex items-center gap-2">
            <div className={`relative w-9 h-5 rounded-full transition ${webDept ? 'bg-orange-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${webDept ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className={`text-sm ${webDept ? 'text-orange-300' : 'text-slate-500'}`}>Dépt. web</span>
          </button>

          <button type="button" onClick={() => setChargeClient(b => !b)} className="flex items-center gap-2">
            <div className={`relative w-9 h-5 rounded-full transition ${chargeClient ? 'bg-emerald-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${chargeClient ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className={`text-sm ${chargeClient ? 'text-emerald-300' : 'text-slate-500'}`}>Facturer client</span>
          </button>
        </div>

        {chargeClient && (
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Taux horaire client ($/h)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={clientRate}
              onChange={e => setClientRate(e.target.value)}
              placeholder="ex. 95.00"
              className="input"
            />
          </div>
        )}

        <div className="col-span-2 sm:col-span-1 flex items-end">
          <button type="submit" disabled={isPending}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
            {isPending ? 'Enregistrement...' : 'Ajouter'}
          </button>
        </div>

        {error   && <p className="text-red-400 text-sm col-span-full">{error}</p>}
        {success && <p className="text-green-400 text-sm col-span-full">{success}</p>}

      </form>
    </div>
  )
}
