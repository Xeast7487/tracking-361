'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'start' | 'pause' | 'resume' | 'stop'

const configs: Record<ToastType, { icon: string; label: string; bg: string }> = {
  start:  { icon: '▶', label: 'Tracking démarré',  bg: 'bg-green-700/95 border-green-600/60' },
  pause:  { icon: '⏸', label: 'En pause',           bg: 'bg-amber-700/95 border-amber-600/60' },
  resume: { icon: '▶', label: 'Tracking repris',    bg: 'bg-blue-700/95 border-blue-600/60' },
  stop:   { icon: '◼', label: 'Tracking arrêté',    bg: 'bg-slate-700/95 border-slate-500/60' },
}

export default function TrackingToast({ type, onDone }: { type: ToastType; onDone: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))
    const hideTimer = setTimeout(() => {
      setShow(false)
      setTimeout(onDone, 350)
    }, 3000)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hideTimer)
    }
  }, [])

  const { icon, label, bg } = configs[type]

  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 pointer-events-none
        transition-all duration-300
        ${show ? 'opacity-100 -translate-x-1/2 translate-y-0' : 'opacity-0 -translate-x-1/2 translate-y-3'}`}
    >
      <div className={`animate-bounce-x flex items-center gap-2.5 px-5 py-3 rounded-full border text-white text-sm font-semibold shadow-2xl ${bg}`}>
        <span className="text-base leading-none">{icon}</span>
        <span>{label}</span>
      </div>
    </div>
  )
}
