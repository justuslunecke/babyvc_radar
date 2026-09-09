"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorldMap, { type MapItem } from "@/components/WorldMap";
import { FilterBar, Segmented } from "@/components/filters";
import { Card, Empty, Tag, daysUntil, fmtDate, fmtRange } from "@/components/ui";
import { LEARNING } from "@/data/learning";
import { EVENTS } from "@/data/events";
import type { Learning, NetworkEvent, Place } from "@/data/types";
import { TODAY } from "@/lib/today";

type Kind = "all" | "learn" | "event";

/**
 * One chronology instead of two near-identical tabs. A bootcamp and a conference are
 * the same shape of decision: a place, a date, and whether it is worth the trip.
 */
type Entry = {
  id: string;
  kind: "learn" | "event";
  name: string;
  host: string;
  place: Place;
  /** The date that actually forces a decision: a deadline, or the event itself. */
  keyDate: string;
  keyLabel: string;
  when: string;
  format: string;
  url: string;
  blurb: string;
  highlight: boolean;
  learn?: Learning;
  event?: NetworkEvent;
};

const LEARN_FORMATS = ["Bootcamp", "Fellowship", "Course", "Summer school", "Accelerator"];
const EVENT_FORMATS = ["Conference", "Summit", "Fair", "Demo day", "Meetup"];

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarView />
    </Suspense>
  );
}

function CalendarView() {
  const params = useSearchParams();
  // Deep link from Today: /calendar?view=events. Read once at mount.
  const [kind, setKind] = useState<Kind>(() => {
    const v = params.get("view");
    return v === "events" ? "event" : v === "learn" ? "learn" : "all";
  });
  const [format, setFormat] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [babyOnly, setBabyOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [city, setCity] = useState<string | null>(null);

  const entries: Entry[] = useMemo(() => {
    const l: Entry[] = LEARNING.map((x) => ({
      id: x.id,
      kind: "learn",
      name: x.name,
      host: x.host,
      place: x.place,
      keyDate: x.deadline,
      keyLabel: "apply by",
      when: `Starts ${fmtDate(x.starts)} · ${x.duration}`,
      format: x.format,
      url: x.url,
      blurb: x.blurb,
      highlight: !!x.isBabyVc,
      learn: x,
    }));
    const e: Entry[] = EVENTS.map((x) => ({
      id: x.id,
      kind: "event",
      name: x.name,
      host: x.place.city,
      place: x.place,
      keyDate: x.starts,
      keyLabel: "happens",
      when: fmtRange(x.starts, x.ends),
      format: x.format,
      url: x.url,
      blurb: x.blurb,
      highlight: x.name.toLowerCase().startsWith("baby vc"),
      event: x,
    }));
    return [...l, ...e];
  }, []);

  const countries = useMemo(() => [...new Set(entries.map((e) => e.place.country))].sort(), [entries]);
  const formats = kind === "learn" ? LEARN_FORMATS : kind === "event" ? EVENT_FORMATS : [...LEARN_FORMATS, ...EVENT_FORMATS];

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      entries
        .filter((e) => {
          const days = daysUntil(e.keyDate, TODAY);
          const isFree = e.learn
            ? /free/i.test(e.learn.cost)
            : e.event
              ? /free/i.test(e.event.ticket)
              : false;
          return (
            (kind === "all" || e.kind === kind) &&
            (!format || e.format === format) &&
            (!country || e.place.country === country) &&
            (!openOnly || days >= 0) &&
            (!babyOnly || e.highlight) &&
            (!freeOnly || isFree) &&
            (!city || e.place.city === city) &&
            (!q || e.name.toLowerCase().includes(q) || e.place.city.toLowerCase().includes(q) || e.host.toLowerCase().includes(q))
          );
        })
        .sort((a, b) => a.keyDate.localeCompare(b.keyDate)),
    [entries, kind, format, country, openOnly, babyOnly, freeOnly, city, q],
  );

  const items: MapItem[] = useMemo(
    () =>
      rows.map((e) => {
        const d = daysUntil(e.keyDate, TODAY);
        return {
          id: e.id,
          city: e.place.city,
          coords: e.place.coords,
          tone: e.highlight ? "yellow" : d >= 0 && d <= 45 ? "alert" : "cream",
          label: e.name,
          pulse: e.highlight,
        } as MapItem;
      }),
    [rows],
  );

  return (
    <>
      <header className="mb-6">
        <h1 className="relative inline-block text-4xl font-bold tracking-tight sm:text-5xl">
          Calendar
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Bootcamps, courses, conferences and fairs in one timeline, ordered by the date that actually
          matters: when you have to apply, or when to show up.
        </p>
      </header>

      <FilterBar
        primary={
          <Segmented<Kind>
            options={[["all", "Everything"], ["learn", "Learning"], ["event", "Events"]]}
            value={kind}
            onChange={(k) => { setKind(k); setFormat(null); }}
          />
        }
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search a programme, event or city…"
        groups={[
          { key: "format", label: "Type", options: formats, value: format, onChange: setFormat },
          { key: "country", label: "Country", options: countries, value: country, onChange: setCountry },
        ]}
        toggles={[
          { key: "open", label: "Still open", value: openOnly, onChange: setOpenOnly },
          { key: "free", label: "Free", value: freeOnly, onChange: setFreeOnly },
          { key: "baby", label: "baby vc only", value: babyOnly, onChange: setBabyOnly },
        ]}
        resultCount={rows.length}
        resultNoun={kind === "learn" ? "programmes" : kind === "event" ? "events" : "entries"}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowMap((v) => !v)}
          className="rounded-lg border border-line-soft px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-yellow/40 hover:text-cream"
        >
          {showMap ? "Hide map" : "Show on map"}
        </button>
        {city && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow/40 py-1 pr-1.5 pl-2.5 text-[11px] text-yellow">
            {city}
            <button onClick={() => setCity(null)} aria-label="Clear city" className="grid size-4 place-items-center rounded-full hover:bg-yellow hover:text-black">×</button>
          </span>
        )}
      </div>

      {showMap && (
        <div className="animate-rise mb-5 h-[44vh] min-h-[320px]">
          <WorldMap items={items} selectedCity={city} onPickCity={setCity}>
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-yellow" /> baby vc</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-alert" /> within 45 days</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-cream" /> later</span>
            </div>
          </WorldMap>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty>Nothing matches. Try clearing a filter or switching to Everything.</Empty>
      ) : (
        <div className="space-y-2.5">
          {rows.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </div>
      )}
    </>
  );
}

function Entry({ entry: e }: { entry: Entry }) {
  const [open, setOpen] = useState(false);
  const d = daysUntil(e.keyDate, TODAY);
  const past = d < 0;

  return (
    <Card active={open} onClick={() => setOpen((v) => !v)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {e.highlight && <Tag tone="solid">baby vc</Tag>}
            <Tag tone={e.kind === "learn" ? "yellow" : "line"}>{e.format}</Tag>
            {past ? <Tag>closed</Tag> : d <= 45 ? <Tag tone="alert">{d === 0 ? "today" : `${d}d`}</Tag> : null}
          </div>
          <h2 className="text-base leading-snug font-semibold">{e.name}</h2>
          <p className="text-xs text-dim">{e.host} · {e.place.city}, {e.place.country}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{e.blurb}</p>
        </div>

        <div className="shrink-0 rounded-lg border border-line-soft px-3 py-2 text-center">
          <div className="text-[10px] tracking-wider text-dim uppercase">{e.keyLabel}</div>
          <div className={`mt-0.5 text-xs font-semibold whitespace-nowrap ${!past && d <= 45 ? "text-alert" : "text-cream"}`}>
            {fmtDate(e.keyDate)}
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line-soft pt-3 text-xs sm:grid-cols-4">
          <Fact label="When" value={e.when} />
          {e.learn && <Fact label="Cost" value={e.learn.cost} />}
          {e.learn && <Fact label="How hard to get in" value={e.learn.selectivity} />}
          {e.learn && <Fact label="For" value={e.learn.focus === "Both" ? "VC + founding" : e.learn.focus} />}
          {e.event && <Fact label="Ticket" value={e.event.ticket} />}
          {e.event && <Fact label="Size" value={e.event.attendees} />}
          {e.event && <Fact label="Who's there" value={e.event.crowd} />}
          <div className="col-span-2 sm:col-span-4">
            <a
              href={e.url}
              target="_blank"
              rel="noreferrer"
              onClick={(ev) => ev.stopPropagation()}
              className="mt-1 inline-block rounded-lg border border-yellow/40 px-3 py-1.5 text-[11px] font-bold text-yellow transition hover:bg-yellow/10"
            >
              {e.kind === "learn" ? "Programme page" : "Event page"} ↗
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-wider text-dim uppercase">{label}</div>
      <div className="text-cream/85">{value}</div>
    </div>
  );
}
