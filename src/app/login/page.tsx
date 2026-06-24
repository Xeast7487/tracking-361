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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-xl shadow-blue-900/50"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agence 361</h1>
          <p className="text-slate-400 text-sm mt-2 animate-fade-in animation-delay-200">{t.subtitle}</p>
        </div>

        {/* Form card */}
        <div className="animate-fade-in-up animation-delay-150">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">{t.email}</label>
                <input
                  id="email" name="email" type="email" required autoFocus
                  placeholder={t.emailPlaceholder}
                  className="input bg-slate-900/70 focus:bg-slate-900 border-slate-600/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">{t.password}</label>
                <input
                  id="password" name="password" type="password" required
                  placeholder="••••••••"
                  className="input bg-slate-900/70 focus:bg-slate-900 border-slate-600/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white min-h-[44px]
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: isPending ? '#3b82f6' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {isPending ? t.submitting : t.submit}
              </button>
            </form>
          </div>

          {/* Team highlights */}
          <div className="mt-4 bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3 space-y-1.5 backdrop-blur-sm">
            <p className="text-yellow-400/70 text-xs italic animate-fade-in animation-delay-300">🏆 Will a gagné 3 prix et nominé 6 fois</p>
            <p className="text-purple-400/70 text-xs italic animate-fade-in animation-delay-500">⚖️ Adam lui a remporté le prix du plus grand nombre de visites au notaire</p>
          </div>
        </div>

        {/* Language toggle */}
        <div className="text-center mt-5 animate-fade-in animation-delay-900">
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            {langLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
