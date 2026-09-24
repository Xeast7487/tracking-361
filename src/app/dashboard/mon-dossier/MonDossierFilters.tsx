'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const TYPE_OPTIONS = [
  { value: 'all',                   label: 'Tous' },
  { value: 'avertissement_ecrit',   label: 'Avert. écrit' },
  { value: 'avertissement_verbal',  label: 'Avert. verbal' },
  { value: 'avertissement',         label: 'Avertissement' },
  { value: 'disciplinaire',         label: 'Disciplinaire' },
  { value: 'performance',           label: 'Performance' },
  { value: 'felicitation',          label: 'Félicitation' },
  { value: 'rencontre',             label: 'Rencontre' },
  { value: 'note',                  label: 'Note' },
]

export function MonDossierFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const currentType   = searchParams.get('type')   ?? 'all'
  const currentSearch = searchParams.get('search') ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const hasFilters = currentType !== 'all' || currentSearch

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type pills */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => update('type', o.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors border ${
              currentType === o.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        defaultValue={currentSearch}
        placeholder="Recherche…"
        onKeyDown={e => { if (e.key === 'Enter') update('search', (e.target as HTMLInputElement).value) }}
        onBlur={e => update('search', e.target.value)}
        className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-44"
      />

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Effacer filtres
        </button>
      )}
    </div>
  )
}
