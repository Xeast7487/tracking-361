import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import FloatingTimer from '@/components/FloatingTimer'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'
import { getViewingUserId } from '@/lib/getViewingUser'
import { stopImpersonationAction } from '@/app/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const defaultName = translations[lang].dashboard.defaultName

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_web_dept')
    .eq('id', user.id)
    .single()

  const { isImpersonating, viewingName } = await getViewingUserId(user.id)

  return (
    <div className="min-h-screen">
      {isImpersonating && (
        <div className="sticky top-0 z-[60] bg-amber-500/95 backdrop-blur border-b border-amber-400/50 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-amber-950 text-sm font-semibold">
            👁️ Vous visualisez le compte de <span className="font-bold">{viewingName}</span>
          </p>
          <form action={stopImpersonationAction}>
            <button type="submit" className="text-xs font-bold bg-amber-900/20 hover:bg-amber-900/30 text-amber-950 px-3 py-1 rounded-lg transition-colors">
              Quitter
            </button>
          </form>
        </div>
      )}
      <Nav
        fullName={profile?.full_name ?? defaultName}
        role={profile?.role as 'employee' | 'admin'}
        isWebDept={profile?.is_web_dept ?? false}
      />
      <main className="max-w-6xl mx-auto px-4 pt-5 pb-28 sm:pt-8 sm:pb-8">
        {children}
      </main>
      <FloatingTimer />
    </div>
  )
}
