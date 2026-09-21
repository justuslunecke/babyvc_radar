# baby vc radar — project brief

Loaded automatically at the start of every Claude Code session in this repo.
It is the running summary of **what exists, how it is put together, and what is not
built yet**, so any agent (or person) can pick the project up cold.

---

## ⚠️ Keeping this file honest

**This file must be updated in the same commit as any change that alters it.**
That means: a tab added, removed or renamed; a feature shipped or cut; a route
changed; a dataset added or resized; a dependency added; a decision reversed.

Before you finish any task in this repo:

1. Re-read §3 (Page flow) and §4 (Feature inventory) and correct anything now wrong.
2. Move anything you just built from "Not built" to the inventory.
3. Update the counts in §5 if you touched `src/data/`.
4. Update §7 if you made an architectural decision worth not re-litigating.

An out-of-date CLAUDE.md is worse than none, because it is trusted.
If you only changed styling, you probably only need to touch `DESIGN.md`.

**Design rules live in [`DESIGN.md`](./DESIGN.md). Read it before writing any UI.**
It is binding: brand colours, type scale, logo usage, motion, and the interaction
principles that this app was specifically restructured to follow.

---

## 1. What this is

A startup and VC radar for the **baby vc** alumni community, a pan-European
community for people getting into venture and founding. This is a **proof of
concept**: every record is static demo data hand-written in `src/data/`. There is no
scraper, no API, no database, no auth. The data *shape* is the deliverable.

Live goal: GitHub → Vercel on its own domain. Currently local only.

## 2. Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (CSS-first
`@theme`) · `d3-geo` + `topojson-client` for the map. Node 22.
No environment variables, no runtime network calls, no third-party services.
All routes prerender static.

```bash
npm run dev     # localhost:3000
npm run build   # must pass before committing
npm run lint    # must pass before committing
```

## 3. Page flow

The app is organised around **user intent**, not data type. This was a deliberate
restructure: v1 was organised by entity (funds, startups, news, jobs, courses,
events) and every tab opened with 13–17 filter controls, which tested as
overwhelming. See §7.1.

```
/radar            Information    ← expandable news plus startup and fund explorer.
/openings         Career         ← roles, internships and warm paths in.
/calendar         Opportunities  ← learning programmes and events in one timeline.
```

**Information** is the entry point and answers "what changed and who matters". It
opens with three news items and a deliberate expand control, then hands into the
startup and fund explorer. **Career** answers where to apply. **Opportunities**
answers what to attend or apply for.

`/` redirects to `/radar`. The former Daily briefing is deliberately retired so a
first visit always begins with Information.

Deep links between tabs: `/radar?focus=<entityId>` opens a record directly.
`/calendar?view=events|learn` preselects a segment.

## 4. Feature inventory

### Built

| Feature | Where | Notes |
|---|---|---|
| Expandable news | `/radar` | Three current updates by default, expandable to the full feed. |
| World map, city-clustered | `/radar`, `/calendar` | One marker per city with a count; click to filter the list. |
| Map pan / zoom-to-cursor | `WorldMap.tsx` | viewBox-driven, aspect-correct, clamped to world bounds. |
| Auto-fit framing | `WorldMap.tsx` | Frames the data once on load. `FIT` / `EU` buttons re-frame. |
| Filter drawer | `filters.tsx` | All long filter lists behind one button + count badge + removable chips. |
| Entity detail panel | `/radar` | Funds and companies, with plain-language stat labels. |
| Follow / ping | `/openings`, `/radar` | `localStorage`. Drives the banner and the nav badge. |
| First-visit introduction | Every route | Short, required walkthrough on every hard refresh. It measures and points to the visible desktop or mobile nav item, then is only dismissed after the final step. |
| Responsive navigation | Every route | Desktop uses the top navigation. Phones use a distinct bottom dock outside the scroll area, so content never travels behind it. |
| Career explorer | `/openings` | VC and startup roles, internships, salary and start-date filters, follow list and warm Baby VC alumni signals. |
| Opportunities explorer | `/calendar` | Programmes, accelerators and events in one chronology, sorted by the actionable date. |
| Optional map on calendar | `/calendar` | Hidden by default behind "Show on map". |
| Vercel Web Analytics | Root layout | Tracks deployed page views through `@vercel/analytics`; it has no visible UI. |

### Not built (deliberate, this is a PoC)

- **No scraping or ingestion.** All data is static. `isNew` is a hand-set flag, not
  computed against crawl history.
- **No accounts.** The follow list is per browser, not per person. Clearing site data
  loses it.
- **No real notifications.** "Ping" renders in-app; no email or push is sent.
- **No write path.** Nothing in the UI creates or edits a record.
- **No tests.** No test runner is configured.
- **No i18n.** English only.

## 5. Data

`src/data/types.ts` is the contract. Every array is plain and typed; to go live,
keep the types and change where the array comes from.

| File | Count | Holds |
|---|---|---|
| `vcs.ts` | 32 | Funds: thesis, AUM, stages, focus, deals/yr, `alumniInside` |
| `startups.ts` | 69 | Companies: industry, stage, headcount, 6-month growth, backers |
| `news.ts` | 32 | Rounds: amount, round, investors, linked to a company by id |
| `jobs.ts` | 39 | Roles: employer, level, team, comp, posted, `isNew` |
| `learning.ts` | 22 | Programmes: format, dates, deadline, cost, selectivity |
| `events.ts` | 22 | Events: format, dates, attendees, ticket, crowd |
| `places.ts` | 40 cities | Slug → `[lon, lat]`. **Throws at import on a typo.** |

`src/lib/today.ts` pins "now" to **2026-09-09** so every relative date in the demo
tells one consistent story. Swap it for `new Date()` when the data goes live.

Entities link by id: `jobs.employerId` → a `vcs` or `startups` id;
`news.startupId` → a `startups` id.

## 6. Code map

```
src/
  app/
    layout.tsx          Lexend Deca + Shell
    globals.css         brand tokens (@theme), keyframes, grain  ← see DESIGN.md
    page.tsx            Legacy briefing route
    radar|signals|openings|calendar/page.tsx  ← nav exposes radar, openings and calendar
  components/
    Shell.tsx           header, nav (swoosh on active tab), badge, footer marquee
    WorldMap.tsx        d3-geo map: clustering, zoom, pan, auto-fit
    filters.tsx         FilterBar + Segmented  ← use these, do not hand-roll filters
    ui.tsx              Card, Tag, Stat, Empty, Growth, date helpers
  data/                 the six datasets + places
  lib/
    watchlist.ts        follow list via useSyncExternalStore; useHydrated()
    today.ts            pinned reference date
public/brand/           official logo + swoosh assets, unmodified
public/geo/             countries-110m.json (world-atlas, 108KB)
```

## 7. Decisions worth not re-litigating

1. **Intent over entity.** v1 grouped by data type and buried content behind filter
   walls. v2 leads with a briefing and hides filters behind a drawer. Do not add a
   filter row back to the top of a page.
2. **The map is not a tile map.** No Mapbox/Leaflet: no API key, no runtime network,
   works offline, and a vector world matches babyvc.co. `d3-geo` + local TopoJSON.
3. **Clustering by city is required.** ~100 entities across ~40 cities means London
   has 18 at identical coordinates. Individual pins stack into an unreadable blob.
4. **Map only where geography answers something.** It belongs in Information; it is
   optional and collapsed in Opportunities.
5. **Learn + Network are one tab.** Both are "a place, a date, is it worth the trip".
   Two tabs was duplicated furniture.
6. **`localStorage` reads go through `useSyncExternalStore`**, never `useState` +
   `useEffect`. The lint rule `react-hooks/set-state-in-effect` enforces this.
7. **Query-param state is read at mount via lazy `useState`**, not synced in an
   effect, for the same reason.
8. **Reference date is pinned**, not `new Date()`, so the demo never drifts into
   showing every deadline as expired.

## 8. Conventions

- Work on `main` directly. Commit after each completed change.
- `npm run build` and `npm run lint` must both pass before committing.
- Full-file rewrites over incremental patches.
- Check whether a component already exists before building one. `filters.tsx` and
  `ui.tsx` cover most needs.
- Never hardcode a hex colour; use the `@theme` tokens.
- No em dashes in UI copy or docs.
