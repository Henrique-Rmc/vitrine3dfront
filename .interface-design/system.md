# Vitrine Artesã — Interface Design System

## Direction

**Ateliê Galeria** — Um espaço expositivo para qualquer tipo de artesão: impressores 3D, joalheiros, pintores, ceramistas, bordadeiras. Quem visita sente que entrou em uma galeria boutique com paredes de linho — o trabalho do criador é o protagonista, a interface é o suporte.

**Feeling:** Elegante, arejado, artesanal. Não um SaaS. Não um marketplace frio. Uma vitrine pessoal de alguém orgulhoso do que faz.

## Palette

### Surfaces

| Token     | Hex       | Role                                       |
|-----------|-----------|--------------------------------------------|
| canvas    | `#faf8f5` | Page background — linho quente             |
| card      | `#ffffff` | Cards, painéis, modal bg                   |
| raised    | `#f4f1eb` | Inputs, hover states, admin sidebar active |
| lifted    | `#ede8df` | Skeleton base, deeper hover                |
| inset     | `#f7f4ef` | Campo de texto inset, muito sutil          |

### Text Hierarchy

| Level     | Hex       | Role                             |
|-----------|-----------|----------------------------------|
| primary   | `#1c1813` | Títulos, texto principal         |
| secondary | `#6b5d52` | Descrições, body text            |
| tertiary  | `#9c8e84` | Labels, metadata, inactive nav   |
| muted     | `#c4b8ae` | Placeholder, disabled            |

### Borders

| Usage              | Class                    |
|--------------------|--------------------------|
| Standard           | `border-[#e8e2d8]`       |
| Strong (inputs)    | `border-[#d4cec5]`       |
| Subtle (dividers)  | `border-[#f0ece5]`       |

### Accent — Ouro Artesanal

- **`#c9922c`** — ouro âmbar refinado, funciona para joias, quadros, cerâmica, impressão 3D
- Active nav: `bg-[#c9922c]/10 text-[#c9922c]`
- Prices: `text-[#c9922c] font-semibold`
- Category pill active: `bg-[#1c1813] text-white`
- Featured star: `text-[#c9922c]`

### Semantic

- **Success:** `text-green-700` / `bg-green-50 border-green-200`
- **Error:**   `text-red-700`   / `bg-red-50   border-red-200`
- **WhatsApp:** `bg-green-600 hover:bg-green-500 text-white`

## Material Badge Colors (admin + vitrine)

```
PLA:      bg-amber-50  text-amber-700  border-amber-200
ABS:      bg-slate-100 text-slate-600  border-slate-200
Resina:   bg-violet-50 text-violet-700 border-violet-200
PETG:     bg-teal-50   text-teal-700   border-teal-200
Flexível: bg-green-50  text-green-700  border-green-200
default:  bg-stone-100 text-stone-500  border-stone-200
```

## Depth Strategy

**Borders + shadow-sm** em cards brancos sobre fundo linho. Sem sombras dramáticas. Sem gradientes decorativos. A elevação é suave — como uma foto impressa sobre um passpartout veludo.

## Typography

- **Display (Playfair Display):** nome da loja no hero, headline da landing page
  - `font-display` (definido via `@theme --font-display`)
  - Pesos: 400 (nome elegante), 700 (headline impactante)
- **UI (Inter):** tudo o mais
  - Headlines de página: `text-xl font-bold text-[#1c1813]`
  - Body: `text-sm text-[#6b5d52]`
  - Labels: `text-sm font-medium text-[#9c8e84]`
  - Metadata: `text-xs text-[#c4b8ae]`
  - Monospace (dimensões): `font-mono text-xs text-[#9c8e84]`

## Spacing

Base unit: `0.25rem` (4px). Card padding: `p-4` a `p-5`. Section gaps: `gap-3` a `gap-5`.

## Border Radius

- Cards: `rounded-xl`
- Modal: `rounded-2xl`
- Buttons: `rounded-lg`
- Chips/badges: `rounded-full`
- Inputs: `rounded-lg`

## Key Patterns

### Primary Button (dark ink)
```tsx
<button className="bg-[#1c1813] hover:bg-[#2c2620] disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors">
```

### Ghost Button
```tsx
<button className="border border-[#e8e2d8] hover:border-[#d4cec5] text-[#6b5d52] hover:text-[#1c1813] rounded-lg px-5 py-2.5 transition-colors">
```

### Form Input
```tsx
<input className="w-full rounded-lg bg-[#f4f1eb] border border-[#e8e2d8] px-3 py-2.5 text-sm text-[#1c1813] placeholder-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#c9922c]/40 focus:border-[#c9922c]/60 disabled:opacity-50 transition-colors" />
```

### Card Surface
```tsx
<div className="bg-white border border-[#e8e2d8] rounded-xl shadow-sm">
```

### Error Banner
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
```

### Success Toast
```tsx
<div className="bg-white border border-[#e8e2d8] rounded-xl px-5 py-3.5 shadow-lg">
```

### Nav Active State (admin sidebar)
```
active:   bg-[#c9922c]/10 text-[#c9922c] font-semibold
inactive: text-[#9c8e84] hover:text-[#1c1813] hover:bg-[#f4f1eb]
```

## Layout

- **Admin:** `AdminLayout` — sidebar `w-60 bg-white border-r border-[#e8e2d8]` + `md:ml-60` content
- **Vitrine pública:** `MainLayout` — **sem sidebar**. Full-width. Header sticky top.

## Notes

- `html` base bg: `#faf8f5` (definido em index.css)
- Sem dark mode — single light theme
- Playfair Display carregado via Google Fonts no index.html
- Vitrine pública sem sidebar: `md:ml-0`, header `h-16` sticky
- Accent `#c9922c` substitui amber-500 do sistema anterior
- Primary button usa tinta escura `#1c1813` (não amber) — mais elegante no tema claro
