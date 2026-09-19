'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import ExplosionLoader from '@/components/ExplosionLoader'

const ANIM_MS = 9200

export default function Home() {
  const router = useRouter()
  const destRef = useRef<string | null>(null)
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      destRef.current = user ? '/dashboard' : '/login'
    })
    const t = setTimeout(() => setAnimDone(true), ANIM_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!animDone) return
    if (destRef.current) {
      router.replace(destRef.current)
      return
    }
    const poll = setInterval(() => {
      if (destRef.current) {
        clearInterval(poll)
        router.replace(destRef.current)
      }
    }, 50)
    return () => clearInterval(poll)
  }, [animDone, router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <ExplosionLoader />
      <div className="text-center">
        <p className="text-2xl font-bold text-white tracking-wider">Agence 361</p>
        <p className="text-slate-500 text-sm mt-1 tracking-widest uppercase">Suivi des heures</p>
      </div>
    </div>
  )
}
