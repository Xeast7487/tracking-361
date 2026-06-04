import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: profile } = await serviceClient
    .from('profiles').select('full_name, role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen">
      <Nav fullName={profile.full_name} role="admin" />
      <main className="max-w-6xl mx-auto px-4 pt-5 pb-28 sm:pt-8 sm:pb-8 overflow-x-auto">
        {children}
      </main>
    </div>
  )
}
