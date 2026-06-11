'use client'

import { useEffect, useRef } from 'react'

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
    <div
      ref={ref}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.2s',
        zIndex: 9999,
        fontSize: '13px',
        fontWeight: 600,
        color: '#fff',
        background: 'rgba(0,0,0,0.65)',
        padding: '3px 8px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      Nico Suce
    </div>
  )
}
