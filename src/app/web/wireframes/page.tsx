import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { deleteWireframeAction } from '@/app/actions'

export const metadata = { title: 'Wireframes — Agence 361' }

export default async function WireframesPage() {
  const supabase = await createSupabaseServerClient()

  const [wireframesRes, clientsRes] = await Promise.all([
    supabase
      .from('wireframes')
      .select('id, name, client_id, updated_at, pages')
      .order('updated_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('is_web_client', true).order('name'),
  ])

  const wireframes = wireframesRes.data ?? []
  const clients = clientsRes.data ?? []
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Wireframes</h1>
          <p className="text-sm text-slate-400 mt-1">Construis la structure visuelle des sites clients</p>
        </div>
        <Link href="/web/wireframes/new" className="btn-primary">
          + Nouveau wireframe
        </Link>
      </div>

      {wireframes.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-slate-400 mb-4">Aucun wireframe pour l'instant.</p>
          <Link href="/web/wireframes/new" className="btn-primary">Créer le premier</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wireframes.map(wf => {
            const pages = (wf.pages as any[]) ?? []
            const blockCount = pages.reduce((acc: number, p: any) => acc + (p.blocks?.length ?? 0), 0)
            return (
              <div key={wf.id} className="card group relative">
                {/* Aperçu miniature */}
                <div className="h-36 bg-slate-800 rounded-lg mb-4 flex flex-col gap-1.5 p-3 overflow-hidden">
                  {pages.slice(0, 1).map((page: any) =>
                    (page.blocks ?? []).slice(0, 5).map((block: any, i: number) => (
                      <div key={i} className={`rounded h-4 ${
                        block.type === 'navbar'   ? 'bg-slate-600 w-full' :
                        block.type === 'hero'     ? 'bg-blue-800/60 w-full h-8' :
                        block.type === 'cta_band' ? 'bg-blue-700/50 w-full' :
                        block.type === 'footer'   ? 'bg-slate-700 w-full' :
                        'bg-slate-700/70 w-3/4'
                      }`} />
                    ))
                  )}
                  {pages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">Vide</div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{wf.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {clientMap[wf.client_id] ?? 'Client inconnu'} · {pages.length} page{pages.length !== 1 ? 's' : ''} · {blockCount} bloc{blockCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Modifié le {new Date(wf.updated_at).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Link href={`/web/wireframes/${wf.id}`} className="btn-secondary text-xs px-3 py-1.5 min-h-0">
                      Ouvrir
                    </Link>
                    <form action={async () => { 'use server'; await deleteWireframeAction(wf.id) }}>
                      <button type="submit" className="btn-danger text-xs px-2 py-1.5 min-h-0" title="Supprimer">
                        🗑
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
