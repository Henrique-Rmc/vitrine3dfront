---
target: src/pages/StorePage.tsx
total_score: 29
p0_count: 2
p1_count: 3
timestamp: 2026-07-21T18-19-48Z
slug: src-pages-storepage-tsx
---
Method: dual-agent (A: ae268d625cf0f6d50 · B: a4530d0e6379331ad)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Product-type fetch failures swallowed silently (`.catch(() => {})`, StorePage.tsx:59) with zero user-visible status |
| 2 | Match System / Real World | 4 | pt-BR formatting, WhatsApp-native copy ("Solicitar Orçamento") fits the market exactly |
| 3 | User Control and Freedom | 3 | Modal has Escape/backdrop/X close, but no keyboard path to *open* a card in the first place |
| 4 | Consistency and Standards | 3 | StorePage.tsx hand-duplicates AttributeFilterBar.tsx's chip logic verbatim — a live drift risk |
| 5 | Error Prevention | 4 | WhatsApp exit-confirmation dialog (ProductModal.tsx:220-261) is a genuinely strong pattern |
| 6 | Recognition Rather Than Recall | 3 | Attribute-key labels hard-truncated at `w-20` with no title/tooltip (StorePage.tsx:182) |
| 7 | Flexibility and Efficiency | 2 | No "clear all filters" action; clearing N filters needs N individual clicks |
| 8 | Aesthetic and Minimalist Design | 4 | Flat cards, shadow-sm + border only, one gold accent — fully honors DESIGN.md's rules |
| 9 | Error Recovery | 1 | Error state is one generic sentence, zero retry affordance (StorePage.tsx:142-149) |
| 10 | Help and Documentation | 2 | None present (acceptable for register), but "Reportar" link has zero context |
| **Total** | | **29/40** | **Good — solid foundation, address weak areas** |

#### Anti-Patterns Verdict

**LLM assessment**: Not slop in the generic-AI-dashboard sense — the palette and one-gold-accent discipline are genuinely followed (gold reserved for price only, exactly per DESIGN.md's One Light Rule). But a user fluent in Linear/Stripe-caliber product UI would pause at the total absence of focus states and at clickable cards with zero keyboard affordance — the "subtly off" tell the product register's slop test warns about, even though the visual surface looks polished.

**Deterministic scan**: `detect.mjs` ran clean (exit 2 = findings, as expected) against the full rendered subtree (StorePage.tsx + StoreProfileHeader, HeroSection, ProductCard, ProductModal, ProductSkeleton, AttributeFilterBar). It returned 6 findings, all rule `design-system-font-size` (advisory): three instances of 10px text and three of 11px (StorePage.tsx:182, HeroSection.tsx:90, ProductCard.tsx:54, ProductModal.tsx:146, ProductModal.tsx:194, AttributeFilterBar.tsx:55). DESIGN.md's documented type ramp bottoms out at 0.75rem/12px ("Metadata"); none of the flagged lines match the one documented exception (the 10px Material badge pattern), so these stand as real, if minor, drift from the written spec — polish-tier, not blocking. No false positives identified.

**Visual overlays**: Unavailable this session — no dev server was running and no browser-automation tool is exposed, so there is no live-page overlay to point to. This is a fallback signal, not a finding.

#### Overall Impression

StorePage is a well-restrained, on-brand product surface — it visibly honors its own DESIGN.md (one accent color, flat cards, warm neutrals) and gets real UX credit for a genuinely thoughtful WhatsApp hand-off flow. But it fails a keyboard-only visitor outright (cards aren't operable without a mouse, and no element on the page shows a focus ring), and it has a maintenance landmine: the attribute-filter chip UI exists as dead, duplicated code in two files that have already started to diverge. The single biggest opportunity is closing the keyboard/focus gap — it's the one issue both independent assessments converged on hardest, and DESIGN.md already has the token (`ring-2 ring-[#c9922c]/40`) to fix it with, it's just never applied outside form inputs.

#### What's Working

- **WhatsApp exit-confirmation dialog** (ProductModal.tsx:220-261): turns "wait, am I leaving the site?" into a calm, explained hand-off — a genuinely rare, considered UX moment for this category, and the strongest peak-end note on the page.
- **One Light Rule discipline**: gold (`#c9922c`) appears only on price, consistently, across ProductCard/HeroSection/ProductModal — never decorative, exactly as DESIGN.md prescribes.
- **URL-persisted filter state** (StorePage.tsx:112-121): filters survive back/forward/sharing a link — an efficiency win most storefronts at this scale skip entirely.

#### Priority Issues

**[P0] Product cards are not keyboard-operable**
- **Why it matters**: ProductCard.tsx:16-19 and HeroSection.tsx:182-185 put `onClick` on a bare `<article>` with no `tabIndex`, `role="button"`, or `onKeyDown`. A keyboard-only visitor can tab to the WhatsApp link inside a card but can never open the product modal — the primary "look closer" action is unreachable without a mouse.
- **Fix**: Add `tabIndex={0} role="button"` plus an Enter/Space `onKeyDown` handler to both card wrappers, or restructure so the whole card is a real `<button>`.
- **Suggested command**: $impeccable harden

**[P0] Zero focus-visible styling anywhere in the subtree**
- **Why it matters**: No `focus:`/`focus-visible:` class exists anywhere in StorePage, ProductCard, HeroSection, ProductModal, or AttributeFilterBar. PRODUCT.md explicitly commits to "visible focus states," and DESIGN.md already defines the exact token for it (`ring-2 ring-[#c9922c]/40`, currently only applied to form inputs) — it's a token that exists and simply isn't reused.
- **Fix**: Apply the existing gold-ring focus token to every interactive element: cards (once keyboard-operable), chips, tabs, modal controls, carousel dots.
- **Suggested command**: $impeccable audit

**[P1] Duplicated, drifting attribute-filter implementation**
- **Why it matters**: StorePage.tsx (lines 16-30, 112-121, 161-201) hand-reimplements AttributeFilterBar.tsx's chip markup and `readActiveAttributes`/`getActive`/`setFilter` logic almost verbatim — confirmed as literal duplication by both assessments independently. AttributeFilterBar's own exported component is never rendered anywhere in the repo; only its helper survives. Two live copies of the same UI is the exact "same button looks different in two places" pattern product.md bans, and it's a live drift risk (StorePage already shows a `typeTab()` variant AttributeFilterBar doesn't have).
- **Fix**: Pick one source of truth — either delete AttributeFilterBar's unused component and keep the inline version canonical, or delete StorePage's duplicate and render the real component.
- **Suggested command**: $impeccable distill

**[P1] Error state is a dead end**
- **Why it matters**: StorePage.tsx:142-149 replaces the entire page with one gray sentence and no retry button, no link home, and no distinction between "store not found" and "network error." If a visitor hits this, it's also the last thing they see — the lowest point of the emotional journey with no way back up.
- **Fix**: Add a retry action, and split the generic message per failure type surfaced from `useStoreInfo`.
- **Suggested command**: $impeccable harden

**[P1] ProductModal has no focus trap or initial focus**
- **Why it matters**: The modal correctly handles Escape-to-close and body-scroll lock (ProductModal.tsx:38-48), but source shows no focus-trap logic, `autoFocus`, or ref-based initial focus call — Tab can move focus out of the dialog entirely while it's open, which breaks the standard modal contract for keyboard and screen-reader users at the page's primary conversion moment.
- **Fix**: Trap focus within the modal while open (first focusable element on open, cycle on Tab/Shift+Tab, return focus to the trigger card on close).
- **Suggested command**: $impeccable harden

#### Persona Red Flags

**Jordan (First-Timer, arrives via a shared link)**: `StoreProfileHeader` renders `productCount={visibleProducts.length}` even while `loading` is true (StorePage.tsx:158), so on a slow connection Jordan briefly sees "0 Produtos" next to "Carregando…" — a flash of "did I get the wrong link?" doubt right at the door, before skeletons and the real count resolve.

**Riley (Accessibility/Keyboard User)**: Tabbing through the catalog reaches the WhatsApp link inside each card but never the card itself, so Riley can never open a product's full detail/description via keyboard (ProductCard.tsx:16-19) — and even the controls Riley can reach show no focus ring anywhere, so there's no visual confirmation of position at all.

**Casey (Distracted Mobile User)**: Applies two attribute filters, gets zero results (StorePage.tsx:241-249), and has to hunt back up through two separate chip rows to individually tap "Todos" on each rather than a single reset tap — exactly the kind of extra friction a one-handed, interrupted mobile session doesn't tolerate well.

#### Minor Observations

- No "clear all filters" affordance; type-tab and attribute-chip rows are unbounded horizontal-scroll lists with no cap or overflow treatment (StorePage.tsx:166-197) — a seller with many product types or a wide attribute set turns this into the "generic marketplace grid" DESIGN.md explicitly bans.
- Toggle-style controls (type tabs, attribute chips) carry no `aria-pressed`/`aria-selected`/`role="tab"` despite being visually stateful (StorePage.tsx:168/172/185/192; AttributeFilterBar.tsx:58/68).
- No `onError` fallback on any `<img>` in the subtree (ProductCard.tsx:24, HeroSection.tsx:190, ProductModal.tsx:106/175, StoreProfileHeader.tsx:29) — a broken image URL renders the browser's default broken-image icon.
- Carousel dot buttons have `aria-label` but no `aria-current`/`aria-selected` marking the active slide (HeroSection.tsx:154).
- Six instances of 10-11px type (StorePage.tsx:182, HeroSection.tsx:90, ProductCard.tsx:54, ProductModal.tsx:146/194, AttributeFilterBar.tsx:55) sit below DESIGN.md's documented type-ramp floor (12px "Metadata") — polish-tier, per the deterministic scan.
- `w-20 truncate` on attribute-key labels has no `title` attribute; long keys are silently cut with no way to recover the full text (StorePage.tsx:182).
- `listProductTypes` failures are caught and discarded with no logging (StorePage.tsx:59) — harder to diagnose in the field.
- `sticky top-14` (StorePage.tsx:163) hardcodes an assumed header height, unverified against MainLayout from source alone.

#### Questions to Consider

- If a seller lists 10 product types, does the chip row still read as a "boutique gallery," or has it quietly become the generic marketplace grid DESIGN.md explicitly bans?
- The WhatsApp exit-confirmation dialog is the best-designed moment on the page — what would it look like to bring that same "explain, reassure, confirm" care to the error state instead of one gray sentence?
- Given AttributeFilterBar's real component is dead code duplicated inline in StorePage, is this page mid-refactor — and should that be resolved before more filter logic is added on top of either copy?
