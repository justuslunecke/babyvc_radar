"use client";

import { useMemo, useState } from "react";
import WorldMap, { type MapPin } from "@/components/WorldMap";
import { Card, Empty, Growth, Pill, PageHead, Stat, Tag, fmtDate } from "@/components/ui";
import { VCS } from "@/data/vcs";
import { STARTUPS } from "@/data/startups";
import type { Industry, Stage, Startup, Vc } from "@/data/types";
import { useWatchlist } from "@/lib/watchlist";
import { JOBS } from "@/data/jobs";

const INDUSTRIES: Industry[] = ["AI / ML", "Fintech", "Climate", "Health", "SaaS", "Consumer", "Deeptech", "Mobility", "Cyber", "Space"];
const STAGES: Stage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];

type Lens = "all" | "vc" | "startup";
type Sort = "growth" | "name" | "recent";

export default function RadarPage() {
  const [lens, setLens] = useState<Lens>("all");
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [sort, setSort] = useState<Sort>("growth");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { has, toggle } = useWatchlist();

  const q = query.trim().toLowerCase();

  const vcs = useMemo(() => {
    if (lens === "startup") return [];
    return VCS.filter(
      (v) =>
        (!industry || v.focus.includes(industry)) &&
        (!stage || v.stages.includes(stage)) &&
        (!q || v.name.toLowerCase().includes(q) || v.place.city.toLowerCase().includes(q)),
    );
  }, [lens, industry, stage, q]);

  const startups = useMemo(() => {
    if (lens === "vc") return [];
    const list = STARTUPS.filter(
      (s) =>
        (!industry || s.industry === industry) &&
        (!stage || s.stage === stage) &&
        (!q || s.name.toLowerCase().includes(q) || s.place.city.toLowerCase().includes(q)),
    );
    if (sort === "growth") return [...list].sort((a, b) => b.growth6m - a.growth6m);
    if (sort === "recent") return [...list].sort((a, b) => b.lastRoundDate.localeCompare(a.lastRoundDate));
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [lens, industry, stage, sort, q]);

  const rows: (Vc | Startup)[] = useMemo(() => {
    if (lens === "vc") return [...vcs].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.dealsTtm - a.dealsTtm));
    if (lens === "startup") return startups;
    return [...startups, ...vcs];
  }, [lens, vcs, startups, sort]);

  const pins: MapPin[] = useMemo(() => {
    const top = new Set(
      [...STARTUPS].sort((a, b) => b.growth6m - a.growth6m).slice(0, 8).map((s) => s.id),
    );
    return [
      ...vcs.map<MapPin>((v) => ({
        id: v.id,
        coords: v.place.coords,
        tone: "cream",
        weight: Math.min(1, v.dealsTtm / 50),
        label: v.name,
      })),
      ...startups.map<MapPin>((s) => ({
        id: s.id,
        coords: s.place.coords,
        tone: "yellow",
        weight: Math.min(1, s.headcount / 2500),
        label: s.name,
        pulse: sort === "growth" && top.has(s.id),
      })),
    ];
  }, [vcs, startups, sort]);

  const active = rows.find((r) => r.id === selected) ?? null;
  const filtered = industry || stage || q;

  return (
    <>
      <PageHead
        title="Radar"
        sub="Every fund and company the radar tracks, placed where it actually sits. Filter by industry, stage or growth, then click a pin to open the record."
        right={
          <div className="flex gap-2">
            <Stat value={vcs.length} label="funds" />
            <Stat value={startups.length} label="companies" tone="yellow" />
          </div>
        }
      />

      {/* Filter bar */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-line-soft p-1">
            {(["all", "vc", "startup"] as Lens[]).map((l) => (
              <button
                key={l}
                onClick={() => setLens(l)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  lens === l ? "bg-yellow text-black" : "text-dim hover:text-cream"
                }`}
              >
                {l === "all" ? "Everything" : l === "vc" ? "Funds" : "Companies"}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or city…"
            className="w-52 rounded-lg border border-line-soft bg-ink-2 px-3 py-2 text-xs text-cream outline-none placeholder:text-dim focus:border-yellow/50"
          />

          {lens !== "vc" && (
            <div className="flex gap-1 rounded-lg border border-line-soft p-1">
              {([["growth", "Fastest growth"], ["recent", "Recently raised"], ["name", "A–Z"]] as [Sort, string][]).map(
                ([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      sort === k ? "bg-yellow text-black" : "text-dim hover:text-cream"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          )}

          {filtered && (
            <button
              onClick={() => { setIndustry(null); setStage(null); setQuery(""); }}
              className="text-xs text-dim underline underline-offset-4 hover:text-yellow"
            >
              clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map((i) => (
            <Pill key={i} active={industry === i} onClick={() => setIndustry(industry === i ? null : i)}>
              {i}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <Pill key={s} active={stage === s} onClick={() => setStage(stage === s ? null : s)}>
              {s}
            </Pill>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="h-[46vh] min-h-[340px] lg:sticky lg:top-24 lg:h-[calc(100vh-9rem)]">
          <WorldMap pins={pins} selectedId={selected} onSelect={setSelected}>
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-cream" /> fund
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-yellow" /> company
              </span>
              {sort === "growth" && lens !== "vc" && (
                <span className="flex items-center gap-2">
                  <i className="size-2 animate-ping-slow rounded-full bg-yellow" /> top 8 by growth
                </span>
              )}
            </div>
          </WorldMap>
        </div>

        <div className="lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          {active ? (
            <DetailPanel entity={active} onClose={() => setSelected(null)} watched={has(active.id)} onWatch={() => toggle(active.id)} />
          ) : rows.length === 0 ? (
            <Empty>Nothing matches those filters. Try clearing the stage or industry.</Empty>
          ) : (
            <div className="space-y-2">
              {rows.map((r) =>
                r.kind === "vc" ? (
                  <VcRow key={r.id} vc={r} onClick={() => setSelected(r.id)} />
                ) : (
                  <StartupRow key={r.id} s={r} onClick={() => setSelected(r.id)} />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StartupRow({ s, onClick }: { s: Startup; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="!p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <i className="size-1.5 shrink-0 rounded-full bg-yellow" />
            <h3 className="truncate font-semibold">{s.name}</h3>
          </div>
          <p className="mt-1 truncate text-xs text-dim">
            {s.place.city} · {s.industry} · {s.stage}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Growth value={s.growth6m} />
          <div className="text-[10px] tracking-wider text-dim uppercase">6mo hc</div>
        </div>
      </div>
    </Card>
  );
}

function VcRow({ vc, onClick }: { vc: Vc; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="!p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <i className="size-1.5 shrink-0 rounded-full bg-cream" />
            <h3 className="truncate font-semibold">{vc.name}</h3>
            {vc.alumniInside && <Tag tone="yellow">alum inside</Tag>}
          </div>
          <p className="mt-1 truncate text-xs text-dim">
            {vc.place.city} · {vc.aum} AUM · {vc.stages[0]}–{vc.stages[vc.stages.length - 1]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold tabular-nums text-cream">{vc.dealsTtm}</div>
          <div className="text-[10px] tracking-wider text-dim uppercase">deals ttm</div>
        </div>
      </div>
    </Card>
  );
}

function DetailPanel({ entity, onClose, watched, onWatch }: {
  entity: Vc | Startup; onClose: () => void; watched: boolean; onWatch: () => void;
}) {
  const openRoles = JOBS.filter((j) => j.employerId === entity.id);
  return (
    <div className="animate-rise space-y-4 rounded-xl border border-yellow/35 bg-ink-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Tag tone={entity.kind === "vc" ? "line" : "yellow"}>{entity.kind === "vc" ? "Fund" : "Company"}</Tag>
          <h2 className="mt-2 text-2xl font-bold">{entity.name}</h2>
          <p className="text-sm text-muted">
            {entity.place.city}, {entity.place.country}
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-dim hover:text-yellow" aria-label="Close">
          close ✕
        </button>
      </div>

      {entity.kind === "vc" ? (
        <>
          <p className="text-sm leading-relaxed text-cream/85">{entity.thesis}</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat value={entity.aum} label="aum" />
            <Stat value={entity.dealsTtm} label="deals ttm" tone="yellow" />
          </div>
          <Field label="Stages">{entity.stages.join(" · ")}</Field>
          <Field label="Focus">
            <div className="flex flex-wrap gap-1.5">{entity.focus.map((f) => <Tag key={f}>{f}</Tag>)}</div>
          </Field>
          <Field label="Notable">{entity.notable.join(", ")}</Field>
          {entity.alumniInside && (
            <div className="rounded-lg border border-yellow/25 bg-yellow/5 px-3 py-2 text-xs text-yellow">
              A baby vc alum works here. Ask in the community channel for a warm intro.
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-cream/85">{entity.blurb}</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat value={<Growth value={entity.growth6m} />} label="6mo headcount" />
            <Stat value={entity.headcount.toLocaleString("en-GB")} label="headcount" />
            <Stat value={entity.raisedTotal} label="raised total" tone="yellow" />
            <Stat value={entity.stage} label="stage" />
          </div>
          <Field label="Last round">
            {entity.lastRound} · {fmtDate(entity.lastRoundDate)}
          </Field>
          <Field label="Backers">{entity.backers.join(", ")}</Field>
          <Field label="Industry">
            <Tag tone="yellow">{entity.industry}</Tag>
          </Field>
          <Field label="Founded">{entity.founded}</Field>
        </>
      )}

      {openRoles.length > 0 && (
        <Field label={`Open roles (${openRoles.length})`}>
          <div className="space-y-1">
            {openRoles.map((j) => (
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
          {watched ? "✓ Pinged — you'll see new roles" : "Ping me on new roles"}
        </button>
        <a
          href={entity.site}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line-soft px-3 py-2 text-xs font-semibold text-muted transition hover:border-yellow/40 hover:text-cream"
        >
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
