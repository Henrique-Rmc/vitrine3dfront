export interface StoreFont {
  key: string
  label: string
  googleParam: string
  weights: string
  category: string
}

export const STORE_FONTS: StoreFont[] = [
  { key: 'Inter',              label: 'Inter',              googleParam: 'Inter',              weights: '700;800', category: 'Moderno' },
  { key: 'Poppins',            label: 'Poppins',            googleParam: 'Poppins',            weights: '600;700', category: 'Moderno' },
  { key: 'Montserrat',         label: 'Montserrat',         googleParam: 'Montserrat',         weights: '700;800', category: 'Geométrico' },
  { key: 'Work Sans',          label: 'Work Sans',          googleParam: 'Work+Sans',          weights: '700;800', category: 'Limpo' },
  { key: 'Space Grotesk',      label: 'Space Grotesk',      googleParam: 'Space+Grotesk',      weights: '500;700', category: 'Técnico' },
  { key: 'Raleway',            label: 'Raleway',            googleParam: 'Raleway',            weights: '700;800', category: 'Elegante' },
  { key: 'Josefin Sans',       label: 'Josefin Sans',       googleParam: 'Josefin+Sans',       weights: '600;700', category: 'Geométrico' },
  { key: 'Quicksand',          label: 'Quicksand',          googleParam: 'Quicksand',          weights: '600;700', category: 'Arredondado' },
  { key: 'Nunito',             label: 'Nunito',             googleParam: 'Nunito',             weights: '700;800', category: 'Amigável' },
  { key: 'Playfair Display',   label: 'Playfair Display',   googleParam: 'Playfair+Display',   weights: '700;800', category: 'Elegante' },
  { key: 'Cormorant Garamond', label: 'Cormorant Garamond', googleParam: 'Cormorant+Garamond', weights: '600;700', category: 'Luxo' },
  { key: 'Lora',               label: 'Lora',               googleParam: 'Lora',               weights: '600;700', category: 'Literário' },
  { key: 'Merriweather',       label: 'Merriweather',       googleParam: 'Merriweather',       weights: '700',     category: 'Tradicional' },
  { key: 'DM Serif Display',   label: 'DM Serif Display',   googleParam: 'DM+Serif+Display',   weights: '400',     category: 'Editorial' },
  { key: 'Cinzel',             label: 'Cinzel',             googleParam: 'Cinzel',             weights: '700;900', category: 'Clássico' },
  { key: 'Oswald',             label: 'Oswald',             googleParam: 'Oswald',             weights: '600;700', category: 'Impacto' },
  { key: 'Bebas Neue',         label: 'Bebas Neue',         googleParam: 'Bebas+Neue',         weights: '400',     category: 'Impacto' },
  { key: 'Abril Fatface',      label: 'Abril Fatface',      googleParam: 'Abril+Fatface',      weights: '400',     category: 'Display' },
  { key: 'Dancing Script',     label: 'Dancing Script',     googleParam: 'Dancing+Script',     weights: '600;700', category: 'Script' },
  { key: 'Pacifico',           label: 'Pacifico',           googleParam: 'Pacifico',           weights: '400',     category: 'Retrô' },
]

export const DEFAULT_STORE_FONT = 'Inter'

export function loadGoogleFont(font: StoreFont) {
  const id = `gf-${font.key.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleParam}:wght@${font.weights}&display=swap`
  document.head.appendChild(link)
}

export function fontStyle(key: string | null | undefined): React.CSSProperties {
  return { fontFamily: `'${key ?? DEFAULT_STORE_FONT}', sans-serif` }
}
