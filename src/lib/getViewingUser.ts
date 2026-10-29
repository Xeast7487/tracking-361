import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const COOKIE = 'x_impersonate_uid'

export async function getViewingUserId(realUserId: string): Promise<{
  viewingId: string
  viewingName: string | null
  isImpersonating: boolean
}> {
  const cookieStore = await cookies()
  const impersonateId = cookieStore.get(COOKIE)?.value

  if (!impersonateId) {
    return { viewingId: realUserId, viewingName: null, isImpersonating: false }
  }

  // Fetch the impersonated user's name to show in banner
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await admin.from('profiles').select('full_name').eq('id', impersonateId).single()

  return {
    viewingId: impersonateId,
    viewingName: data?.full_name ?? null,
    isImpersonating: true,
  }
}
