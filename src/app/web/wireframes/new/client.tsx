'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWireframeAction } from '@/app/actions'

export default function NewWireframePage({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !name.trim()) return
    setError('')
    startTransition(async () => {
      const res = await createWireframeAction(clientId, name.trim())
      if (res?.error) { setError(res.error); return }
      router.push(`/web/wireframes/${res.id}`)
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nouveau wireframe</h1>
        <p className="text-sm text-slate-400 mt-1">Choisissez le client et donnez un nom à ce wireframe</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Client *</label>
          <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
            <option value="">Sélectionner un client web...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Nom du wireframe *</label>
          <input
            className="input" type="text"
            placeholder="Ex: Site principal v1, Landing page promo..."
            value={name} onChange={e => setName(e.target.value)} required
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending || !clientId || !name.trim()} className="btn-primary flex-1">
            {isPending ? 'Création...' : 'Créer et ouvrir le builder →'}
          </button>
          <a href="/web/wireframes" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  )
}
