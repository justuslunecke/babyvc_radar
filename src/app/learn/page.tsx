"use client";

import { useMemo, useState } from "react";
import WorldMap, { type MapPin } from "@/components/WorldMap";
import { Card, Empty, PageHead, Pill, Stat, Tag, daysUntil, fmtDate } from "@/components/ui";
import { LEARNING } from "@/data/learning";
import type { LearningFormat } from "@/data/types";

const FORMATS: LearningFormat[] = ["Bootcamp", "Fellowship", "Course", "Summer school", "Accelerator"];
const FOCUS = ["VC", "Founding", "Both"] as const;
const TODAY = new Date("2026-09-09T00:00:00Z");

export default function LearnPage() {
  const [format, setFormat] = useState<LearningFormat | null>(null);
  const [focus, setFocus] = useState<(typeof FOCUS)[number] | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [babyOnly, setBabyOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(
    () =>
      LEARNING.filter(
        (l) =>
          (!format || l.format === format) &&
          (!focus || l.focus === focus || (focus !== "Both" && l.focus === "Both")) &&
          (!openOnly || daysUntil(l.deadline, TODAY) >= 0) &&
          (!babyOnly || l.isBabyVc),
      ).sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [format, focus, openOnly, babyOnly],
  );

  const pins: MapPin[] = useMemo(
    () =>
      items.map((l) => ({
        id: l.id,
        coords: l.place.coords,
        tone: l.isBabyVc ? "yellow" : "cream",
        weight: l.isBabyVc ? 0.9 : 0.45,
        label: l.name,
        pulse: l.isBabyVc,
      })),
    [items],
  );

  const closingSoon = LEARNING.filter((l) => {
    const d = daysUntil(l.deadline, TODAY);
    return d >= 0 && d <= 45;
  }).length;

  return (
    <>
      <PageHead
        title="Learn"
        sub="Bootcamps, fellowships and courses worth the time, for people going into venture or starting something. Sorted by application deadline, closest first."
        right={
          <div className="flex gap-2">
            <Stat value={closingSoon} label="closing in 45d" tone="alert" />
            <Stat value={LEARNING.length} label="programmes" />
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
        {FOCUS.map((f) => (
          <Pill key={f} active={focus === f} onClick={() => setFocus(focus === f ? null : f)}>
            {f === "Both" ? "VC + Founding" : f}
          </Pill>
        ))}
        <span className="mx-1 h-5 w-px bg-line-soft" />
        <Pill active={openOnly} onClick={() => setOpenOnly((v) => !v)}>Applications open</Pill>
        <Pill active={babyOnly} onClick={() => setBabyOnly((v) => !v)}>baby vc only</Pill>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="order-2 h-[40vh] min-h-[300px] lg:order-1 lg:sticky lg:top-24 lg:h-[calc(100vh-9rem)]">
          <WorldMap pins={pins} selectedId={selected} onSelect={setSelected} focus="world">
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-yellow" /> baby vc programme
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-cream" /> everything else
              </span>
            </div>
          </WorldMap>
        </div>

        <div className="order-1 space-y-2.5 lg:order-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          {items.length === 0 ? (
            <Empty>Nothing matches. Try widening the format or focus.</Empty>
          ) : (
            items.map((l) => {
              const d = daysUntil(l.deadline, TODAY);
              const closed = d < 0;
              return (
                <Card key={l.id} active={selected === l.id} onClick={() => setSelected(selected === l.id ? null : l.id)}>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {l.isBabyVc && <Tag tone="solid">baby vc</Tag>}
                    <Tag tone="yellow">{l.format}</Tag>
                    <Tag>{l.focus === "Both" ? "VC + Founding" : l.focus}</Tag>
                    {closed ? (
                      <Tag>closed</Tag>
                    ) : d <= 45 ? (
                      <Tag tone="alert">{d === 0 ? "closes today" : `${d}d to apply`}</Tag>
                    ) : null}
                  </div>

                  <h3 className="text-base leading-snug font-semibold">{l.name}</h3>
                  <p className="text-xs text-dim">
                    {l.host} · {l.place.city}, {l.place.country}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{l.blurb}</p>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line-soft pt-3 text-xs">
                    <Row label="Starts" value={fmtDate(l.starts)} />
                    <Row label="Deadline" value={fmtDate(l.deadline)} alert={!closed && d <= 45} />
                    <Row label="Format" value={l.duration} />
                    <Row label="Cost" value={l.cost} />
                    <Row label="Selectivity" value={l.selectivity} />
                  </dl>

                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-block rounded-lg border border-yellow/40 px-3 py-1.5 text-[11px] font-bold text-yellow transition hover:bg-yellow/10"
                  >
                    Programme page ↗
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

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wider text-dim uppercase">{label}</dt>
      <dd className={alert ? "text-alert" : "text-cream/85"}>{value}</dd>
    </div>
  );
}
