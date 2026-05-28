import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient(rememberMe?: boolean) {
  const cookieStore = await cookies()
  // If not explicitly passed, read preference saved at login
  const persist = rememberMe ?? (cookieStore.get('sb-remember-me')?.value !== 'false')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!persist && options) {
                const { maxAge, expires, ...rest } = options
                cookieStore.set(name, value, rest)
              } else {
                cookieStore.set(name, value, options)
              }
            })
          } catch {}
        },
      },
    }
  )
}
