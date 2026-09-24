import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createSupabaseAdminClient()
  const { data: att } = await admin
    .from('dossier_attachments')
    .select('id, storage_path, name, entry_id, entries:dossier_entries(employee_id, is_confidential)')
    .eq('id', params.attachmentId)
    .single()

  if (!att) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const entry = (att as any).entries
  const isOwner = entry?.employee_id === user.id
  const isAdmin = profile.role === 'admin'

  if (!isAdmin && (!isOwner || entry?.is_confidential)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data: signed } = await admin.storage
    .from('dossier-files')
    .createSignedUrl(att.storage_path, 3600)

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
