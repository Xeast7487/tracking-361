'use client'

import { useEffect, useState } from 'react'

const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2
  const dist = 80 + (i % 4) * 38
  const colors = ['#3b82f6', '#818cf8', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#38bdf8']
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    color: colors[i % colors.length],
    size: 5 + (i % 4) * 3,
    delay: i * 14,
  }
})

export default function ExplosionLoader() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1050)
    return () => clearTimeout(t)
  }, [])

  if (gone) return null

  return (
    <div className="explosion-overlay">
      <div className="explosion-center">
        <div className="explosion-flash" />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="explosion-particle"
            style={{
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              background: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}ms`,
              boxShadow: `0 0 ${p.size * 1.8}px ${p.color}`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
