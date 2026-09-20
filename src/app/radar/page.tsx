"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorldMap, { type MapItem } from "@/components/WorldMap";
import { FilterBar, Segmented } from "@/components/filters";
import { Card, Empty, Growth, Stat, Tag, fmtDate } from "@/components/ui";
import { VCS } from "@/data/vcs";
import { STARTUPS } from "@/data/startups";
import { JOBS } from "@/data/jobs";
import { NEWS } from "@/data/news";
import type { Industry, Stage, Startup, Vc } from "@/data/types";
import { useWatchlist } from "@/lib/watchlist";

const INDUSTRIES: Industry[] = ["AI / ML", "Fintech", "Climate", "Health", "SaaS", "Consumer", "Deeptech", "Mobility", "Cyber", "Space"];
const STAGES: Stage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];

type Lens = "all" | "vc" | "startup";
type Sort = "growth" | "recent" | "name";

export default function RadarPage() {
  return (
    <Suspense fallback={null}>
      <Radar />
    </Suspense>
  );
}

function Radar() {
  const params = useSearchParams();
  // Deep link from Today or Signals: /radar?focus=<entity id>. Read once at mount;
  // arriving from another route remounts this component, so an effect is not needed.
  const [selected, setSelected] = useState<string | null>(() => params.get("focus"));
  const [lens, setLens] = useState<Lens>("all");
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [hiringOnly, setHiringOnly] = useState(false);
  const [alumniOnly, setAlumniOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("growth");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(false);
  const { has, toggle } = useWatchlist();

  const q = query.trim().toLowerCase();
  const hiring = useMemo(() => new Set(JOBS.map((j) => j.employerId)), []);

  const vcs = useMemo(() => {
    if (lens === "startup") return [];
    return VCS.filter(
      (v) =>
        (!industry || v.focus.includes(industry)) &&
        (!stage || v.stages.includes(stage)) &&
        (!hiringOnly || hiring.has(v.id)) &&
        (!alumniOnly || v.alumniInside) &&
        (!q || v.name.toLowerCase().includes(q) || v.place.city.toLowerCase().includes(q)),
    );
  }, [lens, industry, stage, hiringOnly, alumniOnly, q, hiring]);

  const startups = useMemo(() => {
    if (lens === "vc") return [];
    // "Alumni inside" is a property of funds, so it excludes companies entirely.
    if (alumniOnly) return [];
    return STARTUPS.filter(
      (s) =>
        (!industry || s.industry === industry) &&
        (!stage || s.stage === stage) &&
        (!hiringOnly || hiring.has(s.id)) &&
        (!q || s.name.toLowerCase().includes(q) || s.place.city.toLowerCase().includes(q)),
    );
  }, [lens, industry, stage, hiringOnly, alumniOnly, q, hiring]);

  const all: (Vc | Startup)[] = useMemo(() => [...startups, ...vcs], [startups, vcs]);

  const sorted = useMemo(() => {
    const arr = [...all];
    if (sort === "name") return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "recent")
      return arr.sort((a, b) => {
        const ka = a.kind === "startup" ? a.lastRoundDate : "";
        const kb = b.kind === "startup" ? b.lastRoundDate : "";
        return kb.localeCompare(ka);
      });
    return arr.sort((a, b) => {
      const ga = a.kind === "startup" ? a.growth6m : a.dealsTtm;
      const gb = b.kind === "startup" ? b.growth6m : b.dealsTtm;
      return gb - ga;
    });
  }, [all, sort]);

  /** The map shows everything that passed the filters; the list narrows further by city. */
  const rows = useMemo(() => (city ? sorted.filter((r) => r.place.city === city) : sorted), [sorted, city]);

  const items: MapItem[] = useMemo(
    () =>
      all.map((e) => ({
        id: e.id,
        city: e.place.city,
        coords: e.place.coords,
        tone: e.kind === "vc" ? "cream" : "yellow",
        label: e.name,
      })),
    [all],
  );

  const active = sorted.find((r) => r.id === selected) ?? null;

  return (
    <>
      <header className="mb-6">
        <h1 className="relative inline-block text-4xl font-bold tracking-tight sm:text-5xl">
          Information
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          News first, then the people and companies behind it. Use the explorer to find startups and funds worth following.
        </p>
      </header>

      <section className="mb-7 rounded-xl border border-line-soft bg-ink-2 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-yellow uppercase">News right now</p>
            <h2 className="mt-1 text-xl font-bold">What moved in the ecosystem</h2>
          </div>
          <button onClick={() => setNewsOpen((v) => !v)} className="rounded-lg border border-yellow/40 px-3 py-1.5 text-xs font-semibold text-yellow transition hover:bg-yellow/10">
            {newsOpen ? "Show less" : `See all ${NEWS.length} updates`}
          </button>
        </div>
        <div className="mt-4 divide-y divide-line-soft">
          {[...NEWS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, newsOpen ? NEWS.length : 3).map((n) => (
            <article key={n.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-dim"><Tag tone="yellow">{n.round}</Tag><span>{n.place.city}</span><span>{fmtDate(n.date)}</span></div>
                <h3 className="text-sm font-semibold text-cream">{n.headline}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{n.summary}</p>
              </div>
              <Link href={`/signals`} className="shrink-0 text-xs font-semibold text-yellow underline underline-offset-4">{n.amount} →</Link>
            </article>
          ))}
        </div>
      </section>

      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-dim uppercase">Explore the ecosystem</p>
        <h2 className="mt-1 text-2xl font-bold">Startups and funds</h2>
      </div>

      <FilterBar
        primary={
          <Segmented<Lens>
            options={[["all", "Everything"], ["vc", "Funds"], ["startup", "Companies"]]}
            value={lens}
            onChange={setLens}
          />
        }
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search a fund, company or city…"
        groups={[
          { key: "industry", label: "Industry", options: INDUSTRIES, value: industry, onChange: (v) => setIndustry(v as Industry | null) },
          { key: "stage", label: "Stage", options: STAGES, value: stage, onChange: (v) => setStage(v as Stage | null) },
        ]}
        toggles={[
          { key: "hiring", label: "Hiring now", value: hiringOnly, onChange: setHiringOnly },
          { key: "alumni", label: "Alumni inside", value: alumniOnly, onChange: setAlumniOnly },
        ]}
        resultCount={all.length}
        resultNoun={lens === "vc" ? "funds" : lens === "startup" ? "companies" : "on the map"}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-[52vh] min-h-[380px] lg:sticky lg:top-24 lg:h-[calc(100vh-9rem)]">
          <WorldMap
            items={items}
            selectedId={selected}
            selectedCity={city}
            onPickCity={(c) => {
              setCity(c);
              setSelected(null);
            }}
          >
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-cream" /> fund</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-yellow" /> company</span>
            </div>
          </WorldMap>
        </div>

        <div className="lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          {active ? (
            <Detail entity={active} onClose={() => setSelected(null)} watched={has(active.id)} onWatch={() => toggle(active.id)} />
          ) : (
            <>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                {city ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow/40 py-1 pr-1.5 pl-2.5 text-[11px] text-yellow">
                    {city} · {rows.length}
                    <button onClick={() => setCity(null)} aria-label="Show all cities" className="grid size-4 place-items-center rounded-full hover:bg-yellow hover:text-black">
                      ×
                    </button>
                  </span>
                ) : (
                  <span className="text-[11px] text-dim">Showing all cities</span>
                )}
                <Segmented<Sort>
                  size="sm"
                  options={[["growth", "Growth"], ["recent", "Recent"], ["name", "A–Z"]]}
                  value={sort}
                  onChange={setSort}
                />
              </div>

              {rows.length === 0 ? (
                <Empty>
                  Nothing here. Try clearing a filter, or pick a different city on the map.
                </Empty>
              ) : (
                <div className="space-y-2">
                  {rows.map((r) => (
                    <Row key={r.id} entity={r} onClick={() => setSelected(r.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ entity, onClick }: { entity: Vc | Startup; onClick: () => void }) {
  const isVc = entity.kind === "vc";
  return (
    <Card onClick={onClick} className="!p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <i className={`size-1.5 shrink-0 rounded-full ${isVc ? "bg-cream" : "bg-yellow"}`} />
            <h3 className="truncate font-semibold">{entity.name}</h3>
            {isVc && entity.alumniInside && <Tag tone="yellow">alum inside</Tag>}
          </div>
          <p className="mt-1 truncate text-xs text-dim">
            {isVc
              ? `${entity.place.city} · ${entity.aum} AUM`
              : `${entity.place.city} · ${entity.industry} · ${entity.stage}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {isVc ? (
            <>
              <div className="font-semibold text-cream tabular-nums">{entity.dealsTtm}</div>
              <div className="text-[10px] tracking-wider text-dim uppercase">deals/yr</div>
            </>
          ) : (
            <>
              <Growth value={entity.growth6m} />
              <div className="text-[10px] tracking-wider text-dim uppercase">6mo team</div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function Detail({ entity, onClose, watched, onWatch }: {
  entity: Vc | Startup; onClose: () => void; watched: boolean; onWatch: () => void;
}) {
  const roles = JOBS.filter((j) => j.employerId === entity.id);
  return (
    <div className="animate-rise space-y-4 rounded-xl border border-yellow/35 bg-ink-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Tag tone={entity.kind === "vc" ? "line" : "yellow"}>{entity.kind === "vc" ? "Fund" : "Company"}</Tag>
          <h2 className="mt-2 text-2xl font-bold">{entity.name}</h2>
          <p className="text-sm text-muted">{entity.place.city}, {entity.place.country}</p>
        </div>
        <button onClick={onClose} className="text-xs text-dim hover:text-yellow">back</button>
      </div>

      {entity.kind === "vc" ? (
        <>
          <p className="text-sm leading-relaxed text-cream/85">{entity.thesis}</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat value={entity.aum} label="money they manage" />
            <Stat value={entity.dealsTtm} label="investments a year" tone="yellow" />
          </div>
          <Field label="Cheques they write">{entity.stages.join(" · ")}</Field>
          <Field label="What they back">
            <div className="flex flex-wrap gap-1.5">{entity.focus.map((f) => <Tag key={f}>{f}</Tag>)}</div>
          </Field>
          <Field label="Known for">{entity.notable.join(", ")}</Field>
          {entity.alumniInside && (
            <div className="rounded-lg border border-yellow/25 bg-yellow/5 px-3 py-2 text-xs text-yellow">
              A baby vc alum works here. Ask in the community channel for a warm intro before applying cold.
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-cream/85">{entity.blurb}</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat value={<Growth value={entity.growth6m} />} label="team growth, 6mo" />
            <Stat value={entity.headcount.toLocaleString("en-GB")} label="people" />
            <Stat value={entity.raisedTotal} label="raised to date" tone="yellow" />
            <Stat value={entity.stage} label="stage" />
          </div>
          <Field label="Last round">{entity.lastRound} · {fmtDate(entity.lastRoundDate)}</Field>
          <Field label="Who backed them">{entity.backers.join(", ")}</Field>
        </>
      )}

      {roles.length > 0 && (
        <Field label={`Open roles (${roles.length})`}>
          <div className="space-y-1">
            {roles.map((j) => (
              <div key={j.id} className="flex items-center gap-2 text-xs">
                {j.isNew && <Tag tone="alert">new</Tag>}
                <span className="text-cream">{j.title}</span>
                <span className="text-dim">· {j.place.city}</span>
              </div>
            ))}
          </div>
        </Field>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onWatch}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            watched ? "border-yellow bg-yellow text-black" : "border-yellow/40 text-yellow hover:bg-yellow/10"
          }`}
        >
          {watched ? "✓ Following — you'll be pinged" : "Ping me on new roles"}
        </button>
        <a href={entity.site} target="_blank" rel="noreferrer" className="rounded-lg border border-line-soft px-3 py-2 text-xs font-semibold text-muted transition hover:border-yellow/40 hover:text-cream">
          Site ↗
        </a>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] tracking-[0.14em] text-dim uppercase">{label}</div>
      <div className="text-sm text-cream/85">{children}</div>
    </div>
  );
}
