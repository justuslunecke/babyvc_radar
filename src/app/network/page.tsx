"use client";

import { useMemo, useState } from "react";
import WorldMap, { type MapPin } from "@/components/WorldMap";
import { Card, Empty, PageHead, Pill, Stat, Tag, daysUntil, fmtRange } from "@/components/ui";
import { EVENTS } from "@/data/events";
import type { EventFormat } from "@/data/types";

const FORMATS: EventFormat[] = ["Conference", "Summit", "Fair", "Demo day", "Meetup"];
const TODAY = new Date("2026-09-09T00:00:00Z");

type Window = "all" | "90d" | "180d";

export default function NetworkPage() {
  const [format, setFormat] = useState<EventFormat | null>(null);
  const [win, setWin] = useState<Window>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const items = useMemo(() => {
    const limit = win === "90d" ? 90 : win === "180d" ? 180 : Infinity;
    return EVENTS.filter((e) => {
      const d = daysUntil(e.starts, TODAY);
      return (
        (!format || e.format === format) &&
        d <= limit &&
        (!q || e.name.toLowerCase().includes(q) || e.place.city.toLowerCase().includes(q) || e.place.country.toLowerCase().includes(q))
      );
    }).sort((a, b) => a.starts.localeCompare(b.starts));
  }, [format, win, q]);

  const pins: MapPin[] = useMemo(
    () =>
      items.map((e) => {
        const d = daysUntil(e.starts, TODAY);
        return {
          id: e.id,
          coords: e.place.coords,
          tone: d >= 0 && d <= 60 ? "yellow" : "cream",
          weight: Math.min(1, parseInt(e.attendees.replace(/\D/g, "") || "1000", 10) / 40000 + 0.25),
          label: e.name,
          pulse: d >= 0 && d <= 60,
        } as MapPin;
      }),
    [items],
  );

  const next60 = EVENTS.filter((e) => {
    const d = daysUntil(e.starts, TODAY);
    return d >= 0 && d <= 60;
  }).length;

  return (
    <>
      <PageHead
        title="Network"
        sub="Startup fairs, summits and demo days worth travelling for, with dates, price and who is actually in the room. Anything in the next 60 days is pinging."
        right={
          <div className="flex gap-2">
            <Stat value={next60} label="next 60 days" tone="yellow" />
            <Stat value={EVENTS.length} label="events" />
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {FORMATS.map((f) => (
          <Pill key={f} active={format === f} onClick={() => setFormat(format === f ? null : f)}>
            {f}
          </Pill>
        ))}
        <span className="mx-1 h-5 w-px bg-line-soft" />
        {([["all", "Everything"], ["180d", "Next 6 months"], ["90d", "Next 90 days"]] as [Window, string][]).map(
          ([k, label]) => (
            <Pill key={k} active={win === k} onClick={() => setWin(k)}>
              {label}
            </Pill>
          ),
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search event or city…"
          className="ml-1 w-52 rounded-lg border border-line-soft bg-ink-2 px-3 py-2 text-xs text-cream outline-none placeholder:text-dim focus:border-yellow/50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="order-2 h-[40vh] min-h-[300px] lg:order-1 lg:sticky lg:top-24 lg:h-[calc(100vh-9rem)]">
          <WorldMap pins={pins} selectedId={selected} onSelect={setSelected}>
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-2">
                <i className="size-2 animate-ping-slow rounded-full bg-yellow" /> within 60 days
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-cream" /> later
              </span>
            </div>
          </WorldMap>
        </div>

        <div className="order-1 space-y-2.5 lg:order-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          {items.length === 0 ? (
            <Empty>Nothing in that window. Widen the range or clear the format.</Empty>
          ) : (
            items.map((e) => {
              const d = daysUntil(e.starts, TODAY);
              return (
                <Card key={e.id} active={selected === e.id} onClick={() => setSelected(selected === e.id ? null : e.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Tag tone="yellow">{e.format}</Tag>
                        {d >= 0 && d <= 60 && <Tag tone="alert">in {d}d</Tag>}
                        {d < 0 && <Tag>past</Tag>}
                      </div>
                      <h3 className="text-base leading-snug font-semibold">{e.name}</h3>
                      <p className="text-xs text-dim">
                        {e.place.city}, {e.place.country}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-lg border border-line-soft px-3 py-1.5 text-center">
                      <div className="text-xs font-semibold whitespace-nowrap text-cream">{fmtRange(e.starts, e.ends)}</div>
                      <div className="mt-0.5 text-[10px] tracking-wider text-dim uppercase">dates</div>
                    </div>
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{e.blurb}</p>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line-soft pt-3 text-xs">
                    <div>
                      <dt className="text-[10px] tracking-wider text-dim uppercase">Attendees</dt>
                      <dd className="text-cream/85">{e.attendees}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] tracking-wider text-dim uppercase">Ticket</dt>
                      <dd className="text-cream/85">{e.ticket}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] tracking-wider text-dim uppercase">Who is there</dt>
                      <dd className="text-cream/85">{e.crowd}</dd>
                    </div>
                  </dl>

                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(ev) => ev.stopPropagation()}
                    className="mt-3 inline-block rounded-lg border border-yellow/40 px-3 py-1.5 text-[11px] font-bold text-yellow transition hover:bg-yellow/10"
                  >
                    Event page ↗
                  </a>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
