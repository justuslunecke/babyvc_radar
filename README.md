# baby vc radar

A startup and VC radar for the baby vc alumni community. Funds and companies on a
map, funding signals, open roles you can follow, and one calendar of bootcamps and
events.

**This is a proof of concept.** Every record is static demo data hand-written in
`src/data/`. There is no scraper, no API and no database. The shape of the data is
the real deliverable: swap the arrays for a fetch and nothing else has to change.

> **Working on this repo?** Start with [`CLAUDE.md`](./CLAUDE.md) for the current
> page flow and feature inventory, and [`DESIGN.md`](./DESIGN.md) for the brand
> system and interaction rules. Both are kept current with the code.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Node 22. No environment variables, no API keys, no external services at runtime.

---

## The three tabs

The app is organised around what someone came to do, not around data types.

| Route | Tab | What it does |
|---|---|---|
| `/radar` | **Information** | Expandable top news, then every fund and company on a city-clustered map. Filter for sector, stage, hiring and alumni connections. |
| `/openings` | **Career** | Open VC and startup roles, including internships. Follow employers and surface warm paths with an alum inside. |
| `/calendar` | **Opportunities** | Bootcamps, fellowships, workshops and events in one timeline, filterable by location, time and type. |

### Following and pings

Following an employer writes its id to `localStorage`. Career intersects that list
with roles flagged new and surfaces them in a banner, plus a badge in the nav. In
production this is the exact list you would hand to an email or push job.
See `src/lib/watchlist.ts`.

---

## The map

`src/components/WorldMap.tsx`. Deliberately **not** Mapbox or Leaflet:

- no API key, no signup, nothing to configure before it runs
- no tile requests at runtime, so it works offline and costs nothing to serve
- a vector world matches the map treatment on babyvc.co far better than raster tiles

It projects `public/geo/countries-110m.json` with d3-geo's Natural Earth projection,
then drives pan and zoom through the SVG `viewBox` itself. The viewBox aspect is
matched to the container via a `ResizeObserver`, so the visible rectangle is exactly
what the maths says it is, zooming anchors on the cursor, and panning is clamped to
the world's bounds.

Markers are **clustered by city**. About 100 entities live across 40 cities, so
London alone has 18 at identical coordinates. One marker per city, sized by count,
click to filter.

---

## Data

`src/data/types.ts` is the contract.

```
vcs.ts        32 funds       thesis, AUM, stages, focus, deals/yr, alumni flag
startups.ts   69 companies   industry, stage, headcount, 6-month growth, backers
news.ts       32 rounds      amount, round, investors, linked to a company
jobs.ts       39 roles       employer, level, team, comp, posted date, isNew
learning.ts   22 programmes  format, dates, deadline, cost, selectivity
events.ts     22 events      format, dates, attendees, ticket, crowd
```

Every city goes through `places.ts`, which maps a slug to a real `[lon, lat]` and
throws at import time on a typo, so a bad city can never reach the map.

`src/lib/today.ts` pins "now" to 2026-09-09 so relative dates stay consistent.
Swap it for `new Date()` when the data goes live.

**To go live:** keep the types, change where each array comes from. Nothing in the
components reads anything but those exports and the ids that link them.

---

## Deploying

All routes prerender static and there are no server dependencies.

```bash
git remote add origin git@github.com:<you>/baby-vc-radar.git
git push -u origin main
```

Then import the repo on Vercel and accept the defaults. Nothing to configure.
