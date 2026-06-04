'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── Auth ──────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const rememberMe = formData.get('remember_me') === 'on'
  const cookieStore = await cookies()

  // Persist preference so middleware respects it on token refreshes
  cookieStore.set('sb-remember-me', rememberMe ? 'true' : 'false', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  })

  const supabase = await createSupabaseServerClient(rememberMe)
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: 'Courriel ou mot de passe incorrect.' }
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Clients ───────────────────────────────────────────────

export async function createClientAction(name: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data }
}

// ── Projets ───────────────────────────────────────────────

export async function createProjectAction(clientId: string, name: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ client_id: clientId, name: name.trim() })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data }
}

// ── Entrées de temps ──────────────────────────────────────

export async function clockInAction(
  clientId: string,
  projectId: string,
  notes: string,
  isBillable: boolean,
  chargeWebDept: boolean = false
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle()
  if (existing) return { error: 'Une session est déjà en cours.' }

  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    client_id: clientId,
    project_id: projectId,
    notes: notes || null,
    is_billable: isBillable,
    charge_web_dept: chargeWebDept,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function clockOutAction(entryId: string, notes?: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: entry } = await supabase.from('time_entries')
    .select('paused_at, total_paused_ms')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()

  const now = new Date()
  let totalPausedMs = entry?.total_paused_ms ?? 0
  if (entry?.paused_at) {
    totalPausedMs += now.getTime() - new Date(entry.paused_at).getTime()
  }

  const { error } = await supabase.from('time_entries')
    .update({ ended_at: now.toISOString(), paused_at: null, total_paused_ms: totalPausedMs, ...(notes !== undefined && { notes: notes || null }) })
    .eq('id', entryId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function pauseEntryAction(entryId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('time_entries')
    .update({ paused_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', user.id)
    .is('paused_at', null)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function resumeEntryAction(entryId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: entry } = await supabase.from('time_entries')
    .select('paused_at, total_paused_ms')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()
  if (!entry?.paused_at) return { error: 'La session n\'est pas en pause.' }

  const additionalMs = Date.now() - new Date(entry.paused_at).getTime()
  const newTotal = (entry.total_paused_ms ?? 0) + additionalMs

  const { error } = await supabase.from('time_entries')
    .update({ paused_at: null, total_paused_ms: newTotal })
    .eq('id', entryId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Admin : helper ────────────────────────────────────────

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// ── Admin : gestion des employés ──────────────────────────

export async function createUserAction(formData: FormData) {
  const admin = getAdminClient()
  const caller = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role     = (formData.get('role') as string) || 'employee'
  const rateStr   = formData.get('hourly_rate') as string
  const isWebDept = formData.get('is_web_dept') === 'true'

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authErr) return { error: authErr.message }

  await admin.from('profiles').update({
    full_name: fullName,
    role,
    hourly_rate: rateStr ? parseFloat(rateStr) : null,
    is_web_dept: isWebDept,
  }).eq('id', authData.user.id)

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserAction(userId: string, formData: FormData) {
  const admin    = getAdminClient()
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const fullName = formData.get('full_name') as string
  const role     = formData.get('role') as string
  const rateStr  = formData.get('hourly_rate') as string
  const isActive  = formData.get('is_active') === 'true'
  const isWebDept = formData.get('is_web_dept') === 'true'
  const password  = formData.get('password') as string

  if (password) {
    await admin.auth.admin.updateUserById(userId, { password })
  }

  const { error } = await supabase.from('profiles').update({
    full_name: fullName,
    role,
    hourly_rate: rateStr ? parseFloat(rateStr) : null,
    is_active: isActive,
    is_web_dept: isWebDept,
  }).eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

// ── Entrées : modifier ───────────────────────────────────

export async function fetchClientsAndProjectsAction() {
  const supabase = await createSupabaseServerClient()
  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('projects').select('id, client_id, name').order('name'),
  ])
  return {
    clients:  clientsRes.data  ?? [],
    projects: projectsRes.data ?? [],
  }
}

export async function updateEntryAction(
  entryId: string,
  data: {
    started_at:  string
    ended_at:    string | null
    client_id:   string | null
    project_id:  string | null
    notes:       string | null
    is_billable: boolean
  }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('time_entries')
    .update(data)
    .eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/admin/reports')
  return {}
}

// ── Admin : suppression d'un client ──────────────────────

export async function deleteClientAction(clientId: string) {
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const { error } = await supabase.from('clients').delete().eq('id', clientId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/admin/clients')
  return { success: true }
}

// ── Admin : suppression d'un projet ──────────────────────

export async function deleteProjectAction(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/admin/clients')
  return { success: true }
}

// ── Admin : suppression d'une entrée ─────────────────────

export async function deleteEntryAction(entryId: string) {
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const { error } = await supabase.from('time_entries').delete().eq('id', entryId)
  if (error) return { error: error.message }
  revalidatePath('/admin/reports')
  return { success: true }
}
