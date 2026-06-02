'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions'
import { useTransition } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

interface Props {
  fullName: string
  role: 'employee' | 'admin'
}

export default function Nav({ fullName, role }: Props) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { lang, setLang } = useLanguage()
  const t = translations[lang].nav
  const langLabel = translations[lang].langSwitch

  const navLinks = role === 'admin'
    ? [
        { href: '/dashboard',         label: t.pointer },
        { href: '/admin',             label: t.overview },
        { href: '/admin/users',       label: t.employees },
        { href: '/admin/reports',     label: t.reports },
        { href: '/admin/clients',     label: t.clients },
      ]
    : [
        { href: '/dashboard',         label: t.dashboard },
        { href: '/dashboard/history', label: t.history },
      ]

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-white">Agence 361</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 flex-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === l.href
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User + lang toggle + logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 max-w-[120px] truncate">{fullName}</span>
            {role === 'admin' && (
              <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded-full">{t.admin}</span>
            )}
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="btn-ghost text-xs px-2.5 py-1.5 font-semibold tracking-wide"
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            {langLabel}
          </button>

          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className="btn-ghost text-xs px-2.5 py-1.5"
          >
            {isPending ? '...' : t.logout}
          </button>
        </div>
      </div>
    </nav>
  )
}
