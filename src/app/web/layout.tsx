import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_web_dept')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && !profile.is_web_dept)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <Nav
        fullName={profile.full_name ?? ''}
        role={profile.role as 'employee' | 'admin'}
        isWebDept={true}
      />
      <main className="max-w-6xl mx-auto px-4 pt-5 pb-28 sm:pt-8 sm:pb-8">
        {children}
      </main>
    </div>
  )
}
