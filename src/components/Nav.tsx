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
  isWebDept?: boolean
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconHistory() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><polyline points="12 7 12 12 15 15"/>
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function IconWireframe() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="3" width="8" height="8" rx="1"/>
      <rect x="13" y="3" width="8" height="8" rx="1"/>
      <rect x="3" y="13" width="8" height="5" rx="1"/>
      <rect x="13" y="13" width="8" height="5" rx="1"/>
    </svg>
  )
}
function IconWeb() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
function IconBriefcase() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}
function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function Nav({ fullName, role, isWebDept }: Props) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { lang, setLang } = useLanguage()
  const t = translations[lang].nav
  const langLabel = translations[lang].langSwitch

  const shortLabels = lang === 'fr'
    ? { dashboard: 'Pointer', history: 'Historique', overview: 'Aperçu', logout: 'Quitter' }
    : { dashboard: 'Clock In', history: 'History',   overview: 'Overview', logout: 'Logout' }

  const navLinks = role === 'admin'
    ? [
        { href: '/dashboard',         label: t.pointer,      mobile: shortLabels.dashboard, icon: <IconClock /> },
        { href: '/admin',             label: t.overview,     mobile: shortLabels.overview,  icon: <IconGrid /> },
        { href: '/admin/users',       label: t.employees,    mobile: t.employees,           icon: <IconUsers /> },
        { href: '/admin/reports',     label: t.reports,      mobile: t.reports,             icon: <IconFile /> },
        { href: '/admin/clients',     label: t.clients,      mobile: t.clients,             icon: <IconBriefcase /> },
        { href: '/web',               label: 'Projets Web',  mobile: 'Web',                 icon: <IconWeb /> },
        { href: '/web/wireframes',    label: 'Wireframes',   mobile: 'WF',                  icon: <IconWireframe /> },
      ]
    : [
        { href: '/dashboard',         label: t.dashboard,    mobile: shortLabels.dashboard, icon: <IconClock /> },
        { href: '/dashboard/history', label: t.history,      mobile: shortLabels.history,   icon: <IconHistory /> },
        ...(isWebDept ? [{ href: '/web', label: 'Projets Web', mobile: 'Web', icon: <IconWeb /> }, { href: '/web/wireframes', label: 'Wireframes', mobile: 'WF', icon: <IconWireframe /> }] : []),
      ]

  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .avatar-ring {
          position: relative;
        }
        .avatar-ring::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          background: conic-gradient(from 0deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
          animation: spin-slow 3s linear infinite;
          z-index: -1;
          opacity: 0.7;
        }
      `}</style>

      {/* ── Top navigation bar ────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50"
           style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.5)' }}>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/80 to-transparent" />
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm" />

        <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center gap-4">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md group-hover:bg-blue-500/35 transition-all duration-300" />
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="font-black text-white text-[15px] tracking-tight">361</span>
              <span className="text-[10px] font-medium text-slate-500 tracking-widest uppercase">Agence</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-slate-800 flex-shrink-0" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map(l => {
              const isActive = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-blue-300'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {isActive && (
                    <>
                      <span className="absolute inset-0 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/25" />
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-400/5 to-transparent" />
                    </>
                  )}
                  <span className={`relative transition-colors ${isActive ? 'text-blue-400' : ''}`}>
                    {l.icon}
                  </span>
                  <span className="relative">{l.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right section */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* User info – desktop */}
            <div className="hidden md:flex items-center gap-2.5">
              <div className="w-px h-5 bg-slate-800" />
              <div className="flex items-center gap-2">
                <div className="avatar-ring relative z-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {initials}
                  </div>
                </div>
                <div className="flex flex-col leading-none gap-0.5">
                  <span className="text-[11px] font-semibold text-slate-200 max-w-[100px] truncate">{fullName}</span>
                  {role === 'admin' && (
                    <span className="text-[9px] font-semibold text-blue-400/80 uppercase tracking-wider">{t.admin}</span>
                  )}
                </div>
              </div>
            </div>

            {/* User avatar – mobile */}
            <div className="md:hidden avatar-ring relative z-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
            </div>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="text-[11px] px-2 py-1 rounded-md font-bold tracking-widest uppercase text-slate-500 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 transition-all"
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              {langLabel}
            </button>

            {/* Logout – desktop */}
            <button
              onClick={() => startTransition(() => logoutAction())}
              disabled={isPending}
              className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all"
            >
              <IconLogout />
              {isPending ? '...' : t.logout}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom navigation bar ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/98 backdrop-blur-xl border-t border-slate-800/60"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}>
        <div className="flex items-stretch">
          {navLinks.map(l => {
            const isActive = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors min-w-0 relative ${
                  isActive ? 'text-blue-400' : 'text-slate-600 active:text-slate-300'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                )}
                {l.icon}
                <span className="text-[9px] font-semibold leading-none truncate px-0.5 max-w-full uppercase tracking-wide">
                  {l.mobile}
                </span>
              </Link>
            )
          })}

          {/* Logout button */}
          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-slate-600 active:text-red-400 transition-colors"
          >
            <IconLogout />
            <span className="text-[9px] font-semibold leading-none uppercase tracking-wide">
              {isPending ? '...' : shortLabels.logout}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
