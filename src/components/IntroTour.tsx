"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "bvc-radar:intro-seen";
const OPEN_EVENT = "bvc-radar:open-intro";

type Step = { eyebrow: string; title: string; body: string; detail: string; href: string; cta: string };

const STEPS: Step[] = [
  { eyebrow: "01 / See the landscape", title: "Who is building, investing and growing?", body: "The Radar puts European funds and companies in one place. Search a city, filter by sector or stage, then sort companies by six-month team growth.", detail: "Use it to move from ‘I have heard of them’ to a focused shortlist of people worth knowing.", href: "/radar", cta: "Open the Radar" },
  { eyebrow: "02 / Follow the money", title: "A raise is usually a signal.", body: "Signals turns funding news into something useful: who raised, who backed them, and which companies may be about to hire.", detail: "It is the quick answer to: what changed in the ecosystem while I was busy?", href: "/signals", cta: "See funding signals" },
  { eyebrow: "03 / Find a way in", title: "Jobs, internships and warmer paths to apply.", body: "Openings brings VC and startup roles together, from investment internships to operating roles at companies such as Bending Spoons.", detail: "Follow an employer to surface new roles. On the Radar, ‘alum inside’ shows where the baby vc network may make a conversation easier.", href: "/openings", cta: "Browse openings" },
  { eyebrow: "04 / Get in the room", title: "Know what is worth leaving your desk for.", body: "Calendar combines fellowships, workshops and ecosystem events, including First Ascent, Plug and Play and Bits & Pretzels. Filter by city, type and deadline.", detail: "If baby vc ran the Radar, its bootcamps, people and opportunities would be surfaced here too.", href: "/calendar", cta: "Explore the calendar" },
];

export const INTRO_OPEN_EVENT = OPEN_EVENT;

export default function IntroTour() {
  const seen = useSyncExternalStore(
    () => () => {},
    () => {
      try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
    },
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);
  const [openedManually, setOpenedManually] = useState(false);
  const [step, setStep] = useState(-1);
  const close = () => {
    setDismissed(true);
    setOpenedManually(false);
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* storage is optional */ }
  };

  useEffect(() => {
    const show = () => { setStep(-1); setDismissed(false); setOpenedManually(true); };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  const open = openedManually || (!dismissed && !seen);
  if (!open) return null;
  const intro = step === -1;
  const current = intro ? null : STEPS[step];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/78 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-yellow/25 bg-ink-2 p-6 shadow-2xl sm:p-9">
        <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-[7rem] border-b border-l border-yellow/15 bg-yellow/[0.035]" aria-hidden />
        <button onClick={close} className="absolute top-4 right-4 z-10 rounded-lg px-2 py-1 text-xs font-semibold text-dim transition hover:bg-ink-3 hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow" aria-label="Close introduction">Skip ×</button>
        {intro ? (
          <div className="max-w-xl animate-rise">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-yellow uppercase">baby vc radar / proof of concept</p>
            <h1 id="intro-title" className="mt-4 text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">A clearer way into venture and startups.</h1>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
              <p className="text-cream">Thank you for taking the time to check this out.</p>
              <p>Venture can feel opaque from the outside. It is hard to know what is happening, where to apply, who is growing, or which event is actually worth attending.</p>
              <p>I built this as a first version of a radar that makes those opportunities easier to see. I would love to develop it alongside baby vc.</p>
            </div>
            <p className="mt-6 border-l-2 border-yellow/60 pl-3 text-xs leading-relaxed text-dim">For this application, every listing is hand-curated demo data. The experience is the proposal: a useful, living entry point for the ecosystem.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button onClick={() => setStep(0)} className="rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2 focus:ring-offset-ink-2">Take the 45-second tour</button>
              <button onClick={close} className="text-sm font-semibold text-muted underline decoration-line underline-offset-4 transition hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow">I&apos;ll explore myself</button>
            </div>
          </div>
        ) : current ? (
          <div className="animate-rise max-w-xl">
            <div className="flex items-center gap-2" aria-label={`Tour step ${step + 1} of ${STEPS.length}`}>{STEPS.map((_, index) => <span key={index} className={`h-1.5 w-7 rounded-full ${index <= step ? "bg-yellow" : "bg-line-soft"}`} />)}</div>
            <p className="mt-7 text-[11px] font-semibold tracking-[0.2em] text-yellow uppercase">{current.eyebrow}</p>
            <h2 id="intro-title" className="mt-4 text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">{current.title}</h2>
            <p className="mt-6 text-sm leading-relaxed text-muted sm:text-base">{current.body}</p>
            <div className="mt-5 rounded-xl border border-line-soft bg-ink p-4 text-sm leading-relaxed text-cream/85">{current.detail}</div>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={current.href} onClick={close} className="rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2 focus:ring-offset-ink-2">{current.cta} →</Link>
              {step < STEPS.length - 1 ? <button onClick={() => setStep((s) => s + 1)} className="text-sm font-semibold text-muted underline decoration-line underline-offset-4 transition hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow">Next section</button> : <button onClick={close} className="text-sm font-semibold text-muted underline decoration-line underline-offset-4 transition hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow">Start exploring</button>}
              <button onClick={() => setStep((s) => s - 1)} className="ml-auto text-xs font-semibold text-dim transition hover:text-cream focus:outline-none focus:ring-2 focus:ring-yellow">Back</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
