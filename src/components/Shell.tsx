"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NEW_JOBS } from "@/data/jobs";
import { useHydrated, useWatchlist } from "@/lib/watchlist";
import IntroTour, { INTRO_OPEN_EVENT } from "@/components/IntroTour";

const TABS = [
  { href: "/radar", label: "Information", hint: "News, startups and funds" },
  { href: "/openings", label: "Career", hint: "Roles and warm paths in" },
  { href: "/calendar", label: "Opportunities", hint: "Events, workshops and programmes" },
];

function NavIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "Information") return <svg viewBox="0 0 24 24" aria-hidden className="size-5"><circle {...common} cx="12" cy="12" r="8" /><circle {...common} cx="12" cy="12" r="2" /><path {...common} d="M12 4v2M20 12h-2M12 20v-2M4 12h2" /></svg>;
  if (name === "Career") return <svg viewBox="0 0 24 24" aria-hidden className="size-5"><path {...common} d="M8 7V5h8v2M4 9h16v10H4zM4 13h16M10 13v2h4v-2" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden className="size-5"><rect {...common} x="4" y="5" width="16" height="15" rx="2" /><path {...common} d="M8 3v4M16 3v4M8 11h8M8 15h5" /></svg>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { ids } = useWatchlist();
  const hydrated = useHydrated();

  // Only count new roles at employers the user actually follows.
  const pinged = hydrated ? NEW_JOBS.filter((j) => ids.includes(j.employerId)).length : 0;

  return (
    <div className="grain flex h-[100dvh] flex-col overflow-hidden md:h-auto md:min-h-screen md:overflow-visible">
      <header className="sticky top-0 z-50 hidden border-b border-line-soft bg-ink/85 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-6 py-3">
          <Link href="/radar" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/brand/icon-square-yellow.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-md"
              priority
            />
            <span className="hidden leading-none sm:block">
              <Image src="/brand/wordmark-cream.png" alt="baby vc" width={96} height={29} className="h-[18px] w-auto" priority />
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.22em] text-yellow uppercase">radar</span>
            </span>
          </Link>

          <nav className="flex flex-1 items-center justify-center gap-0.5" aria-label="Main navigation">
            {TABS.map((t) => {
              const active = path.startsWith(t.href);
              const badge = t.href === "/openings" && pinged > 0;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  data-tour-target={t.label.toLowerCase()}
                  title={t.hint}
                  className={`relative shrink-0 px-3 py-2 text-sm font-medium transition ${
                    active ? "text-cream" : "text-dim hover:text-muted"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {t.label}
                    {badge && (
                      <span className="grid size-4 place-items-center rounded-full bg-alert text-[9px] font-bold text-black tabular-nums">
                        {pinged}
                      </span>
                    )}
                  </span>
                  {active && <span className="swoosh absolute -bottom-0.5 left-2 h-1.5 w-[calc(100%-1rem)]" aria-hidden />}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => window.dispatchEvent(new Event(INTRO_OPEN_EVENT))}
            className="hidden shrink-0 text-xs font-semibold text-muted underline decoration-line underline-offset-4 transition hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow md:block"
          >
            Start here
          </button>

          <a
            href="https://www.babyvc.co"
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 rounded-lg bg-yellow px-3.5 py-2 text-xs font-bold text-black transition hover:opacity-85 md:block"
          >
            babyvc.co
          </a>
        </div>
      </header>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line-soft bg-ink/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/radar" className="flex items-center gap-2" aria-label="baby vc radar information">
          <Image src="/brand/icon-square-yellow.png" alt="" width={28} height={28} className="size-7 rounded-md" priority />
          <span className="text-xs font-bold tracking-tight text-cream">baby vc <span className="text-yellow">radar</span></span>
        </Link>
        <span className="text-[10px] font-semibold tracking-[0.16em] text-dim uppercase">ecosystem guide</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:overflow-visible">
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-7 md:pb-7">{children}</main>

        <footer className="mt-6 border-t border-line-soft">
          <div className="overflow-hidden py-3 whitespace-nowrap">
            <div className="inline-block animate-marquee text-[11px] font-semibold tracking-[0.18em] text-yellow/15 uppercase">
              {Array(10).fill("baby vc · radar · funds · founders · openings · learning · network").join("  ·  ")}
            </div>
          </div>
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-[11px] text-dim sm:px-6">
            <span>
              Proof of concept. All records are static demo data, assembled by hand. No live scraping runs behind this build.
            </span>
            <span>baby vc · alumni tool</span>
          </div>
        </footer>
      </div>
      <nav className="relative z-50 shrink-0 border-t border-line-soft bg-ink px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(14,17,14,0.48)] md:hidden" aria-label="Main navigation">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {TABS.map((t) => {
            const active = path.startsWith(t.href);
            const badge = t.href === "/openings" && pinged > 0;
            return (
              <Link key={t.href} href={t.href} data-tour-target={t.label.toLowerCase()} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-yellow ${active ? "bg-yellow/10 text-yellow" : "text-dim hover:bg-ink-2 hover:text-muted"}`}>
                <span className="relative"><NavIcon name={t.label} />{badge && <span className="absolute -top-1.5 -right-2 grid size-3.5 place-items-center rounded-full bg-alert text-[8px] font-bold text-black">{pinged}</span>}</span>
                <span>{t.label}</span>
                {active && <span className="absolute -bottom-2 h-0.5 w-6 rounded-full bg-yellow" aria-hidden />}
              </Link>
            );
          })}
        </div>
      </nav>
      <IntroTour />
    </div>
  );
}
