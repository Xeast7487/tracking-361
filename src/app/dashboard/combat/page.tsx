'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const CombatArena = dynamic(() => import('@/components/CombatArena'), { ssr: false })

export default function CombatPage() {
  const [playKey, setPlayKey] = useState(0)
  const [showReplay, setShowReplay] = useState(false)

  useEffect(() => {
    setShowReplay(false)
    const t = setTimeout(() => setShowReplay(true), 9700)
    return () => clearTimeout(t)
  }, [playKey])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Combat de développeurs</h1>
        <p className="text-sm text-slate-500 mt-1">Mihaja vs Espace Clef</p>
      </div>

      <CombatArena key={playKey} />

      <div className="flex justify-center mt-6 h-12">
        {showReplay && (
          <button
            onClick={() => setPlayKey(k => k + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
              bg-gradient-to-r from-blue-600 to-indigo-600 text-white
              hover:from-blue-500 hover:to-indigo-500
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40
              transition-all duration-200 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Rejouer
          </button>
        )}
      </div>
    </div>
  )
}
