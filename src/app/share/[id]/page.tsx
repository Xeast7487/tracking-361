import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import BlockPreview from '@/components/wireframe/BlockPreview'
import { WireframePage } from '@/components/wireframe/wireframeTypes'
import PrintButton from './PrintButton'

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: wf } = await supabase
    .from('wireframes')
    .select('*, clients(name)')
    .eq('id', params.id)
    .single()

  if (!wf) notFound()

  const pages: WireframePage[] = wf.pages ?? []
  const clientName = (wf.clients as any)?.name ?? ''

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 print:hidden sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Agence 361</div>
            <h1 className="text-lg font-bold text-slate-900">{wf.name}</h1>
            {clientName && <p className="text-sm text-slate-500">Client : {clientName}</p>}
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block px-8 py-6 border-b border-slate-200 mb-6">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Agence 361 — Wireframe</div>
        <h1 className="text-2xl font-bold text-slate-900">{wf.name}</h1>
        {clientName && <p className="text-sm text-slate-600 mt-1">Client : {clientName}</p>}
      </div>

      {/* Pages */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-16 print:space-y-0 print:px-8">
        {pages.map((page, pageIdx) => (
          <div key={page.id} className="print:break-before-page print:pt-6">
            {/* Page header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {pageIdx + 1}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{page.name}</h2>
                <p className="text-xs text-slate-400">{page.blocks.length} bloc{page.blocks.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            {page.blocks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
                Page vide
              </div>
            ) : (
              <div className="space-y-3">
                {page.blocks.map((block, blockIdx) => (
                  <div key={block.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
                    {/* Block index badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100 print:bg-white">
                      <span className="text-xs text-slate-400 font-mono">#{blockIdx + 1}</span>
                      <span className="text-xs font-medium text-slate-600">{block.type.replace(/_/g, ' ')}</span>
                      {block.note && (
                        <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 max-w-sm truncate">
                          💬 {block.note}
                        </span>
                      )}
                    </div>
                    <BlockPreview block={block} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-6 py-8 mt-8 border-t border-slate-200 print:hidden">
        <p className="text-xs text-slate-400 text-center">
          Wireframe généré par Agence 361 — Document confidentiel
        </p>
      </div>
    </div>
  )
}
