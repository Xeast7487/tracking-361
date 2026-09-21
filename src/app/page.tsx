'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? '/dashboard' : '/login')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-white tracking-wider">Agence 361</p>
        <p className="text-slate-500 text-sm mt-1 tracking-widest uppercase">Suivi des heures</p>
      </div>
    </div>
  )
}
