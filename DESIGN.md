---
name: Vitrine3D
description: A boutique gallery vitrine for independent sellers of visually distinctive goods
colors:
  canvas: "#faf8f5"
  card: "#ffffff"
  raised: "#f4f1eb"
  lifted: "#ede8df"
  inset: "#f7f4ef"
  ink: "#1c1813"
  ink-hover: "#2c2620"
  text-secondary: "#6b5d52"
  text-tertiary: "#9c8e84"
  text-muted: "#c4b8ae"
  text-ghost: "#d4cec5"
  border-standard: "#e8e2d8"
  border-strong: "#d4cec5"
  border-subtle: "#f0ece5"
  gold: "#c9922c"
  gold-hover: "#a87820"
  success-text: "#15803d"
  success-bg: "#f0fdf4"
  success-border: "#bbf7d0"
  error-text: "#b91c1c"
  error-bg: "#fef2f2"
  error-border: "#fecaca"
  whatsapp: "#16a34a"
  whatsapp-hover: "#22c55e"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, ui-serif, serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  display-bold:
    fontFamily: "'Playfair Display', Georgia, ui-serif, serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Inter', 'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Inter', 'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', 'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  metadata:
    fontFamily: "'Inter', 'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  input-field:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card-surface:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  filter-chip-inactive:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
---

# Design System: Vitrine3D

## 1. Overview

**Creative North Star: "The Boutique Vitrine"**

Vitrine3D exists so that anyone who makes or curates something worth a second look — a 3D-printed prop, a hand-forged ring, a canvas, a car, a listing — can hang it on their own wall without renting space in a crowded marketplace. The interface is that wall: warm linen behind the glass, a single gallery light (the artisan gold accent) picking out the price and the call to action, and nothing else competing for attention. Every screen, admin or public, behaves like a quiet gallery attendant: present, helpful, never in front of the work.

This system explicitly rejects the cold SaaS dashboard (sterile gray chrome, dense enterprise tables as the default surface) and the generic marketplace grid (anonymous tiles that make every seller look interchangeable). Warmth here is structural — carried by the linen canvas, the serif display type, and the restraint of a single accent color — not applied as gradients or decoration.

**Key Characteristics:**
- Warm linen canvas, never stark white or cold gray
- One accent color (artisan gold) used sparingly and deliberately — prices, active states, featured marks
- Serif display type reserved for store names and headlines; sans-serif for everything functional
- Flat, quiet surfaces lifted only by soft borders and `shadow-sm`, never dramatic shadows or gradients
- Identical restraint across admin and public storefront — one visual language, two audiences

## 2. Colors

The palette reads as a gallery, not a product: warm off-white walls, a single refined gold light, and ink-dark text — never pure black, never cold gray.

### Primary
- **Artisan Gold** (`#c9922c`): the one accent. Prices (`font-semibold`), active navigation state (`bg-gold/10 text-gold`), featured-item stars, active filter/restore actions. Hover deepens to **Aged Gold** (`#a87820`).

### Neutral
- **Warm Linen** (`#faf8f5`): page canvas — the gallery wall behind every surface.
- **Gallery White** (`#ffffff`): cards, panels, modals — where the product sits.
- **Raised Linen** (`#f4f1eb`): input backgrounds, hover states, admin sidebar active row.
- **Lifted Linen** (`#ede8df`): skeleton shimmer base, deeper hover states.
- **Inset Linen** (`#f7f4ef`): subtly recessed text fields.
- **Ink** (`#1c1813`): primary text, headlines, and — doubling as a role, not a coincidence — the primary button background. Never pure black; it's warm enough to belong on linen.
- **Umber** (`#6b5d52`): secondary text, descriptions, body copy.
- **Fawn** (`#9c8e84`): tertiary text — labels, metadata, inactive nav.
- **Parchment Gray** (`#c4b8ae`): placeholder and disabled text.
- **Border Linen** (`#e8e2d8`): standard borders. Strong variant **Border Umber** (`#d4cec5`) for inputs. Subtle variant (`#f0ece5`) for hairline dividers only.

### Semantic
- **Success:** text `#15803d` on `#f0fdf4` with `#bbf7d0` border.
- **Error:** text `#b91c1c` on `#fef2f2` with `#fecaca` border.
- **WhatsApp:** `#16a34a` (hover `#22c55e`), reserved exclusively for the "Solicitar Orçamento" CTA — never repurposed as a generic success or confirm color.

### Named Rules
**The One Light Rule.** Artisan gold appears in exactly one role per screen at a time — a price, an active state, or a featured mark — never as decoration or a background wash. If two gold elements compete on one screen, one of them is wrong.

**The Warm-Never-Cold Rule.** Every neutral in this system carries a warm linen undertone. A pure gray (`#71717a`-style) or pure white anywhere in a surface is a bug, not a variant.

## 3. Typography

**Display Font:** 'Playfair Display' (fallback Georgia, ui-serif, serif)
**Body Font:** 'Inter' (fallback 'Roboto', ui-sans-serif, system-ui, sans-serif)

**Character:** A quiet serif/sans pairing — Playfair Display carries the one or two moments per page that deserve gravity (a store name, a landing headline), while Inter runs everything functional. The pairing never mixes: display type never appears in UI chrome, and Inter never appears in a hero.

### Hierarchy
- **Display** (400, `clamp(1.75rem, 4vw, 3rem)`, 1.1): store name in the vitrine hero, elegant and light-weight.
- **Display Bold** (700, `clamp(2rem, 5vw, 3.5rem)`, 1.1): landing-page headline, the one place real display weight is earned.
- **Headline** (700, 1.25rem, 1.3): page titles in the admin panel (`text-xl font-bold`).
- **Body** (400, 0.875rem, 1.5): descriptions and body copy, capped at 65–75ch.
- **Label** (500, 0.875rem, 1.4): form labels, filter chips.
- **Metadata** (400, 0.75rem, 1.4): timestamps, secondary counts, monospace dimensions.

### Named Rules
**The Two-Moment Rule.** Playfair Display is earned, not decorative — it appears only on the store name and the landing headline. Everywhere else, including every admin surface, is Inter.

## 4. Elevation

Flat by default, lifted only by a soft border and `shadow-sm` — like a printed photograph resting on a velvet passe-partout, not a floating SaaS panel. No dramatic shadows, no glassmorphism, no gradient overlays anywhere in the system.

### Shadow Vocabulary
- **Card rest** (`shadow-sm` + `border border-[#e8e2d8]`): the only elevation most surfaces ever need.
- **Modal / toast lift** (`shadow-lg`): reserved for content that floats above the page (product modal, success toast) — still paired with a border, never shadow alone.

### Named Rules
**The Passe-Partout Rule.** Depth comes from a border plus a soft, tight shadow — never a wide, dramatic blur, and never a shadow without a border underneath it.

## 5. Components

Every component reads as quiet and precise: minimal chrome, soft borders, deliberate use of the one accent color. Nothing ships with a decorative gradient, a heavy shadow, or a stripe border.

### Buttons
- **Shape:** `rounded-lg` (8px).
- **Primary:** Ink background (`#1c1813`), white text, `font-semibold`, `px-5 py-2.5`. Hover deepens to `#2c2620`. This is the elegant choice over gold — gold is reserved for accents, not action surfaces.
- **Ghost / Secondary:** transparent background, `border border-[#e8e2d8]`, umber text (`#6b5d52`) → ink on hover, border deepens to `#d4cec5` on hover.
- **Destructive:** red-500 text on transparent, `border-red-200`, `hover:bg-red-50`.
- **Restore / re-enable:** gold text (`#c9922c`) → `#a87820` on hover, `border-amber-200`, `hover:bg-amber-50` — the one place gold appears on a button, signaling "bring back," never a primary action.

### Chips / Badges
- **Filter chip active:** ink background, white text, `shadow-sm`, `rounded-full`.
- **Filter chip inactive:** white background, `border-[#e8e2d8]`, umber text → ink on hover.
- **Material badge:** one tint pair per material (PLA amber, ABS slate, Resina violet, PETG teal, Flexível green, default stone) — `bg-{color}-50 text-{color}-700 border-{color}-200`, `rounded-full`, `text-[10px] font-semibold uppercase tracking-wide`.
- **Status badge:** a colored dot + label — green dot for Visible, gray dot for Hidden. No background fill on the badge itself.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px); modals step up to `rounded-2xl` (16px).
- **Background:** white on linen canvas — the only place pure white appears.
- **Shadow Strategy:** `shadow-sm` + `border-[#e8e2d8]`, per the Passe-Partout Rule above.
- **Internal Padding:** `p-4` to `p-5` (16–20px).

### Inputs / Fields
- **Style:** `bg-[#f4f1eb]` (raised linen), `border-[#e8e2d8]`, `rounded-lg`, `px-3 py-2.5`, ink text, muted placeholder (`#c4b8ae` — never a lighter gray; it must still hit 4.5:1 against the raised-linen background).
- **Focus:** `ring-2 ring-[#c9922c]/40` with `border-[#c9922c]/60` — the one place a soft gold glow is allowed, since it signals active input, not decoration.
- **Disabled:** `opacity-50`, no other treatment change.

### Navigation
- **Admin sidebar:** white, `w-60`, `border-r border-[#e8e2d8]`. Active item: `bg-gold/10 text-gold font-semibold`. Inactive: fawn text (`#9c8e84`) → ink on hover, `hover:bg-[#f4f1eb]`.
- **Mobile bottom nav:** `h-16`, same active/inactive language as the sidebar, admin-only.
- **Public vitrine sidebar:** same shell, branch-aware — a visitor branch (logo, CTA copy, "Criar minha vitrine" ink button, "Entrar" ghost button, category list) and an admin-viewing branch ("Admin" badge, "Visualizando" indicator).

### Toasts / Banners
- **Error banner:** `bg-red-50 border-red-200 text-red-700`, `rounded-lg`, `px-4 py-3`.
- **Success toast:** white surface, `border-[#e8e2d8]`, `shadow-lg`, `rounded-xl`, `px-5 py-3.5` — deliberately restrained, no green fill; the checkmark or copy carries the meaning, not a colored background.

## 6. Do's and Don'ts

### Do:
- **Do** keep the artisan gold accent to one role per screen — price, active state, or featured mark (The One Light Rule).
- **Do** use the ink button (`#1c1813`) as the primary action color; gold is an accent, not an action surface.
- **Do** pair every shadow with a border underneath it (The Passe-Partout Rule) — `shadow-sm` + `border-[#e8e2d8]` for cards, `shadow-lg` + border for modals and toasts.
- **Do** reserve Playfair Display for the store name and landing headline only (The Two-Moment Rule); everything else is Inter.
- **Do** keep every neutral warm-linen-tinted — canvas, card, borders, all of it (The Warm-Never-Cold Rule).
- **Do** make placeholder text hit 4.5:1 against its raised-linen background, not a lighter "elegant" gray.

### Don't:
- **Don't** build a cold SaaS dashboard feel — no sterile gray chrome, no dense tables as the default surface, no enterprise-tool spacing.
- **Don't** build a generic marketplace grid — no anonymous, interchangeable product tiles; every seller's vitrine should feel personal.
- **Don't** use gradients, glassmorphism, or `border-left`/`border-right` colored stripes anywhere in the system.
- **Don't** pair a 1px border with a wide, soft `box-shadow` (blur ≥16px) — pick the border-plus-tight-shadow language above, never a floating ghost card.
- **Don't** round cards or sections past `rounded-2xl` (16px) — this system is elegant, not "insanely rounded."
- **Don't** repurpose the WhatsApp green for generic success states, or the success-green for the WhatsApp CTA — they're different signals.
