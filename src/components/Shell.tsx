"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NEW_JOBS } from "@/data/jobs";
import { useHydrated, useWatchlist } from "@/lib/watchlist";

const TABS = [
  { href: "/", label: "Radar", hint: "Funds and companies on the map" },
  { href: "/signals", label: "Signals", hint: "Who just raised" },
  { href: "/openings", label: "Openings", hint: "Roles at funds and companies" },
  { href: "/learn", label: "Learn", hint: "Bootcamps and courses" },
  { href: "/network", label: "Network", hint: "Fairs, summits and demo days" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { ids } = useWatchlist();
  const hydrated = useHydrated();

  // Only count new roles at employers the user actually follows.
  const pinged = hydrated ? NEW_JOBS.filter((j) => ids.includes(j.employerId)).length : 0;

  return (
    <div className="grain flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line-soft bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
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

          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
              const badge = t.href === "/openings" && pinged > 0;
              return (
                <Link
                  key={t.href}
                  href={t.href}
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

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 sm:px-6">{children}</main>

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
  );
}
