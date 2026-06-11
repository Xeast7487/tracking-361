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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconHistory() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><polyline points="12 7 12 12 15 15"/>
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconFile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function IconWireframe() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <rect x="3" y="3" width="8" height="8" rx="1"/>
      <rect x="13" y="3" width="8" height="8" rx="1"/>
      <rect x="3" y="13" width="8" height="5" rx="1"/>
      <rect x="13" y="13" width="8" height="5" rx="1"/>
    </svg>
  )
}

function IconWeb() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
function IconBriefcase() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}
function IconLogout() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <>
      {/* ── Top navigation bar ────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-xl shadow-black/20">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />

        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-5">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-blue-500/50 transition-shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.15em]">Agence</span>
              <span className="font-bold text-white text-base tracking-tight leading-tight">361</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-slate-700/60 flex-shrink-0" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === l.href
                    ? 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/25 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Mobile spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* User info – desktop */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-px h-5 bg-slate-700/60" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-600/25 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shadow-sm">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col leading-none gap-0.5">
                  <span className="text-xs font-semibold text-slate-200 max-w-[110px] truncate">{fullName}</span>
                  {role === 'admin' && (
                    <span className="text-[10px] font-medium text-blue-400/80">{t.admin}</span>
                  )}
                </div>
              </div>
            </div>

            {/* User avatar – mobile */}
            <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-600/25 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
              {fullName.charAt(0).toUpperCase()}
            </div>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="text-xs px-2.5 py-1.5 rounded-md font-semibold tracking-wide text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all"
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              {langLabel}
            </button>

            {/* Logout – desktop */}
            <button
              onClick={() => startTransition(() => logoutAction())}
              disabled={isPending}
              className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all"
            >
              {isPending ? '...' : t.logout}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom navigation bar ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/98 backdrop-blur-md border-t border-slate-800/70 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors min-w-0 relative ${
                pathname === l.href
                  ? 'text-blue-400'
                  : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {pathname === l.href && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
              {l.icon}
              <span className="text-[10px] font-medium leading-none truncate px-0.5 max-w-full">
                {l.mobile}
              </span>
            </Link>
          ))}

          {/* Logout button */}
          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-slate-500 active:text-slate-300 transition-colors"
          >
            <IconLogout />
            <span className="text-[10px] font-medium leading-none">
              {isPending ? '...' : shortLabels.logout}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
