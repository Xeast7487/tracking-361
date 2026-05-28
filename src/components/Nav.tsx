'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions'
import { useTransition } from 'react'

interface Props {
  fullName: string
  role: 'employee' | 'admin'
}

export default function Nav({ fullName, role }: Props) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const navLinks = role === 'admin'
    ? [
        { href: '/dashboard', label: 'Pointer' },
        { href: '/admin',     label: 'Vue d\'ensemble' },
        { href: '/admin/users',   label: 'Employés' },
        { href: '/admin/reports', label: 'Rapports' },
      ]
    : [
        { href: '/dashboard',         label: 'Tableau de bord' },
        { href: '/dashboard/history', label: 'Mon historique' },
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
          <span className="font-bold text-white text-sm">Tracking 361</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 flex-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname === l.href
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-xs font-bold text-blue-400">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 max-w-[120px] truncate">{fullName}</span>
            {role === 'admin' && (
              <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded-full">Admin</span>
            )}
          </div>
          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className="btn-ghost text-xs px-2.5 py-1.5"
          >
            {isPending ? '...' : 'Déconnexion'}
          </button>
        </div>
      </div>
    </nav>
  )
}
