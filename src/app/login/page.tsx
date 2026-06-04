'use client'

import { useState, useTransition } from 'react'
import { loginAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const { lang, setLang } = useLanguage()
  const t = translations[lang].login
  const langLabel = translations[lang].langSwitch

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
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 animate-fade-in-down">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Agence 361</h1>
          <p className="text-slate-400 text-sm mt-1 animate-fade-in animation-delay-300">{t.subtitle}</p>
          <p className="text-yellow-400/70 text-xs mt-2 italic animate-fade-in animation-delay-500">🏆 Will a gagné 3 prix et nominé 6 fois</p>
          <p className="text-purple-400/70 text-xs mt-1 italic animate-fade-in animation-delay-700">⚖️ Adam lui a remporté le prix du plus grand nombre de visites au notaire</p>
        </div>

        {/* Form */}
        <div className="card animate-fade-in-up animation-delay-150">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">{t.email}</label>
              <input
                id="email" name="email" type="email" required autoFocus
                placeholder={t.emailPlaceholder}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">{t.password}</label>
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

            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative">
                <input type="checkbox" name="remember_me" className="sr-only peer" />
                <div className="w-4 h-4 rounded border border-slate-600 bg-slate-900
                                peer-checked:bg-blue-600 peer-checked:border-blue-600
                                transition-all duration-200 group-hover:border-slate-400" />
                <svg className="absolute inset-0 w-4 h-4 text-white scale-0 peer-checked:scale-100
                                transition-transform duration-150 pointer-events-none"
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 8 6.5 11.5 13 5" />
                </svg>
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {t.rememberMe}
              </span>
            </label>

            <button type="submit" disabled={isPending} className="btn-primary w-full py-2.5">
              {isPending ? t.submitting : t.submit}
            </button>
          </form>
        </div>

        {/* Language toggle */}
        <div className="text-center mt-4">
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold tracking-wide transition-colors"
          >
            {langLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
