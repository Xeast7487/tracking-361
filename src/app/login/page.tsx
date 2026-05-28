'use client'

import { useState, useTransition } from 'react'
import { loginAction } from '@/app/actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await loginAction(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Tracking 361</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des heures de travail</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Adresse courriel</label>
              <input
                id="email" name="email" type="email" required autoFocus
                placeholder="votre@email.com"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Mot de passe</label>
              <input
                id="password" name="password" type="password" required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full py-2.5">
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Les comptes sont créés par l'administrateur.
        </p>
      </div>
    </div>
  )
}
