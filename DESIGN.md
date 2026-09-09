# baby vc — design system & brand rules

The single source of truth for how anything in this project looks and behaves.
**Read this before writing any UI.** If a change contradicts this file, either the
change is wrong or this file needs updating in the same commit.

Source: [babyvc.co/brandkit](https://www.babyvc.co/brandkit) and the babyvc.co
landing page. Values below were extracted from the live brand kit bundle, not guessed.

---

## 1. Brand identity

**Who they are.** baby vc is a pan-European community bridging the gap for the next
generation of founders and investors. Their line: *"Come for the bootcamp, stay for
the community."* They democratise access to skills, networks and insights, explicitly
for people without an insider route into venture.

**What that means for the UI.** Nothing gatekeeping, nothing that assumes prior
fluency in venture jargon. Explain the thing rather than showing off that you know it.
Warm and direct, never corporate.

---

## 2. Colour

| Role | Token | Hex | Notes |
|---|---|---|---|
| Primary accent | `yellow` | `#EEFB86` | The brand. Soft chartreuse, not neon green. |
| Primary dark | — | `#000000` | Pure black, logo only |
| Page background | `ink` | `#0E110E` | Near-black with a green cast |
| Card / surface | `ink-2` | `#141813` | |
| Raised / hover | `ink-3` | `#1B201A` | |
| Body text | `cream` | `#F4F3EC` | |
| Secondary text | `muted` | `#A3A29A` | |
| Tertiary / labels | `dim` | `#6B6A63` | |
| New / urgent | `alert` | `#FF6B6B` | From the kit. Use sparingly. |
| Hairline | `line` | `rgba(238,251,134,0.14)` | Yellow-tinted borders |
| Hairline soft | `line-soft` | `rgba(244,243,236,0.09)` | Default card border |

Official secondary palette also includes `#FFFFFF` white and `#F4F3E9` grey for
inverted / light contexts. This app runs dark throughout.

**Rules**
- Yellow is an accent, never a background for large areas. One yellow element per
  visual group, max. If two things are yellow they compete and neither reads as primary.
- `alert` red means *new* or *closing soon*. Never decorative.
- No gradients anywhere. No glows. No drop shadows on brand marks.
- Tokens live in `src/app/globals.css` under `@theme`. Never hardcode a hex in a component.

---

## 3. Typography

**Lexend Deca.** Loaded via `next/font/google` in `src/app/layout.tsx`, exposed as
`--font-lexend`. Weights 300–900 available.

Two rules taken verbatim from the brand kit:

1. **"Always use big headings — body is always almost half the size of the heading."**
   A 48px page title sits above ~16px body. Do not split the difference.
2. **"Titles are always bold, never italic."** No italic titles, ever. Body italic is
   fine but effectively unused here.

Practical scale:

| Use | Size | Weight |
|---|---|---|
| Page title | `text-4xl` / `sm:text-5xl` | `font-bold` |
| Section heading | `text-xl` / `text-2xl` | `font-bold` |
| Card title | `text-base` | `font-semibold` |
| Body | `text-sm` / `sm:text-base` | `font-normal` |
| Meta / label | `text-[11px]` or `text-[10px]` | `font-medium`, `uppercase`, `tracking-wider` |

Numbers in stats use `tabular-nums` so they don't jitter.

---

## 4. Logo & marks

All official files live in `public/brand/`. **Never recreate, recolour, stretch,
rotate or add effects to any of them.**

| File | What it is | Use on |
|---|---|---|
| `icon-square-yellow.png` | Square `b` icon, black on yellow | Anywhere; also the favicon |
| `wordmark-cream.png` | "baby vc" wordmark, cream | Dark backgrounds |
| `underline-yellow.png` | Hand-drawn swoosh, yellow | **Signature mark** — see below |
| `underline-cream.png` / `underline-black.png` | Same swoosh, other colours | Contrast fallbacks |
| `brush-black.png` / `brush-alt.png` | Rough brush stroke | Heavy emphasis, use rarely |

**Clear space:** at minimum the height of the `b` icon on all sides.

### The swoosh is the signature

`underline-yellow.png`, applied via the `.swoosh` class. It is what makes this look
like baby vc rather than generic dark-mode SaaS. Use it for:

- the active tab in the main nav
- underlining every page title

Do **not** use it as a divider, a border, or decoration on cards. It marks *"this one,
right here."* Overuse kills it.

### Do / Don't (from the kit)

**Do:** yellow logo for social profiles · full black logo for everything else · white
inverse only when contrast demands it · keep clear space · big headings · brand colours only.

**Don't:** stretch, rotate or distort · add shadows, outlines or gradients · place on
busy backgrounds · sit beside unrelated brands implying partnership · italic titles ·
recreate or modify the marks.

---

## 5. Motion

Defined in `globals.css`. All of it respects `prefers-reduced-motion`.

| Animation | Use |
|---|---|
| `animate-sweep` | Radar sweep behind the map. Atmosphere only, never encodes data. |
| `animate-ping-slow` | Ring around a pin or dot meaning *new / urgent / soon*. Carries meaning. |
| `animate-marquee` | Footer ticker |
| `animate-rise` | Panels and banners entering. 450ms, `cubic-bezier(.16,1,.3,1)` |

Transitions are 150–200ms. Nothing bounces. Nothing slides more than 8px.

---

## 6. Layout & surfaces

- Page max width `1600px`, padding `px-4 sm:px-6`
- Cards: `rounded-xl`, `border-line-soft`, `bg-ink-2`, `p-4`. Hover raises to
  `bg-ink-3` and `border-yellow/35`.
- Radius scale: `rounded-lg` (8px) for controls, `rounded-xl` (12px) for cards,
  `rounded-full` for tags only.
- Film grain overlay (`.grain`) sits over the whole app at 16% opacity.
- Sticky header, `backdrop-blur-xl`, `bg-ink/85`.

---

## 7. Interaction principles

These exist because the first build was overwhelming. They are not optional.

1. **Content before controls.** The first screen of any tab shows real records, not a
   filter panel. If a user has to make three choices before seeing anything, the page
   has failed.
2. **One primary control, rest behind a drawer.** Each view gets at most one
   always-visible segmented control plus search. Everything else lives behind a
   `Filters` button carrying a count badge. Use `FilterDrawer`.
3. **Active filters are visible and removable.** Show them as chips with an `×`.
   A user must never wonder why a list looks short.
4. **Default to the useful state.** Sorted most-relevant-first, framed on the data
   that matters. Never open on an empty or arbitrary state.
5. **The map must earn its place.** Only use it where geography answers a real
   question ("where is this", "what's near me"). A news feed does not need a map.
6. **Say what a number means.** Every stat gets a plain-language label. No bare
   metrics, no jargon without a gloss.
7. **Ten options is not a feature.** If a filter has more than ~6 values, it belongs in
   a drawer or a select, not a pill row.

---

## 8. Voice

- Plain language. Explain venture terms rather than assuming them.
- Direct and concrete. No corporate softening, no hype.
- Empty states say what to do next, never just "no results".
- Take a position where it helps ("go for the side events, not the main stage").
- **No em dashes.** Use a comma, a colon, or a full stop.

---

## 9. Anti-patterns

Explicitly avoid. These are the generic defaults this project must not drift into:

- Warm cream + serif + terracotta editorial look
- Generic dark background + acid green "hacker dashboard" (the palette here is the
  client's actual brand, so keep it warm and typographic, not neon-glow)
- Broadsheet hairline grid
- Glows, neon, gradient borders, glassmorphism
- Filter-first pages that hide content behind a control wall
- Charts or maps with no question behind them
