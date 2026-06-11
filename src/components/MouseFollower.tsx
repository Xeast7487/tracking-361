'use client'

import { useEffect, useRef } from 'react'

const TEXT = 'Nico Suce'

export default function MouseFollower() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX + 14}px`
      el.style.top = `${e.clientY + 14}px`
      el.style.opacity = '1'
    }

    const onLeave = () => { el.style.opacity = '0' }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes letterWave {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          25% { transform: translateY(-5px) rotate(-4deg) scale(1.1); }
          75% { transform: translateY(3px) rotate(4deg) scale(0.95); }
        }
        @keyframes rainbow {
          0%   { color: #ff6b6b; }
          16%  { color: #ffaa00; }
          33%  { color: #ffe600; }
          50%  { color: #00e676; }
          66%  { color: #00cfff; }
          83%  { color: #d45fff; }
          100% { color: #ff6b6b; }
        }
        .mf-letter {
          display: inline-block;
          animation: letterWave 0.55s ease-in-out infinite, rainbow 2s linear infinite;
        }
      `}</style>
      <div
        ref={ref}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: 800,
          background: 'rgba(0,0,0,0.78)',
          padding: '4px 10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          letterSpacing: '1px',
        }}
      >
        {TEXT.split('').map((char, i) => (
          <span
            key={i}
            className="mf-letter"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </div>
    </>
  )
}
