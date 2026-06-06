'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { saveWireframeAction } from '@/app/actions'
import BlockPreview from './BlockPreview'
import { BLOCK_PALETTE, BlockType, Block, WireframePage } from './wireframeTypes'

interface Wireframe {
  id: string
  name: string
  client_id: string
  pages: WireframePage[]
}

interface Props {
  wireframe: Wireframe
  clients: { id: string; name: string }[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function WireframeBuilder({ wireframe, clients }: Props) {
  const [name, setName] = useState(wireframe.name)
  const [pages, setPages] = useState<WireframePage[]>(
    wireframe.pages.length > 0 ? wireframe.pages : [{ id: generateId(), name: 'Accueil', blocks: [] }]
  )
  const [activePageIdx, setActivePageIdx] = useState(0)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const [editingPageName, setEditingPageName] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activePage = pages[activePageIdx] ?? pages[0]
  const selectedBlock = activePage?.blocks.find(b => b.id === selectedBlockId) ?? null
  const clientName = clients.find(c => c.id === wireframe.client_id)?.name ?? ''

  // ── Auto-save ───────────────────────────────────────────
  const scheduleSave = useCallback((nextPages: WireframePage[], nextName: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await saveWireframeAction(wireframe.id, nextName, nextPages)
        setSaveStatus(res?.error ? 'error' : 'saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      })
    }, 800)
  }, [wireframe.id])

  function updatePages(updater: (p: WireframePage[]) => WireframePage[]) {
    setPages(prev => {
      const next = updater(prev)
      scheduleSave(next, name)
      return next
    })
  }

  function updateName(n: string) {
    setName(n)
    scheduleSave(pages, n)
  }

  // ── Page ops ────────────────────────────────────────────
  function addPage() {
    const newPage: WireframePage = { id: generateId(), name: `Page ${pages.length + 1}`, blocks: [] }
    updatePages(prev => [...prev, newPage])
    setActivePageIdx(pages.length)
    setSelectedBlockId(null)
  }

  function deletePage(idx: number) {
    if (pages.length === 1) return
    updatePages(prev => prev.filter((_, i) => i !== idx))
    setActivePageIdx(prev => Math.max(0, prev > idx ? prev - 1 : prev === idx ? 0 : prev))
    setSelectedBlockId(null)
  }

  function renamePage(idx: number, newName: string) {
    updatePages(prev => prev.map((p, i) => i === idx ? { ...p, name: newName } : p))
  }

  // ── Block ops ───────────────────────────────────────────
  function addBlock(type: BlockType) {
    const block: Block = { id: generateId(), type, note: '' }
    updatePages(prev => prev.map((p, i) =>
      i === activePageIdx ? { ...p, blocks: [...p.blocks, block] } : p
    ))
    setSelectedBlockId(block.id)
  }

  function deleteBlock(blockId: string) {
    updatePages(prev => prev.map((p, i) =>
      i === activePageIdx ? { ...p, blocks: p.blocks.filter(b => b.id !== blockId) } : p
    ))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  function moveBlock(blockId: string, dir: -1 | 1) {
    updatePages(prev => prev.map((p, i) => {
      if (i !== activePageIdx) return p
      const idx = p.blocks.findIndex(b => b.id === blockId)
      if (idx < 0) return p
      const next = [...p.blocks]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return p
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { ...p, blocks: next }
    }))
  }

  function updateBlockNote(blockId: string, note: string) {
    updatePages(prev => prev.map((p, i) =>
      i === activePageIdx
        ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, note } : b) }
        : p
    ))
  }

  function duplicateBlock(blockId: string) {
    updatePages(prev => prev.map((p, i) => {
      if (i !== activePageIdx) return p
      const idx = p.blocks.findIndex(b => b.id === blockId)
      if (idx < 0) return p
      const copy: Block = { ...p.blocks[idx], id: generateId() }
      const next = [...p.blocks]
      next.splice(idx + 1, 0, copy)
      return { ...p, blocks: next }
    }))
  }

  const statusColor = saveStatus === 'saved' ? 'text-green-400' : saveStatus === 'error' ? 'text-red-400' : saveStatus === 'saving' ? 'text-slate-400' : 'text-slate-600'
  const statusText = saveStatus === 'saved' ? '✓ Sauvegardé' : saveStatus === 'error' ? '✗ Erreur' : saveStatus === 'saving' ? 'Sauvegarde...' : ''

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mx-4 -my-4 overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <a href="/web/wireframes" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
          ← Wireframes
        </a>
        <div className="w-px h-4 bg-slate-700" />
        <input
          value={name}
          onChange={e => updateName(e.target.value)}
          className="bg-transparent text-white font-semibold text-sm border-none outline-none focus:bg-slate-800 focus:px-2 rounded transition-all min-w-0 flex-1 max-w-64"
          placeholder="Nom du wireframe"
        />
        <span className="text-xs text-slate-500">{clientName}</span>
        <div className="flex-1" />
        <span className={`text-xs ${statusColor} min-w-24 text-right`}>{statusText}</span>
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
          <span className="text-xs text-slate-400">{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            {activePage?.blocks.length ?? 0} bloc{(activePage?.blocks.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── PAGE TABS ── */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-850 border-b border-slate-700 flex-shrink-0 overflow-x-auto" style={{ background: '#0f172a' }}>
        {pages.map((page, idx) => (
          <div key={page.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all flex-shrink-0 group ${
            idx === activePageIdx
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}>
            {editingPageName === page.id ? (
              <input
                autoFocus
                defaultValue={page.name}
                className="bg-transparent outline-none w-24 text-sm"
                onBlur={e => { renamePage(idx, e.target.value || page.name); setEditingPageName(null) }}
                onKeyDown={e => { if (e.key === 'Enter') { renamePage(idx, e.currentTarget.value || page.name); setEditingPageName(null) } }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span onClick={() => { setActivePageIdx(idx); setSelectedBlockId(null) }}
                    onDoubleClick={() => setEditingPageName(page.id)}>
                {page.name}
              </span>
            )}
            {pages.length > 1 && idx === activePageIdx && (
              <button onClick={() => deletePage(idx)}
                className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white text-xs ml-1 transition-opacity">
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={addPage}
          className="px-2.5 py-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-all flex-shrink-0">
          + Page
        </button>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT — PALETTE ── */}
        <div className="w-52 flex-shrink-0 border-r border-slate-700 overflow-y-auto bg-slate-900 p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Ajouter un bloc</p>
          {Object.entries(BLOCK_PALETTE).map(([category, blocks]) => (
            <div key={category} className="mb-4">
              <p className="text-xs text-slate-600 font-medium mb-1.5 px-1">{category}</p>
              <div className="flex flex-col gap-1">
                {blocks.map(b => (
                  <button key={b.type} onClick={() => addBlock(b.type as BlockType)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-slate-800 transition-colors group w-full">
                    <span className="text-base flex-shrink-0">{b.icon}</span>
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── CENTER — CANVAS ── */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {activePage?.blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">📐</div>
              <p className="text-slate-400 font-medium mb-1">Page vide</p>
              <p className="text-slate-600 text-sm">Clique sur un bloc dans la palette de gauche pour commencer</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              {activePage.blocks.map((block, idx) => (
                <div key={block.id}
                  onClick={() => setSelectedBlockId(block.id === selectedBlockId ? null : block.id)}
                  className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all group relative ${
                    block.id === selectedBlockId
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-transparent hover:border-slate-600'
                  }`}>
                  <BlockPreview block={block} />

                  {/* Controls overlay */}
                  <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${
                    block.id === selectedBlockId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1) }}
                      disabled={idx === 0}
                      className="w-7 h-7 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-xs disabled:opacity-30 transition-colors">
                      ↑
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1) }}
                      disabled={idx === activePage.blocks.length - 1}
                      className="w-7 h-7 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-xs disabled:opacity-30 transition-colors">
                      ↓
                    </button>
                    <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                      className="w-7 h-7 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-xs transition-colors"
                      title="Dupliquer">
                      ⧉
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBlock(block.id) }}
                      className="w-7 h-7 bg-red-900/80 hover:bg-red-700 text-red-300 rounded flex items-center justify-center text-xs transition-colors">
                      ×
                    </button>
                  </div>

                  {/* Note badge */}
                  {block.note && (
                    <div className="absolute bottom-2 left-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-2 py-0.5 rounded-full max-w-[60%] truncate">
                      💬 {block.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT — INSPECTOR ── */}
        <div className="w-60 flex-shrink-0 border-l border-slate-700 bg-slate-900 overflow-y-auto">
          {selectedBlock ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">
                  {Object.values(BLOCK_PALETTE).flat().find(b => b.type === selectedBlock.type)?.icon ?? '🔲'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {Object.values(BLOCK_PALETTE).flat().find(b => b.type === selectedBlock.type)?.label ?? selectedBlock.type}
                  </p>
                  <p className="text-xs text-slate-500">Bloc sélectionné</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Note / Annotation</label>
                  <textarea
                    className="input text-sm resize-none"
                    rows={4}
                    placeholder="Décris le contenu de ce bloc... ex: 'Hero avec photo de l'équipe et slogan principal'"
                    value={selectedBlock.note}
                    onChange={e => updateBlockNote(selectedBlock.id, e.target.value)}
                  />
                  <p className="text-xs text-slate-600 mt-1">Cette note sera utilisée par Claude pour générer le contenu réel.</p>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Actions</p>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => moveBlock(selectedBlock.id, -1)}
                      className="btn-secondary text-xs py-1.5 min-h-0 w-full">↑ Monter</button>
                    <button onClick={() => moveBlock(selectedBlock.id, 1)}
                      className="btn-secondary text-xs py-1.5 min-h-0 w-full">↓ Descendre</button>
                    <button onClick={() => duplicateBlock(selectedBlock.id)}
                      className="btn-secondary text-xs py-1.5 min-h-0 w-full">⧉ Dupliquer</button>
                    <button onClick={() => deleteBlock(selectedBlock.id)}
                      className="btn-danger text-xs py-1.5 min-h-0 w-full">✕ Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="text-3xl mb-2">👆</div>
              <p className="text-slate-500 text-sm">Clique sur un bloc pour l'éditer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
