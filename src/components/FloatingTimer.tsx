'use client'

import { useEffect, useState } from 'react'
import { getActiveEntryAction } from '@/app/actions'

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function FloatingTimer() {
  const [entry, setEntry] = useState<any>(undefined) // undefined = loading, null = none
  const [tick, setTick]   = useState(Date.now())

  useEffect(() => {
    getActiveEntryAction().then(setEntry)
    const poll = setInterval(() => getActiveEntryAction().then(setEntry), 60_000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (!entry) return
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [entry])

  if (!entry) return null

  const paused = !!entry.paused_at
  const elapsed = paused
    ? new Date(entry.paused_at).getTime() - new Date(entry.started_at).getTime() - (entry.total_paused_ms ?? 0)
    : tick - new Date(entry.started_at).getTime() - (entry.total_paused_ms ?? 0)

  const clientName = (entry as any).clients?.name

  return (
    <div className="fixed bottom-[88px] md:bottom-6 left-4 z-[90] flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${paused ? 'bg-amber-400' : 'bg-emerald-400 timer-dot'}`} />
      <span className="text-sm font-mono font-bold text-white tabular-nums">
        {fmt(Math.max(0, elapsed))}
      </span>
      {clientName && (
        <>
          <span className="w-px h-3 bg-slate-700 flex-shrink-0" />
          <span className="text-xs text-slate-400 max-w-[90px] truncate">{clientName}</span>
        </>
      )}
      {paused && <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">pause</span>}
    </div>
  )
}
