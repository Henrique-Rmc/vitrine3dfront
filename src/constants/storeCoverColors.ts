export interface CoverColor {
  key: string
  label: string
}

export const COVER_COLORS: CoverColor[] = [
  // Neutros quentes
  { key: '#ede8df', label: 'Linho' },
  { key: '#e0d4c4', label: 'Areia' },
  { key: '#d8c8b4', label: 'Bege' },
  { key: '#d0bca8', label: 'Nude' },
  // Quentes cromáticos
  { key: '#d4b4b0', label: 'Terracota' },
  { key: '#d4b0b4', label: 'Blush' },
  { key: '#c8a8c0', label: 'Malva' },
  { key: '#c4a8c8', label: 'Lavanda' },
  // Frios cromáticos
  { key: '#a8b8d0', label: 'Ardósia' },
  { key: '#a4c0d0', label: 'Céu' },
  { key: '#a0c0bc', label: 'Água' },
  { key: '#a4bcb0', label: 'Sálvia' },
  // Verdes / amarelos
  { key: '#b0bca4', label: 'Oliva' },
  { key: '#c4c8a4', label: 'Palha' },
  // Neutros frios
  { key: '#c0c4c8', label: 'Prata' },
  { key: '#a8b0bc', label: 'Pedra' },
]
