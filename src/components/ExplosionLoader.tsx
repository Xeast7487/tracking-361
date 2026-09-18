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
    const t = setTimeout(() => setGone(true), 1700)
    return () => clearTimeout(t)
  }, [])

  if (gone) return null

  return (
    <div className="explosion-overlay">
      <div className="explosion-center">
        <div className="explosion-flash" />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          animation: 'explosion-text 1.5s ease-out forwards',
          fontWeight: 900,
          fontSize: '1.1rem',
          letterSpacing: '0.04em',
          background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #fb7185, #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 8px #a78bfa)',
        }}>
          mia est le meilleur développeur au monde 🚀
        </div>
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
