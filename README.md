# baby vc radar

A startup and VC radar for the baby vc alumni community. Five tabs over one dataset:
funds and companies on a map, funding signals, open roles you can ping, learning
programmes, and networking events.

**This is a proof of concept.** Every record is static demo data written by hand in
`src/data/`. There is no scraper, no API and no database behind it. The shape of the
data is the real deliverable: swap the arrays for a fetch and nothing else has to change.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

Node 22. No environment variables, no API keys, no external services at runtime.

---

## The five tabs

| Route | Tab | What it does |
|---|---|---|
| `/` | **Radar** | Every fund and company on the map. Filter by industry, stage, and sort by fastest growth, most recently raised or A–Z. Click a pin or a row for the full record. |
| `/signals` | **Signals** | Funding rounds, newest first, filterable by industry and round. The five freshest ping on the map. Expanding a story shows the company's current metrics. |
| `/openings` | **Openings** | Open roles at both funds and companies. Ping an employer and new listings from them surface in a banner at the top and as a badge in the nav. |
| `/learn` | **Learn** | Bootcamps, fellowships, courses and accelerators, sorted by application deadline. Includes the baby vc bootcamps and Bending Spoons First Ascent by country. |
| `/network` | **Network** | Conferences, summits, fairs and demo days with dates, price and who is in the room. Anything inside 60 days pings. |

### The ping mechanism

Watching an employer writes its id to `localStorage` under `bvc-radar:watchlist`.
The openings tab intersects that list with roles flagged `isNew` and renders the
alert; the nav badge reads the same list. In production this is the exact list you
would hand to an email or push job. See `src/lib/watchlist.ts`.

---

## Brand

Taken from [babyvc.co/brandkit](https://www.babyvc.co/brandkit) and encoded as
Tailwind v4 tokens in `src/app/globals.css`.

| Token | Hex | Use |
|---|---|---|
| `yellow` | `#EEFB86` | Primary accent |
| `ink` | `#0E110E` | Page background |
| `ink-2` / `ink-3` | `#141813` / `#1B201A` | Cards, elevated surfaces |
| `cream` | `#F4F3EC` | Body text |
| `muted` / `dim` | `#A3A29A` / `#6B6A63` | Secondary and tertiary text |
| `alert` | `#FF6B6B` | New and urgent markers |

Typeface is **Lexend Deca**, loaded via `next/font`. Two brand rules are followed
throughout: headings are large with body text at roughly half the heading size, and
titles are always bold, never italic.

The hand-drawn swoosh (`public/brand/underline-yellow.png`) marks the active tab and
underlines every page heading. Logo assets in `public/brand/` are the official files,
unmodified.

---

## The map

`src/components/WorldMap.tsx`. Deliberately **not** Mapbox or Leaflet:

- no API key, no signup, nothing to configure before it runs
- no tile requests at runtime, so it works offline and costs nothing to serve
- a vector world matches the map treatment on babyvc.co far better than raster tiles

It projects `public/geo/countries-110m.json` (world-atlas, 108KB) with `d3-geo`'s
Natural Earth projection into a fixed 1000×520 coordinate space, and applies pan and
zoom as an SVG transform on top. On first render it frames itself to the bounding box
of whatever pins it was given, so the Radar tab lands on Europe and the Learn tab
zooms out far enough to include San Francisco, with no per-page configuration.
The `FIT` / `EU` / `ALL` buttons re-frame; scroll wheel zooms; drag pans.

---

## Data model

`src/data/types.ts` is the contract. Six datasets:

```
vcs.ts        32 funds       thesis, AUM, stages, focus, deals TTM, alumni flag
startups.ts   69 companies   industry, stage, headcount, 6-month growth, backers
news.ts       32 rounds      amount, round, investors, linked back to a company
jobs.ts       39 roles       employer, level, comp, posted date, isNew flag
learning.ts   22 programmes  format, dates, deadline, cost, selectivity
events.ts     22 events      format, dates, attendees, ticket price, crowd
```

Every city goes through `places.ts`, which maps a slug to a real `[lon, lat]` and
throws at import time on a typo, so a bad city can never reach the map.

### Replacing the demo data

Each file exports a plain typed array. To go live, keep the types and change where the
array comes from — a fetch in a server component, a database query, whatever. Nothing
in the components reads anything but those exports and the ids that link them.

---

## Deploying

The app is fully static (all six routes prerender) and has no server dependencies.

```bash
git remote add origin git@github.com:<you>/baby-vc-radar.git
git push -u origin main
```

Then import the repo on Vercel. No build settings to change, no environment variables
to add. The Vercel defaults for Next.js are correct as-is.

---

## Known scope

Deliberately not built, because this is a proof of concept:

- no scraping, ingestion or refresh of any kind
- no accounts; the watchlist is per browser, not per person
- no real notifications; pings render in-app rather than emailing
- "new this week" is a static flag in the data, not computed against a crawl history
