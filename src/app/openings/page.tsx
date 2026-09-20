"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar, Segmented } from "@/components/filters";
import { Card, Empty, Tag, ago } from "@/components/ui";
import { JOBS, NEW_JOBS, jobStartDate } from "@/data/jobs";
import type { EntityKind, JobLevel } from "@/data/types";
import { VCS } from "@/data/vcs";
import { STARTUPS } from "@/data/startups";
import { TODAY } from "@/lib/today";
import { useHydrated, useWatchlist } from "@/lib/watchlist";

const LEVELS: JobLevel[] = ["Internship", "Analyst", "Associate", "Mid", "Senior", "Leadership"];
const START_WINDOWS = ["October", "November or later", "Next summer"];
const PAY_FLOORS = ["Listed pay", "80k+ listed", "100k+ listed"];
const ALUMNI_EMPLOYERS = new Set([...VCS, ...STARTUPS].filter((e) => e.alumniInside).map((e) => e.id));

function listedPay(job: (typeof JOBS)[number]) {
  const match = job.comp.match(/(?:€|£|SEK |DKK |NOK )(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

/** Everyone with at least one open role, for the follow picker. */
const EMPLOYERS = [...VCS, ...STARTUPS]
  .filter((e) => JOBS.some((j) => j.employerId === e.id))
  .map((e) => ({ id: e.id, name: e.name, kind: e.kind as EntityKind }))
  .sort((a, b) => a.name.localeCompare(b.name));

type Kind = "all" | EntityKind;

export default function OpeningsPage() {
  const [kind, setKind] = useState<Kind>("all");
  const [level, setLevel] = useState<JobLevel | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [followedOnly, setFollowedOnly] = useState(false);
  const [alumniOnly, setAlumniOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState(false);
  const { ids, has, toggle } = useWatchlist();
  const ready = useHydrated();

  const teams = useMemo(() => [...new Set(JOBS.map((j) => j.team))].sort(), []);
  const pinged = useMemo(() => (ready ? NEW_JOBS.filter((j) => ids.includes(j.employerId)) : []), [ids, ready]);

  const q = query.trim().toLowerCase();
  const jobs = useMemo(
    () =>
      JOBS.filter(
        (j) =>
          (kind === "all" || j.employerKind === kind) &&
          (!level || j.level === level) &&
          (!team || j.team === team) &&
          (!start || (start === "October" ? jobStartDate(j) < "2026-11-01" && j.level !== "Internship" : start === "November or later" ? jobStartDate(j) >= "2026-11-01" && j.level !== "Internship" : j.level === "Internship")) &&
          (!pay || (pay === "Listed pay" ? listedPay(j) > 0 : pay === "80k+ listed" ? listedPay(j) >= 80 : listedPay(j) >= 100)) &&
          (!remoteOnly || j.remote) &&
          (!newOnly || j.isNew) &&
          (!followedOnly || ids.includes(j.employerId)) &&
          (!alumniOnly || ALUMNI_EMPLOYERS.has(j.employerId)) &&
          (!q || j.title.toLowerCase().includes(q) || j.employerName.toLowerCase().includes(q) || j.place.city.toLowerCase().includes(q)),
      ).sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.posted.localeCompare(a.posted)),
    [kind, level, team, start, pay, remoteOnly, newOnly, followedOnly, alumniOnly, ids, q],
  );

  return (
    <>
      <header className="mb-6">
        <h1 className="relative inline-block text-4xl font-bold tracking-tight sm:text-5xl">
          Career
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A cleaner way into the ecosystem: open roles, warm places to apply, and programmes worth knowing. Start with funds or companies, then narrow by timing, pay and fit.
        </p>
      </header>

      {ready && pinged.length > 0 && (
        <section className="animate-rise mb-5 rounded-xl border border-alert/40 bg-alert/[0.07] p-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping-slow rounded-full bg-alert" />
              <span className="relative inline-flex size-2 rounded-full bg-alert" />
            </span>
            <h2 className="text-sm font-bold text-alert">
              {pinged.length} new {pinged.length === 1 ? "role" : "roles"} where you asked to be pinged
            </h2>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {pinged.map((j) => (
              <div key={j.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold text-cream">{j.title}</span>
                <span className="text-muted">at {j.employerName}</span>
                <span className="text-xs text-dim">· {j.place.city} · {ago(j.posted, TODAY)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <FilterBar
        primary={
          <Segmented<Kind>
            options={[["all", "All roles"], ["vc", "At funds"], ["startup", "At companies"]]}
            value={kind}
            onChange={setKind}
          />
        }
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search a role, employer or city…"
        groups={[
          { key: "level", label: "Seniority", options: LEVELS, value: level, onChange: (v) => setLevel(v as JobLevel | null) },
          { key: "team", label: "Team", options: teams, value: team, onChange: setTeam },
          { key: "start", label: "Estimated start", options: START_WINDOWS, value: start, onChange: setStart },
          { key: "pay", label: "Salary", options: PAY_FLOORS, value: pay, onChange: setPay },
        ]}
        toggles={[
          { key: "new", label: "New this week", value: newOnly, onChange: setNewOnly },
          { key: "remote", label: "Remote", value: remoteOnly, onChange: setRemoteOnly },
          { key: "followed", label: "Only who I follow", value: followedOnly, onChange: setFollowedOnly },
          { key: "alumni", label: "Baby VC alum inside", value: alumniOnly, onChange: setAlumniOnly },
        ]}
        resultCount={jobs.length}
        resultNoun="roles"
      />

      <section className="mb-5 grid gap-3 rounded-xl border border-yellow/20 bg-yellow/[0.04] p-4 sm:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-yellow uppercase">Warm paths in</p>
          <h2 className="mt-1 text-base font-bold">Apply with context when an alum is inside.</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">The yellow “alum inside” tag means a Baby VC connection may be able to share context or point you to the right person before you apply.</p>
        </div>
        <Link href="/calendar?view=learn" className="rounded-lg border border-line-soft bg-ink-2 px-3 py-3 text-xs text-muted transition hover:border-yellow/40 hover:text-cream"><span className="block font-semibold text-cream">Accelerators & incubators</span><span className="mt-1 block">Also explore fellowships, accelerator cohorts and practical programmes →</span></Link>
      </section>

      {/* Follow picker, collapsed by default so it never competes with the listings. */}
      <div className="mb-5">
        <button
          onClick={() => setPicker((v) => !v)}
          className="rounded-lg border border-yellow/40 px-3 py-1.5 text-xs font-semibold text-yellow transition hover:bg-yellow/10"
        >
          {picker ? "Done" : "Choose who to follow"}
          {ready && ids.length > 0 ? ` (${ids.length})` : ""}
        </button>
        {picker && (
          <div className="animate-rise mt-3 max-h-56 overflow-y-auto rounded-xl border border-line-soft bg-ink-2 p-3">
            <p className="mb-2.5 text-[11px] text-dim">
              Following an employer keeps their new roles easy to spot here.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYERS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                    has(e.id) ? "border-yellow bg-yellow text-black" : "border-line-soft text-muted hover:border-yellow/40 hover:text-cream"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {jobs.length === 0 ? (
        <Empty>
          No roles match. Clear a filter, or{" "}
          <Link href="/radar" className="text-yellow underline underline-offset-4">browse the radar</Link> instead.
        </Empty>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-col">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {j.isNew && <Tag tone="alert">new</Tag>}
                  <Tag tone={j.employerKind === "vc" ? "line" : "yellow"}>{j.employerKind === "vc" ? "Fund" : "Company"}</Tag>
                  {j.remote && <Tag>Remote</Tag>}
                  {ALUMNI_EMPLOYERS.has(j.employerId) && <Tag tone="yellow">alum inside</Tag>}
                </div>
                <button
                  onClick={() => toggle(j.employerId)}
                  title={has(j.employerId) ? `Stop following ${j.employerName}` : `Follow ${j.employerName}`}
                  className={`shrink-0 text-base leading-none transition ${has(j.employerId) ? "text-yellow" : "text-dim hover:text-yellow"}`}
                  aria-label="Toggle follow"
                >
                  {has(j.employerId) ? "★" : "☆"}
                </button>
              </div>

              <h2 className="leading-snug font-semibold">{j.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{j.employerName}</p>

              <dl className="mt-3 space-y-1 text-xs text-dim">
                <Line k="Where" v={j.place.city} />
                <Line k="Team" v={j.team} />
                <Line k="Level" v={j.level} />
                <Line k="Pay" v={j.comp} />
                <Line k="Start" v={j.level === "Internship" ? "Next summer" : jobStartDate(j) === "2026-10-01" ? "October" : "November+"} />
              </dl>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3">
                <span className="text-[11px] text-dim">{ago(j.posted, TODAY)}</span>
                <a href={j.url} target="_blank" rel="noreferrer" className="rounded-lg bg-yellow px-3 py-1.5 text-[11px] font-bold text-black transition hover:opacity-85">
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

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{k}</dt>
      <dd className="text-right text-cream/80">{v}</dd>
    </div>
  );
}
