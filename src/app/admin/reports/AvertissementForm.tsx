'use client'

import { useState, useTransition } from 'react'
import { createDossierEntryAction } from '@/app/actions'

interface Profile { id: string; full_name: string }

export default function AvertissementForm({ profiles }: { profiles: Profile[] }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'avertissement_verbal' | 'avertissement_ecrit'>('avertissement_verbal')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('type', type)
    setError('')
    setSuccess('')
    startTransition(async () => {
      const res = await createDossierEntryAction(fd)
      if (res?.error) { setError(res.error); return }
      setSuccess('Avertissement ajouté au dossier.')
      ;(e.target as HTMLFormElement).reset()
      setType('avertissement_verbal')
      setTimeout(() => setSuccess(''), 4000)
    })
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      Émettre un avertissement
    </button>
  )

  return (
    <div className="card border border-amber-700/50 bg-amber-900/10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-amber-300 flex items-center gap-2 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Émettre un avertissement
        </h3>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-xs">
          ✕ Fermer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Employé</label>
            <select name="employee_id" required className="input">
              <option value="">Choisir un employé…</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Type d'avertissement</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('avertissement_verbal')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg border transition ${
                  type === 'avertissement_verbal'
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                    : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Verbal
              </button>
              <button
                type="button"
                onClick={() => setType('avertissement_ecrit')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg border transition ${
                  type === 'avertissement_ecrit'
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                    : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Écrit
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Titre</label>
            <input
              name="title"
              required
              placeholder={
                type === 'avertissement_ecrit'
                  ? 'Ex. Avertissement écrit — 22 septembre 2026'
                  : 'Ex. Avertissement verbal — 22 septembre 2026'
              }
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Détails</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Décrivez les motifs de l'avertissement, les faits observés, les attentes…"
              className="input resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            {error   && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="py-2 px-5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
          >
            {isPending ? 'Enregistrement…' : 'Ajouter au dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
