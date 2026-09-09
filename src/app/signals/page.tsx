"use client";

import { useMemo, useState } from "react";
import WorldMap, { type MapPin } from "@/components/WorldMap";
import { Card, Empty, PageHead, Pill, Stat, Tag, ago, fmtDate } from "@/components/ui";
import { NEWS } from "@/data/news";
import { STARTUP_BY_ID } from "@/data/startups";
import type { Industry, Stage } from "@/data/types";

const INDUSTRIES: Industry[] = ["AI / ML", "Fintech", "Climate", "Health", "SaaS", "Consumer", "Deeptech", "Mobility", "Cyber", "Space"];
const ROUNDS: Stage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];

/** Fixed "today" so the demo reads consistently no matter when it is opened. */
const TODAY = new Date("2026-09-09T00:00:00Z");

export default function SignalsPage() {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [round, setRound] = useState<Stage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(
    () =>
      NEWS.filter((n) => (!industry || n.industry === industry) && (!round || n.round === round)).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [industry, round],
  );

  const pins: MapPin[] = useMemo(
    () =>
      items.map((n, i) => ({
        id: n.id,
        coords: n.place.coords,
        tone: "yellow",
        weight: Math.max(0, 1 - i / 12),
        label: n.startupName,
        // The five freshest stories keep pinging.
        pulse: i < 5,
      })),
    [items],
  );

  const last30 = NEWS.filter((n) => (TODAY.getTime() - new Date(n.date).getTime()) / 86400000 <= 30).length;

  return (
    <>
      <PageHead
        title="Signals"
        sub="Every round the radar picked up, newest first. The five most recent are pinging on the map."
        right={
          <div className="flex gap-2">
            <Stat value={last30} label="last 30 days" tone="yellow" />
            <Stat value={NEWS.length} label="tracked rounds" />
          </div>
        }
      />

      <div className="mb-5 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map((i) => (
            <Pill key={i} active={industry === i} onClick={() => setIndustry(industry === i ? null : i)}>
              {i}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ROUNDS.map((r) => (
            <Pill key={r} active={round === r} onClick={() => setRound(round === r ? null : r)}>
              {r}
            </Pill>
          ))}
          {(industry || round) && (
            <button
              onClick={() => { setIndustry(null); setRound(null); }}
              className="ml-1 text-xs text-dim underline underline-offset-4 hover:text-yellow"
            >
              clear
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="order-2 h-[40vh] min-h-[300px] lg:order-1 lg:sticky lg:top-24 lg:h-[calc(100vh-9rem)]">
          <WorldMap pins={pins} selectedId={selected} onSelect={setSelected} />
        </div>

        <div className="order-1 space-y-2.5 lg:order-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          {items.length === 0 ? (
            <Empty>No rounds match that combination.</Empty>
          ) : (
            items.map((n) => {
              const tracked = n.startupId ? STARTUP_BY_ID.get(n.startupId) : undefined;
              return (
                <Card
                  key={n.id}
                  active={selected === n.id}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <Tag tone="solid">{n.amount}</Tag>
                    <Tag tone="yellow">{n.round}</Tag>
                    <Tag>{n.industry}</Tag>
                    <span className="text-dim">
                      {n.place.city} · {ago(n.date, TODAY)}
                    </span>
                  </div>
                  <h3 className="text-base leading-snug font-semibold">{n.headline}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-dim">
                    <span>
                      <span className="text-dim">Investors: </span>
                      <span className="text-cream/80">{n.investors.join(", ")}</span>
                    </span>
                    <span>{fmtDate(n.date)}</span>
                    <span>{n.source}</span>
                  </div>
                  {selected === n.id && tracked && (
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-soft pt-3">
                      <MiniStat label="headcount" value={tracked.headcount.toLocaleString("en-GB")} />
                      <MiniStat label="6mo growth" value={`${tracked.growth6m > 0 ? "+" : ""}${tracked.growth6m}%`} />
                      <MiniStat label="raised" value={tracked.raisedTotal} />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-yellow tabular-nums">{value}</div>
      <div className="text-[10px] tracking-wider text-dim uppercase">{label}</div>
    </div>
  );
}
