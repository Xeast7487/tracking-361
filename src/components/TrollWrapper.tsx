'use client'

import { useEffect, useRef } from 'react'

export default function TrollWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    // Scramble aléatoire toutes les 8-14 secondes
    const triggerScramble = () => {
      if (!containerRef.current) return
      const nodes = getTextNodes(containerRef.current)
      if (!nodes.length) return
      const target = nodes[Math.floor(Math.random() * nodes.length)]
      scrambleNode(target)
    }

    let timeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      timeout = setTimeout(() => { triggerScramble(); schedule() }, 8000 + Math.random() * 6000)
    }
    // Premier scramble après 3s pour que ça frappe vite
    const first = setTimeout(() => { triggerScramble(); schedule() }, 3000)

    return () => { clearTimeout(first); clearTimeout(timeout) }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        transform: 'rotate(180deg)',
        transformOrigin: 'center center',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  )
}
