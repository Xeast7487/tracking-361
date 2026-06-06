import { Block } from './wireframeTypes'

/* Helpers */
const Img = ({ w = 'w-full', h = 'h-full', className = '' }) => (
  <div className={`${w} ${h} ${className} bg-slate-700 rounded flex items-center justify-center flex-shrink-0`}>
    <svg className="text-slate-500 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5"/>
      <path d="m21 15-5-5L5 21" strokeWidth="1.5"/>
    </svg>
  </div>
)

const Line = ({ w = 'w-full', h = 'h-2', className = '' }) => (
  <div className={`${w} ${h} ${className} bg-slate-600 rounded-full`} />
)

const Btn = ({ label = 'Bouton', color = 'bg-blue-700' }) => (
  <div className={`${color} text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-block`}>{label}</div>
)

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-800 rounded-lg p-3 ${className}`}>{children}</div>
)

/* Wrapper commun */
function BlockWrap({ children, label, bg = 'bg-slate-900' }: { children: React.ReactNode; label: string; bg?: string }) {
  return (
    <div className={`${bg} relative select-none`}>
      <div className="absolute top-2 left-3 text-xs text-slate-600 font-mono">{label}</div>
      <div className="pt-6 pb-4 px-4">{children}</div>
    </div>
  )
}

export default function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {

    /* ── NAVBAR ── */
    case 'navbar':
      return (
        <BlockWrap label="navbar" bg="bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-20 h-5 bg-slate-600 rounded" />
            <div className="flex-1" />
            <div className="flex gap-3">
              {[60,60,60].map((w,i) => <div key={i} style={{width:w}} className="h-2.5 bg-slate-600 rounded-full" />)}
            </div>
            <Btn label="CTA" />
          </div>
        </BlockWrap>
      )

    /* ── HERO SPLIT ── */
    case 'hero_split':
      return (
        <BlockWrap label="hero — texte + image" bg="bg-slate-900">
          <div className="flex gap-6 items-center" style={{ minHeight: 120 }}>
            <div className="flex-1 space-y-2.5">
              <Line w="w-4/5" h="h-5" className="bg-slate-400" />
              <Line w="w-3/5" h="h-3" />
              <Line w="w-2/5" h="h-3" />
              <div className="flex gap-2 mt-3">
                <Btn label="Primaire" />
                <div className="border border-slate-600 text-slate-400 text-xs px-3 py-1.5 rounded-lg">Secondaire</div>
              </div>
            </div>
            <Img w="w-2/5" h="h-28" className="rounded-xl" />
          </div>
        </BlockWrap>
      )

    /* ── HERO CENTER ── */
    case 'hero_center':
      return (
        <BlockWrap label="hero — centré" bg="bg-slate-900">
          <div className="flex flex-col items-center text-center space-y-2.5 py-4">
            <Line w="w-16" h="h-2" className="bg-blue-700 rounded-full" />
            <Line w="w-3/4" h="h-6" className="bg-slate-300" />
            <Line w="w-1/2" h="h-3" />
            <Line w="w-1/3" h="h-3" />
            <div className="flex gap-2 mt-2">
              <Btn label="Commencer" />
              <div className="border border-slate-600 text-slate-400 text-xs px-3 py-1.5 rounded-lg">En savoir plus</div>
            </div>
          </div>
        </BlockWrap>
      )

    /* ── HERO VIDEO ── */
    case 'hero_video':
      return (
        <BlockWrap label="hero — fond vidéo" bg="bg-slate-950">
          <div className="relative rounded-lg overflow-hidden" style={{ minHeight: 120 }}>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40 z-10 flex flex-col justify-center pl-6 gap-2">
              <Line w="w-3/5" h="h-6" className="bg-white/40" />
              <Line w="w-2/5" h="h-3" className="bg-white/20" />
              <div className="mt-2"><Btn label="Découvrir" /></div>
            </div>
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </BlockWrap>
      )

    /* ── SERVICES 2 ── */
    case 'services_2':
      return (
        <BlockWrap label="services — 2 colonnes" bg="bg-slate-900">
          <div className="text-center mb-3 space-y-1">
            <Line w="w-1/3 mx-auto" h="h-4" className="bg-slate-400" />
            <Line w="w-1/4 mx-auto" h="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0,1].map(i => (
              <Card key={i} className="space-y-2">
                <div className="w-8 h-8 bg-blue-800/50 rounded-lg" />
                <Line w="w-3/4" h="h-3" className="bg-slate-500" />
                <Line w="w-full" h="h-2" />
                <Line w="w-4/5" h="h-2" />
              </Card>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── SERVICES 3 ── */
    case 'services_3':
      return (
        <BlockWrap label="services — 3 colonnes" bg="bg-slate-900">
          <div className="text-center mb-3 space-y-1">
            <Line w="w-1/3 mx-auto" h="h-4" className="bg-slate-400" />
            <Line w="w-1/4 mx-auto" h="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2].map(i => (
              <Card key={i} className="space-y-2">
                <div className="w-7 h-7 bg-blue-800/50 rounded-lg" />
                <Line w="w-3/4" h="h-2.5" className="bg-slate-500" />
                <Line w="w-full" h="h-2" />
                <Line w="w-4/5" h="h-2" />
              </Card>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── SERVICES 4 ── */
    case 'services_4':
      return (
        <BlockWrap label="services — 4 colonnes" bg="bg-slate-900">
          <div className="grid grid-cols-4 gap-2">
            {[0,1,2,3].map(i => (
              <Card key={i} className="space-y-2 text-center">
                <div className="w-6 h-6 bg-blue-800/50 rounded-full mx-auto" />
                <Line w="w-full" h="h-2.5" className="bg-slate-500 mx-auto" />
                <Line w="w-4/5" h="h-2" className="mx-auto" />
              </Card>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── IMAGE TEXT LEFT ── */
    case 'image_text_left':
      return (
        <BlockWrap label="image gauche + texte" bg="bg-slate-900">
          <div className="flex gap-5 items-center">
            <Img w="w-2/5" h="h-24" className="rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Line w="w-16" h="h-2" className="bg-blue-700 rounded-full" />
              <Line w="w-4/5" h="h-4" className="bg-slate-400" />
              <Line w="w-full" h="h-2" />
              <Line w="w-3/4" h="h-2" />
              <Line w="w-4/5" h="h-2" />
              <div className="mt-3"><Btn label="En savoir plus" /></div>
            </div>
          </div>
        </BlockWrap>
      )

    /* ── IMAGE TEXT RIGHT ── */
    case 'image_text_right':
      return (
        <BlockWrap label="texte + image droite" bg="bg-slate-900">
          <div className="flex gap-5 items-center">
            <div className="flex-1 space-y-2">
              <Line w="w-16" h="h-2" className="bg-blue-700 rounded-full" />
              <Line w="w-4/5" h="h-4" className="bg-slate-400" />
              <Line w="w-full" h="h-2" />
              <Line w="w-3/4" h="h-2" />
              <Line w="w-4/5" h="h-2" />
              <div className="mt-3"><Btn label="En savoir plus" /></div>
            </div>
            <Img w="w-2/5" h="h-24" className="rounded-xl flex-shrink-0" />
          </div>
        </BlockWrap>
      )

    /* ── TESTIMONIALS ── */
    case 'testimonials':
      return (
        <BlockWrap label="témoignages" bg="bg-slate-800">
          <div className="text-center mb-3 space-y-1">
            <Line w="w-1/4 mx-auto" h="h-4" className="bg-slate-400" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2].map(i => (
              <Card key={i} className="space-y-2 bg-slate-700">
                <div className="text-yellow-400 text-xs">★★★★★</div>
                <Line w="w-full" h="h-2" />
                <Line w="w-4/5" h="h-2" />
                <Line w="w-3/5" h="h-2" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 bg-slate-500 rounded-full" />
                  <Line w="w-1/2" h="h-2" className="bg-slate-500" />
                </div>
              </Card>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── GALLERY GRID ── */
    case 'gallery_grid':
      return (
        <BlockWrap label="galerie — grille" bg="bg-slate-900">
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2,3,4,5].map(i => (
              <Img key={i} h="h-16" className="rounded-lg" />
            ))}
          </div>
        </BlockWrap>
      )

    /* ── GALLERY MASONRY ── */
    case 'gallery_masonry':
      return (
        <BlockWrap label="galerie — masonry" bg="bg-slate-900">
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <Img h="h-20" className="rounded-lg" />
              <Img h="h-12" className="rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Img h="h-12" className="rounded-lg" />
              <Img h="h-20" className="rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Img h="h-16" className="rounded-lg" />
              <Img h="h-16" className="rounded-lg" />
            </div>
          </div>
        </BlockWrap>
      )

    /* ── CTA BAND ── */
    case 'cta_band':
      return (
        <BlockWrap label="bande CTA" bg="bg-blue-900">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Line w="w-3/5" h="h-5" className="bg-white/50" />
              <Line w="w-2/5" h="h-3" className="bg-white/25" />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Btn label="Commencer" color="bg-white" />
              <div className="border border-white/30 text-white/70 text-xs px-3 py-1.5 rounded-lg">Galerie</div>
            </div>
          </div>
        </BlockWrap>
      )

    /* ── CONTACT FORM ── */
    case 'contact_form':
      return (
        <BlockWrap label="formulaire de contact" bg="bg-slate-900">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Line w="w-1/3" h="h-4" className="bg-slate-400" />
              <Line w="w-full" h="h-2" />
              <div className="space-y-1.5 mt-2">
                {['Prénom', 'Courriel', 'Téléphone'].map(l => (
                  <div key={l}>
                    <Line w="w-1/3" h="h-2" className="bg-slate-600 mb-1" />
                    <div className="h-7 bg-slate-800 border border-slate-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-28 bg-slate-800 border border-slate-700 rounded mt-6" />
              <div className="mt-3"><Btn label="Envoyer →" color="bg-blue-700" /></div>
            </div>
          </div>
        </BlockWrap>
      )

    /* ── STATS ── */
    case 'stats':
      return (
        <BlockWrap label="statistiques" bg="bg-slate-800">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[0,1,2,3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  {['35+','150+','98%','24h'][i]}
                </div>
                <Line w="w-3/4 mx-auto" h="h-2" />
              </div>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── TEAM ── */
    case 'team':
      return (
        <BlockWrap label="équipe" bg="bg-slate-900">
          <div className="text-center mb-3"><Line w="w-1/4 mx-auto" h="h-4" className="bg-slate-400" /></div>
          <div className="grid grid-cols-4 gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="text-center space-y-2">
                <div className="w-14 h-14 bg-slate-700 rounded-full mx-auto" />
                <Line w="w-3/4 mx-auto" h="h-2.5" className="bg-slate-500" />
                <Line w="w-1/2 mx-auto" h="h-2" />
              </div>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── FAQ ── */
    case 'faq':
      return (
        <BlockWrap label="FAQ" bg="bg-slate-900">
          <div className="text-center mb-3"><Line w="w-1/4 mx-auto" h="h-4" className="bg-slate-400" /></div>
          <div className="space-y-2 max-w-xl mx-auto">
            {[0,1,2,3].map(i => (
              <div key={i} className="border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-3">
                <Line w="w-3/4" h="h-2.5" className="bg-slate-500" />
                <div className="text-slate-600 text-sm">{i === 0 ? '−' : '+'}</div>
              </div>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── TEXT SECTION ── */
    case 'text_section':
      return (
        <BlockWrap label="section texte" bg="bg-slate-900">
          <div className="max-w-xl mx-auto space-y-2 text-center">
            <Line w="w-1/3 mx-auto" h="h-2" className="bg-blue-700 rounded-full" />
            <Line w="w-3/5 mx-auto" h="h-5" className="bg-slate-400" />
            <Line w="w-full" h="h-2" />
            <Line w="w-4/5 mx-auto" h="h-2" />
            <Line w="w-full" h="h-2" />
            <Line w="w-3/4 mx-auto" h="h-2" />
          </div>
        </BlockWrap>
      )

    /* ── PRICING ── */
    case 'pricing':
      return (
        <BlockWrap label="tarifs" bg="bg-slate-900">
          <div className="text-center mb-3"><Line w="w-1/4 mx-auto" h="h-4" className="bg-slate-400" /></div>
          <div className="grid grid-cols-3 gap-3">
            {['Basique', 'Pro', 'Entreprise'].map((tier, i) => (
              <div key={tier} className={`rounded-xl p-4 space-y-2 ${i === 1 ? 'bg-blue-800/40 border border-blue-600/50' : 'bg-slate-800'}`}>
                <Line w="w-2/3" h="h-3" className={i === 1 ? 'bg-blue-300/50' : 'bg-slate-500'} />
                <div className="text-xl font-bold text-white/50 font-mono">{['99$','199$','499$'][i]}</div>
                <div className="space-y-1.5 mt-2">
                  {[0,1,2].map(j => (
                    <div key={j} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 text-green-500 text-xs">✓</div>
                      <Line w="w-3/4" h="h-2" />
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Btn label="Choisir" color={i === 1 ? 'bg-blue-600' : 'bg-slate-700'} />
                </div>
              </div>
            ))}
          </div>
        </BlockWrap>
      )

    /* ── FOOTER ── */
    case 'footer':
      return (
        <BlockWrap label="footer" bg="bg-slate-950">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="space-y-2 col-span-2">
              <div className="w-24 h-4 bg-slate-600 rounded" />
              <Line w="w-full" h="h-2" />
              <Line w="w-4/5" h="h-2" />
              <Line w="w-3/5" h="h-2" />
            </div>
            {[0,1].map(i => (
              <div key={i} className="space-y-2">
                <Line w="w-1/2" h="h-2.5" className="bg-slate-500" />
                <Line w="w-3/4" h="h-2" />
                <Line w="w-2/3" h="h-2" />
                <Line w="w-3/4" h="h-2" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between">
            <Line w="w-1/4" h="h-2" className="bg-slate-700" />
            <Line w="w-1/4" h="h-2" className="bg-slate-700" />
          </div>
        </BlockWrap>
      )

    default:
      return (
        <BlockWrap label={block.type} bg="bg-slate-800">
          <div className="flex items-center justify-center h-12 text-slate-600 text-sm">Bloc : {block.type}</div>
        </BlockWrap>
      )
  }
}
