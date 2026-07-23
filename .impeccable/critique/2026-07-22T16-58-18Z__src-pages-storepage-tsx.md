---
timestamp: 2026-07-22T16-58-18Z
slug: src-pages-storepage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading skeletons + active-filter chips work well; no per-product load error state |
| 2 | Match System / Real World | 3 | Language is natural; "Sob consulta" is regionally understood but untranslated for younger users |
| 3 | User Control and Freedom | 3 | Clear filter reset paths; mobile sheet has no labeled Close button — backdrop-only dismiss |
| 4 | Consistency and Standards | 3 | Type tabs and attribute chips share the same visual language; `text-base` on section h2 deviates from documented ramp |
| 5 | Error Prevention | 3 | Filter state preserved in URL; "Ver N produtos" preview before closing sheet is excellent |
| 6 | Recognition Rather Than Recall | 3 | Active filter chips always visible in sticky bar; attribute key labels expose raw data key names (risk) |
| 7 | Flexibility and Efficiency of Use | 2 | No search, no sort, no keyboard shortcuts; URL-shareable filter state is the only power-user feature |
| 8 | Aesthetic and Minimalist Design | 3 | Very clean; the always-green "online" dot is unexplained decoration that creates a false affordance |
| 9 | Error Recovery | 2 | Filtered empty state shows a message but no inline "Limpar filtros" CTA; user must scroll up to the sticky bar to reset |
| 10 | Help and Documentation | 1 | No tooltips, no onboarding, "Sob consulta" unexplained, green dot unexplained, no contextual help anywhere |
| **Total** | | **26/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

Not AI-generated. The design has a coherent identity: Playfair Display on the store name alone, artisan gold only on prices, linen surfaces with genuine warmth, compact WhatsApp icon button. No stripe borders, no gradient text, no glassmorphism, no decorative grids. "Em Destaque" eyebrow in HeroSection is the only one on the page — voice, not scaffolding.

Deterministic scan found 3 advisory font-size findings. StorePage.tsx:228 (text-[10px] in micro-badge) is a false positive. StorePage.tsx:263 and :323 (text-[11px] on filter attribute key labels) are real — should be text-xs (12px).

Manual checks found: contrast failures on #9c8e84 and #c4b8ae at small text sizes; missing focus-visible states on all interactive elements; <article onClick> on ProductCard and HeroCard making modal interaction keyboard-inaccessible.

## Overall Impression

The vitrine reads as exactly what it should be: a quiet, warm boutique. The cover-photo header is a meaningful upgrade. The filter architecture is well-thought-out and progressive. The biggest opportunity is accessibility: three compounding failures (<article onClick>, no focus rings, low-contrast muted text) mean keyboard/screen-reader users get a degraded experience.

## What's Working

1. Filter architecture: type tabs + Filtros button + active chip summary + URL-serialized state + "Ver N produtos" preview. Each layer adds information without adding clutter.
2. Two-tier card system: HeroCards (description + labeled CTA) vs. ProductCards (compact icon button) mirrors physical retail hierarchy.
3. Sticky filter bar top-16 md:top-0 handling accounts for mobile header height precisely — a real detail that most implementations miss.

## Priority Issues

**[P1] <article onClick> makes modal inaccessible to keyboard/screen-reader users**
- What: ProductCard (line 16) and HeroCard (HeroSection line 183) place the open-modal action on <article>. Not focusable, not keyboard-activatable, screen readers don't announce it as interactive.
- Why it matters: Modal is the primary step in the value loop. Keyboard users and SR users cannot open it.
- Fix: Replace <article> with <button> wrapper or add role="button" tabIndex={0} onKeyDown handler to both card roots.
- Command: $impeccable audit src/components/ProductCard.tsx src/components/HeroSection.tsx

**[P2] Zero focus-visible states across all interactive elements**
- What: typeTab(), chip(), Filtros button, filter × buttons, load-more button — none have focus-visible:ring classes. Tailwind preflight removes the browser outline.
- Why it matters: Keyboard navigation is completely invisible for all users who cannot use a pointer.
- Fix: Add focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c9922c]/50 focus-visible:outline-none to all interactive elements.
- Command: $impeccable audit src/pages/StorePage.tsx

**[P2] #9c8e84 and #c4b8ae fail WCAG AA at small text sizes**
- What: #9c8e84 on white = ~2.7:1 (needs 4.5:1). Used at text-xs on "Produtos" label and filter attribute key labels. #c4b8ae on white = ~1.8:1. Used on "Sob consulta" (text-xs, ProductCard line 49).
- Fix: Darken fawn labels to #786b60 (~4.8:1). Change "Sob consulta" to text-[#6b5d52].
- Command: $impeccable audit

**[P2] Mobile filter sheet has no labeled close action**
- What: Only dismiss paths are backdrop tap or "Ver N produtos" CTA. No labeled × or Fechar button.
- Fix: Add × button in sheet header right side, always visible regardless of activeCount.
- Command: $impeccable polish src/pages/StorePage.tsx

**[P3] Always-green "online" dot is misleading**
- What: StoreProfileHeader renders hardcoded bg-green-500 dot on the avatar — always visible, always green, no real-time data behind it.
- Fix: Remove entirely, or replace with a static gold verified badge that doesn't imply real-time presence.
- Command: $impeccable clarify src/components/StoreProfileHeader.tsx

**[P3] Filtered empty state has no inline clear action**
- What: When filters produce 0 results, message appears but no "Limpar filtros" button inline. User must scroll up to sticky bar.
- Fix: Add clearAllFilters() button directly below the empty-state message.

## Persona Red Flags

**Casey (Distracted Mobile User):** Product card WhatsApp button is 32×32px — below 44×44pt minimum. Scroll depth before products on stores with promo images (~400px) has no below-fold affordance.

**Jordan (Confused First-Timer):** "Sob consulta" unexplained. WhatsApp icon button unlabeled — intent is unclear. Modal (which explains the product) is discoverable only by tapping the card — no visual cue that cards are interactive.

**Paulo (project persona — independent seller's first-time customer, Brazil):** Blank linen cover gradient reads as incomplete store on new accounts. Always-green online dot implies real-time availability — when seller responds slowly, it actively undermines trust in the platform.

## Minor Observations

- HeroSection "Em Destaque" text-[10px] text-[#9c8e84]: contrast fails AA at this size. Fix in contrast pass.
- text-[11px] filter attribute key labels → text-xs (12px) is a one-character change.
- Mobile filter backdrop div has no role and no Escape key handler.
- text-base on "Todos os Produtos" h2 sits undocumented between body (14px) and headline (20px) ramp steps.
- Promo images use alt="" — if they contain price or promotional text, sellers need a way to provide alt text.

## Questions to Consider

- What does Paulo see on a store with no cover photo, no promo images, and 3 products? That is the median new-store state.
- Two green surfaces compete: floating FAB "Falar com o vendedor" (mobile) and per-card WhatsApp icon. Do both need to exist simultaneously?
- What if filter attribute key labels showed the seller's human-readable label rather than the raw attribute key name? Is there a display name field, or is this a data quality risk?
