"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar, Segmented } from "@/components/filters";
import { Card, Empty, Growth, Tag, ago, fmtDate } from "@/components/ui";
import { NEWS } from "@/data/news";
import { STARTUP_BY_ID } from "@/data/startups";
import type { Industry, Stage } from "@/data/types";
import { TODAY } from "@/lib/today";

const INDUSTRIES: Industry[] = ["AI / ML", "Fintech", "Climate", "Health", "SaaS", "Consumer", "Deeptech", "Mobility", "Cyber", "Space"];
const ROUNDS: Stage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];

type Window = "30d" | "90d" | "all";

/** No map here: a funding feed is a chronology, and geography answers nothing about it. */
export default function SignalsPage() {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [round, setRound] = useState<Stage | null>(null);
  const [win, setWin] = useState<Window>("all");
  const [open, setOpen] = useState<string | null>(null);

  const items = useMemo(() => {
    const limit = win === "30d" ? 30 : win === "90d" ? 90 : Infinity;
    return NEWS.filter((n) => {
      const age = Math.round((TODAY.getTime() - new Date(n.date + "T00:00:00Z").getTime()) / 86400000);
      return (!industry || n.industry === industry) && (!round || n.round === round) && age <= limit;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [industry, round, win]);

  return (
    <>
      <header className="mb-6">
        <h1 className="relative inline-block text-4xl font-bold tracking-tight sm:text-5xl">
          Signals
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Who just raised money, newest first. A company that raised recently is usually about to hire.
        </p>
      </header>

      <FilterBar
        primary={
          <Segmented<Window>
            options={[["all", "All time"], ["90d", "Last 90 days"], ["30d", "Last 30 days"]]}
            value={win}
            onChange={setWin}
          />
        }
        groups={[
          { key: "industry", label: "Industry", options: INDUSTRIES, value: industry, onChange: (v) => setIndustry(v as Industry | null) },
          { key: "round", label: "Round", options: ROUNDS, value: round, onChange: (v) => setRound(v as Stage | null) },
        ]}
        resultCount={items.length}
        resultNoun="rounds"
      />

      {items.length === 0 ? (
        <Empty>No rounds in that window. Widen the date range or clear a filter.</Empty>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const s = n.startupId ? STARTUP_BY_ID.get(n.startupId) : undefined;
            const isOpen = open === n.id;
            return (
              <Card key={n.id} active={isOpen} onClick={() => setOpen(isOpen ? null : n.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <Tag tone="solid">{n.amount}</Tag>
                      <Tag tone="yellow">{n.round}</Tag>
                      <Tag>{n.industry}</Tag>
                      <span className="text-dim">{n.place.city} · {ago(n.date, TODAY)}</span>
                    </div>
                    <h2 className="text-base leading-snug font-semibold">{n.headline}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.summary}</p>
                  </div>
                  {s && (
                    <div className="shrink-0 text-right">
                      <Growth value={s.growth6m} />
                      <div className="text-[10px] tracking-wider text-dim uppercase">6mo team</div>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-line-soft pt-3">
                    <div className="text-xs">
                      <span className="text-dim">Who put money in: </span>
                      <span className="text-cream/85">{n.investors.join(", ")}</span>
                    </div>
                    {s && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Mini label="people" value={s.headcount.toLocaleString("en-GB")} />
                        <Mini label="raised to date" value={s.raisedTotal} />
                        <Mini label="stage" value={s.stage} />
                        <Mini label="founded" value={String(s.founded)} />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-dim">
                      <span>{fmtDate(n.date)}</span>
                      <span>{n.source}</span>
                      {s && (
                        <Link href={`/radar?focus=${s.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-yellow underline underline-offset-4">
                          Open {s.name} on the radar →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-yellow tabular-nums">{value}</div>
      <div className="text-[10px] tracking-wider text-dim uppercase">{label}</div>
    </div>
  );
}
