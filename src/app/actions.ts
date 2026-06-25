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
  chargeWebDept: boolean = false,
  chargeClient: boolean = false,
  clientHourlyRate: number | null = null
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
    charge_client: chargeClient,
    client_hourly_rate: chargeClient ? clientHourlyRate : null,
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
    .select('paused_at, total_paused_ms, started_at, charge_client, client_hourly_rate, projects(name)')
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

  let clientBillInfo: { hours: number; amount: number; projectName: string } | undefined
  if (entry?.charge_client && entry.client_hourly_rate && entry.started_at) {
    const workMs = Math.max(0, now.getTime() - new Date(entry.started_at).getTime() - totalPausedMs)
    const hours = workMs / 3_600_000
    clientBillInfo = {
      hours,
      amount: hours * entry.client_hourly_rate,
      projectName: (entry.projects as any)?.name ?? '',
    }
  }

  revalidatePath('/dashboard')
  return { success: true, clientBillInfo }
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
    started_at:        string
    ended_at:          string | null
    client_id:         string | null
    project_id:        string | null
    notes:             string | null
    is_billable:       boolean
    charge_client:     boolean
    client_hourly_rate: number | null
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

// ── Admin : toggle client web ────────────────────────────

export async function toggleWebClientAction(clientId: string, value: boolean) {
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const { error } = await supabase
    .from('clients')
    .update({ is_web_client: value })
    .eq('id', clientId)
  if (error) return { error: error.message }
  revalidatePath('/admin/clients')
  revalidatePath('/web')
  return { success: true }
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

export async function addManualEntryAction(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'a.monier@agence361.com') return { error: 'Accès refusé.' }

  const targetUserId  = formData.get('target_user_id') as string
  const clientId      = formData.get('client_id') as string
  const projectId     = formData.get('project_id') as string
  const dateStr       = formData.get('date') as string
  const startTime     = formData.get('start_time') as string
  const endTime       = formData.get('end_time') as string
  const notes         = formData.get('notes') as string
  const isBillable    = formData.get('is_billable') === 'true'
  const chargeWebDept   = formData.get('charge_web_dept') === 'true'
  const chargeClient    = formData.get('charge_client') === 'true'
  const clientRateStr   = formData.get('client_hourly_rate') as string

  if (!targetUserId || !clientId || !projectId || !dateStr || !startTime || !endTime) {
    return { error: 'Tous les champs obligatoires doivent être remplis.' }
  }

  const startedAt = new Date(`${dateStr}T${startTime}:00`)
  const endedAt   = new Date(`${dateStr}T${endTime}:00`)

  if (endedAt <= startedAt) return { error: "L'heure de fin doit être après l'heure de début." }

  const { error } = await supabase.from('time_entries').insert({
    user_id:            targetUserId,
    client_id:          clientId,
    project_id:         projectId,
    started_at:         startedAt.toISOString(),
    ended_at:           endedAt.toISOString(),
    notes:              notes || null,
    is_billable:        isBillable,
    charge_web_dept:    chargeWebDept,
    charge_client:      chargeClient,
    client_hourly_rate: chargeClient && clientRateStr ? parseFloat(clientRateStr) : null,
    total_paused_ms:    0,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/reports')
  return { success: true }
}

// ── Projets Web ───────────────────────────────────────────

const VALID_WEB_FIELDS = new Set([
  'p1_rencontre_client', 'p1_brief_ecrit', 'p1_contrat_signe', 'p1_collecte_assets', 'p1_acces_environnement',
  'p2_recherche_moodboard', 'p2_architecture_site', 'p2_wireframes_1', 'p2_approbation_1', 'p2_wireframes_2', 'p2_approbation_2',
  'p3_mise_en_place_env', 'p3_structure_gabarits', 'p3_integration_contenu', 'p3_responsive', 'p3_formulaires_fonct', 'p3_seo', 'p3_optimisation_perf',
  'p4_staging_v1', 'p4_modifications_r1', 'p4_staging_v2', 'p4_modifications_r2', 'p4_approbation_finale',
  'p5_tests_complets', 'p5_securite_performance', 'p5_mise_en_ligne', 'p5_surveillance', 'p5_formation_client',
  'p5_remise_livrables', 'p5_indexation_google', 'p5_installation_pixels', 'p5_facturation',
])

export async function toggleWebProjectStepAction(clientId: string, field: string, value: boolean) {
  if (!VALID_WEB_FIELDS.has(field)) return { error: 'Champ invalide.' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('role, is_web_dept').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && !profile.is_web_dept)) return { error: 'Accès refusé.' }

  const { error } = await supabase
    .from('web_projects')
    .upsert({ client_id: clientId, [field]: value }, { onConflict: 'client_id' })

  if (error) return { error: error.message }
  return { success: true }
}

// ── Admin : punch out forcé ───────────────────────────────

export async function adminClockOutAction(entryId: string) {
  const supabase = await createSupabaseServerClient()
  const caller   = await requireAdmin()
  if (!caller) return { error: 'Accès refusé.' }

  const { data: entry } = await supabase.from('time_entries')
    .select('paused_at, total_paused_ms')
    .eq('id', entryId)
    .is('ended_at', null)
    .single()

  if (!entry) return { error: 'Session introuvable.' }

  const now = new Date()
  let totalPausedMs = entry.total_paused_ms ?? 0
  if (entry.paused_at) {
    totalPausedMs += now.getTime() - new Date(entry.paused_at).getTime()
  }

  const { error } = await supabase.from('time_entries')
    .update({ ended_at: now.toISOString(), paused_at: null, total_paused_ms: totalPausedMs })
    .eq('id', entryId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
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

// ── Wireframes ────────────────────────────────────────────

export async function createWireframeAction(clientId: string, name: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('wireframes')
    .insert({ client_id: clientId, name, created_by: user.id, pages: [] })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/web/wireframes')
  return { id: data.id }
}

export async function saveWireframeAction(id: string, name: string, pages: unknown[]) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('wireframes')
    .update({ name, pages, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteWireframeAction(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase.from('wireframes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/web/wireframes')
  return { success: true }
}
