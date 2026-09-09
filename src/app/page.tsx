"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, Growth, Tag, ago, daysUntil, fmtRange } from "@/components/ui";
import { JOBS, NEW_JOBS } from "@/data/jobs";
import { NEWS } from "@/data/news";
import { LEARNING } from "@/data/learning";
import { EVENTS } from "@/data/events";
import { VCS } from "@/data/vcs";
import { STARTUP_BY_ID } from "@/data/startups";
import { TODAY } from "@/lib/today";
import { useHydrated, useWatchlist } from "@/lib/watchlist";

/**
 * The briefing. No filters, no controls: this page answers "what changed and what
 * should I do about it" and then hands off to the tab that goes deeper.
 */
export default function TodayPage() {
  const { ids } = useWatchlist();
  const hydrated = useHydrated();

  const pinged = useMemo(
    () => (hydrated ? NEW_JOBS.filter((j) => ids.includes(j.employerId)) : []),
    [ids, hydrated],
  );

  const closing = useMemo(
    () =>
      LEARNING.filter((l) => {
        const d = daysUntil(l.deadline, TODAY);
        return d >= 0 && d <= 60;
      })
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 3),
    [],
  );

  const rounds = useMemo(() => [...NEWS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3), []);
  const roles = useMemo(() => NEW_JOBS.slice(0, 4), []);
  const soon = useMemo(
    () =>
      EVENTS.filter((e) => daysUntil(e.starts, TODAY) >= 0)
        .sort((a, b) => a.starts.localeCompare(b.starts))
        .slice(0, 3),
    [],
  );

  /** Funds with an alum inside that are also hiring: the warmest possible intro. */
  const warm = useMemo(() => {
    const hiring = new Set(JOBS.map((j) => j.employerId));
    return VCS.filter((v) => v.alumniInside && hiring.has(v.id)).slice(0, 6);
  }, []);

  const raisedTotal = NEWS.filter((n) => daysUntil(n.date, TODAY) >= -30).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section>
        <p className="text-[11px] tracking-[0.2em] text-dim uppercase">
          {TODAY.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
        </p>
        <h1 className="relative mt-2 inline-block text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
          Here&rsquo;s what moved
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {NEW_JOBS.length} new roles opened this week, {raisedTotal} companies raised in the last month, and{" "}
          {closing.length > 0 ? `applications close for ${closing[0].name} in ${daysUntil(closing[0].deadline, TODAY)} days` : "no deadlines are close"}.
        </p>
      </section>

      {/* Pings: the one personalised thing on the page */}
      {hydrated && pinged.length > 0 && (
        <section className="animate-rise rounded-xl border border-alert/40 bg-alert/[0.07] p-5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping-slow rounded-full bg-alert" />
              <span className="relative inline-flex size-2 rounded-full bg-alert" />
            </span>
            <h2 className="text-sm font-bold text-alert">
              {pinged.length} new {pinged.length === 1 ? "role" : "roles"} where you asked to be pinged
            </h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {pinged.map((j) => (
              <div key={j.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold text-cream">{j.title}</span>
                <span className="text-muted">at {j.employerName}</span>
                <span className="text-xs text-dim">· {j.place.city} · {ago(j.posted, TODAY)}</span>
              </div>
            ))}
          </div>
          <Link href="/openings" className="mt-3 inline-block text-xs font-semibold text-yellow underline underline-offset-4">
            Open all roles →
          </Link>
        </section>
      )}

      {hydrated && ids.length === 0 && (
        <section className="rounded-xl border border-dashed border-line-soft p-5">
          <h2 className="text-sm font-bold">Get pinged instead of checking</h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Follow a fund or company and any new role they post shows up here first, before you go looking for it.
          </p>
          <Link href="/openings" className="mt-3 inline-block rounded-lg bg-yellow px-3.5 py-2 text-xs font-bold text-black transition hover:opacity-85">
            Pick who to follow
          </Link>
        </section>
      )}

      {/* Four briefing columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Closing soon" href="/calendar" cta="All programmes">
          {closing.map((l) => {
            const d = daysUntil(l.deadline, TODAY);
            return (
              <Item key={l.id} title={l.name} meta={`${l.host} · ${l.place.city}`}>
                <Tag tone={d <= 21 ? "alert" : "line"}>{d === 0 ? "today" : `${d}d left`}</Tag>
              </Item>
            );
          })}
        </Panel>

        <Panel title="Just raised" href="/signals" cta="All rounds">
          {rounds.map((n) => {
            const s = n.startupId ? STARTUP_BY_ID.get(n.startupId) : undefined;
            return (
              <Item key={n.id} title={n.startupName} meta={`${n.round} · ${n.place.city} · ${ago(n.date, TODAY)}`}>
                <div className="text-right">
                  <div className="text-sm font-bold text-yellow">{n.amount}</div>
                  {s && <div className="text-[10px] text-dim">{<Growth value={s.growth6m} />} 6mo</div>}
                </div>
              </Item>
            );
          })}
        </Panel>

        <Panel title="New this week" href="/openings" cta="All openings">
          {roles.map((j) => (
            <Item key={j.id} title={j.title} meta={`${j.employerName} · ${j.place.city}`}>
              <Tag tone={j.employerKind === "vc" ? "line" : "yellow"}>{j.employerKind === "vc" ? "Fund" : "Company"}</Tag>
            </Item>
          ))}
        </Panel>

        <Panel title="Next up" href="/calendar?view=events" cta="All events">
          {soon.map((e) => (
            <Item key={e.id} title={e.name} meta={`${e.place.city} · ${fmtRange(e.starts, e.ends)}`}>
              <Tag tone={daysUntil(e.starts, TODAY) <= 30 ? "alert" : "line"}>in {daysUntil(e.starts, TODAY)}d</Tag>
            </Item>
          ))}
        </Panel>
      </div>

      {/* Alumni inside */}
      <section className="rounded-xl border border-yellow/25 bg-yellow/[0.04] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Alumni inside</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              These funds have a baby vc alum on the team and an open role right now. Ask in the community
              channel before you apply cold, a warm intro from inside is worth more than a good cover letter.
            </p>
          </div>
          <Link href="/radar" className="text-xs font-semibold text-yellow underline underline-offset-4">
            See every fund →
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {warm.map((v) => {
            const open = JOBS.filter((j) => j.employerId === v.id).length;
            return (
              <Link
                key={v.id}
                href={`/radar?focus=${v.id}`}
                className="rounded-lg border border-yellow/30 bg-ink-2 px-3 py-2 transition hover:border-yellow/60"
              >
                <div className="text-sm font-semibold">{v.name}</div>
                <div className="text-[11px] text-dim">
                  {v.place.city} · {open} open {open === 1 ? "role" : "roles"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <Card className="!p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        <Link href={href} className="text-[11px] font-semibold text-yellow underline underline-offset-4">
          {cta} →
        </Link>
      </div>
      <div className="divide-y divide-line-soft">{children}</div>
    </Card>
  );
}

function Item({ title, meta, children }: { title: string; meta: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-[11px] text-dim">{meta}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
