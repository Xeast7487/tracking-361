'use client'

import { useEffect, useRef, useState } from 'react'

export default function TrollWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    // Durée aléatoire entre 30 et 45 secondes
    const duration = 30000 + Math.random() * 15000
    const killTroll = setTimeout(() => setActive(false), duration)

    // ── Texte qui se mélange ──────────────────────────────────────────────────
    const scrambleChar = (c: string) => {
      const pool = 'abcdefghijklmnopqrstuvwxyz'
      return c === ' ' || c === '\n' ? c : pool[Math.floor(Math.random() * pool.length)]
    }

    const scrambleNode = (node: Text) => {
      const original = node.textContent ?? ''
      if (!original.trim()) return
      let i = 0
      const chars = original.split('')
      const interval = setInterval(() => {
        if (i >= chars.length) { clearInterval(interval); node.textContent = original; return }
        node.textContent = chars
          .map((c, idx) => idx < i ? c : idx === i ? scrambleChar(c) : c)
          .join('')
        i++
      }, 30)
    }

    const getTextNodes = (el: Element): Text[] => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
      })
      const nodes: Text[] = []
      let node: Node | null
      while ((node = walker.nextNode())) nodes.push(node as Text)
      return nodes
    }

    const triggerScramble = () => {
      if (!containerRef.current) return
      const nodes = getTextNodes(containerRef.current)
      if (!nodes.length) return
      const target = nodes[Math.floor(Math.random() * nodes.length)]
      scrambleNode(target)
    }

    let scrambleTimeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      scrambleTimeout = setTimeout(() => { triggerScramble(); schedule() }, 8000 + Math.random() * 6000)
    }
    const first = setTimeout(() => { triggerScramble(); schedule() }, 3000)

    return () => {
      clearTimeout(killTroll)
      clearTimeout(first)
      clearTimeout(scrambleTimeout)
    }
  }, [])

  if (!active) return <>{children}</>

  return (
    <div
      ref={containerRef}
      style={{
        transform: 'rotate(180deg)',
        transformOrigin: 'center center',
        minHeight: '100vh',
        transition: 'transform 1.2s ease-in-out',
      }}
    >
      {children}
    </div>
  )
}
