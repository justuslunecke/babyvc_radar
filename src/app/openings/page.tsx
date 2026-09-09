"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Empty, PageHead, Pill, Stat, Tag, ago } from "@/components/ui";
import { JOBS, NEW_JOBS } from "@/data/jobs";
import type { EntityKind, JobLevel } from "@/data/types";
import { VCS } from "@/data/vcs";
import { STARTUPS } from "@/data/startups";
import { useHydrated, useWatchlist } from "@/lib/watchlist";

const LEVELS: JobLevel[] = ["Internship", "Analyst", "Associate", "Mid", "Senior", "Leadership"];
const TODAY = new Date("2026-09-09T00:00:00Z");

/** Every employer that has at least one listing, for the watch picker. */
const EMPLOYERS = [...VCS, ...STARTUPS]
  .filter((e) => JOBS.some((j) => j.employerId === e.id))
  .map((e) => ({ id: e.id, name: e.name, kind: e.kind as EntityKind }));

type Kind = "all" | EntityKind;

export default function OpeningsPage() {
  const [kind, setKind] = useState<Kind>("all");
  const [level, setLevel] = useState<JobLevel | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { ids, has, toggle } = useWatchlist();
  const ready = useHydrated();

  const pinged = useMemo(() => NEW_JOBS.filter((j) => ids.includes(j.employerId)), [ids]);

  const q = query.trim().toLowerCase();
  const jobs = useMemo(() => {
    return JOBS.filter(
      (j) =>
        (kind === "all" || j.employerKind === kind) &&
        (!level || j.level === level) &&
        (!remoteOnly || j.remote) &&
        (!watchedOnly || ids.includes(j.employerId)) &&
        (!q ||
          j.title.toLowerCase().includes(q) ||
          j.employerName.toLowerCase().includes(q) ||
          j.place.city.toLowerCase().includes(q)),
    ).sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.posted.localeCompare(a.posted));
  }, [kind, level, remoteOnly, watchedOnly, ids, q]);

  return (
    <>
      <PageHead
        title="Openings"
        sub="Roles at every fund and company on the radar. Ping the ones you care about and new listings surface here first."
        right={
          <div className="flex gap-2">
            <Stat value={NEW_JOBS.length} label="new this week" tone="alert" />
            <Stat value={JOBS.length} label="open roles" />
            <Stat value={ready ? ids.length : "–"} label="pinged" tone="yellow" />
          </div>
        }
      />

      {/* The ping alert: the whole point of the watchlist. */}
      {ready && (
        <div className="mb-5">
          {pinged.length > 0 ? (
            <div className="animate-rise rounded-xl border border-alert/40 bg-alert/[0.07] p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-2 animate-ping-slow rounded-full bg-alert" />
                  <span className="relative inline-flex size-2 rounded-full bg-alert" />
                </span>
                <h2 className="text-sm font-bold text-alert">
                  {pinged.length} new {pinged.length === 1 ? "role" : "roles"} at companies you ping
                </h2>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {pinged.map((j) => (
                  <div key={j.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold text-cream">{j.title}</span>
                    <span className="text-muted">at {j.employerName}</span>
                    <span className="text-xs text-dim">
                      · {j.place.city} · {ago(j.posted, TODAY)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : ids.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-soft p-4 text-sm text-muted">
              You are not pinging anyone yet. Pick a fund or company below, or open a record on the{" "}
              <Link href="/" className="text-yellow underline underline-offset-4">
                radar
              </Link>{" "}
              and hit &ldquo;Ping me on new roles&rdquo;.
            </div>
          ) : (
            <div className="rounded-xl border border-line-soft bg-ink-2 p-4 text-sm text-muted">
              Watching {ids.length} {ids.length === 1 ? "employer" : "employers"}. Nothing new from them this week.
            </div>
          )}
        </div>
      )}

      {/* Watch picker */}
      <div className="mb-5">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="rounded-lg border border-yellow/40 px-3 py-1.5 text-xs font-semibold text-yellow transition hover:bg-yellow/10"
        >
          {showPicker ? "Hide" : "Manage"} pings {ready && ids.length > 0 ? `(${ids.length})` : ""}
        </button>
        {showPicker && (
          <div className="animate-rise mt-3 max-h-56 overflow-y-auto rounded-xl border border-line-soft bg-ink-2 p-3">
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYERS.map((e) => (
                <Pill key={e.id} active={has(e.id)} onClick={() => toggle(e.id)}>
                  {e.name}
                </Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-line-soft p-1">
          {(["all", "vc", "startup"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                kind === k ? "bg-yellow text-black" : "text-dim hover:text-cream"
              }`}
            >
              {k === "all" ? "All" : k === "vc" ? "At funds" : "At companies"}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search role, employer or city…"
          className="w-60 rounded-lg border border-line-soft bg-ink-2 px-3 py-2 text-xs text-cream outline-none placeholder:text-dim focus:border-yellow/50"
        />
        <Pill active={remoteOnly} onClick={() => setRemoteOnly((v) => !v)}>Remote</Pill>
        <Pill active={watchedOnly} onClick={() => setWatchedOnly((v) => !v)}>Only pinged</Pill>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => (
            <Pill key={l} active={level === l} onClick={() => setLevel(level === l ? null : l)}>
              {l}
            </Pill>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <Empty>No roles match those filters.</Empty>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-col">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {j.isNew && <Tag tone="alert">new</Tag>}
                  <Tag tone={j.employerKind === "vc" ? "line" : "yellow"}>
                    {j.employerKind === "vc" ? "Fund" : "Company"}
                  </Tag>
                  {j.remote && <Tag>Remote</Tag>}
                </div>
                <button
                  onClick={() => toggle(j.employerId)}
                  title={has(j.employerId) ? "Stop pinging this employer" : "Ping me on new roles here"}
                  className={`shrink-0 text-base leading-none transition ${
                    has(j.employerId) ? "text-yellow" : "text-dim hover:text-yellow"
                  }`}
                  aria-label="Toggle ping"
                >
                  {has(j.employerId) ? "★" : "☆"}
                </button>
              </div>

              <h3 className="leading-snug font-semibold">{j.title}</h3>
              <p className="mt-0.5 text-sm text-muted">{j.employerName}</p>

              <dl className="mt-3 space-y-1 text-xs text-dim">
                <div className="flex justify-between gap-2">
                  <dt>Location</dt>
                  <dd className="text-cream/80">{j.place.city}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Team</dt>
                  <dd className="text-cream/80">{j.team}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Level</dt>
                  <dd className="text-cream/80">{j.level}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Comp</dt>
                  <dd className="text-cream/80">{j.comp}</dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-3">
                <span className="text-[11px] text-dim">{ago(j.posted, TODAY)}</span>
                <a
                  href={j.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-yellow px-3 py-1.5 text-[11px] font-bold text-black transition hover:opacity-85"
                >
                  Apply ↗
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
