export type BlockType =
  | 'navbar'
  | 'hero_split' | 'hero_center' | 'hero_video'
  | 'services_2' | 'services_3' | 'services_4'
  | 'image_text_left' | 'image_text_right'
  | 'testimonials'
  | 'gallery_grid' | 'gallery_masonry'
  | 'cta_band'
  | 'contact_form'
  | 'stats'
  | 'team'
  | 'faq'
  | 'text_section'
  | 'pricing'
  | 'footer'

export interface Block {
  id: string
  type: BlockType
  note: string
}

export interface WireframePage {
  id: string
  name: string
  blocks: Block[]
}

export const BLOCK_PALETTE: Record<string, { type: string; label: string; icon: string }[]> = {
  'Navigation': [
    { type: 'navbar',          label: 'Barre de navigation',   icon: '⬛' },
  ],
  'Hero': [
    { type: 'hero_split',      label: 'Hero — Texte + Image',  icon: '◧' },
    { type: 'hero_center',     label: 'Hero — Centré',         icon: '▣' },
    { type: 'hero_video',      label: 'Hero — Fond vidéo',     icon: '▶' },
  ],
  'Contenu': [
    { type: 'services_2',      label: 'Services 2 colonnes',   icon: '⊞' },
    { type: 'services_3',      label: 'Services 3 colonnes',   icon: '⊟' },
    { type: 'services_4',      label: 'Services 4 colonnes',   icon: '⊠' },
    { type: 'image_text_left', label: 'Image gauche + Texte',  icon: '◫' },
    { type: 'image_text_right',label: 'Texte + Image droite',  icon: '◪' },
    { type: 'text_section',    label: 'Section texte',         icon: '≡' },
    { type: 'stats',           label: 'Statistiques / Chiffres', icon: '📊' },
  ],
  'Social & Confiance': [
    { type: 'testimonials',    label: 'Témoignages clients',   icon: '💬' },
    { type: 'team',            label: 'Notre équipe',          icon: '👥' },
    { type: 'faq',             label: 'FAQ',                   icon: '❓' },
    { type: 'pricing',         label: 'Tarifs / Prix',         icon: '💰' },
  ],
  'Médias': [
    { type: 'gallery_grid',    label: 'Galerie — Grille',      icon: '🖼' },
    { type: 'gallery_masonry', label: 'Galerie — Masonry',     icon: '🗂' },
  ],
  'Conversion': [
    { type: 'cta_band',        label: 'Bande CTA',             icon: '🎯' },
    { type: 'contact_form',    label: 'Formulaire de contact', icon: '📋' },
  ],
  'Footer': [
    { type: 'footer',          label: 'Pied de page',          icon: '▬' },
  ],
}
