'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'avertissement_ecrit',   label: 'Avertissement écrit' },
  { value: 'avertissement_verbal',  label: 'Avertissement verbal' },
  { value: 'avertissement',         label: 'Avertissement' },
  { value: 'disciplinaire',         label: 'Disciplinaire' },
  { value: 'performance',           label: 'Performance' },
  { value: 'felicitation',          label: 'Félicitation' },
  { value: 'rencontre',             label: 'Rencontre' },
  { value: 'note',                  label: 'Note' },
]

export function DossierFiltersClient() {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  const currentType   = searchParams.get('type')   ?? 'all'
  const currentSearch = searchParams.get('search') ?? ''
  const currentFrom   = searchParams.get('from')   ?? ''
  const currentTo     = searchParams.get('to')     ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const clearAll = () => router.push(pathname)

  const hasFilters = currentType !== 'all' || currentSearch || currentFrom || currentTo

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Filtres</span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Effacer
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        {/* Type */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <select
            value={currentType}
            onChange={e => update('type', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Recherche */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Recherche</label>
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Mots-clés…"
            onKeyDown={e => { if (e.key === 'Enter') update('search', (e.target as HTMLInputElement).value) }}
            onBlur={e => update('search', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Date de */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Du</label>
          <input
            type="date"
            value={currentFrom}
            onChange={e => update('from', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark]"
          />
        </div>

        {/* Date à */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Au</label>
          <input
            type="date"
            value={currentTo}
            onChange={e => update('to', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  )
}
