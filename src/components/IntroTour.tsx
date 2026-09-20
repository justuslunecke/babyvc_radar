"use client";

import { useEffect, useState } from "react";

const OPEN_EVENT = "bvc-radar:open-intro";

type Step = { target: string; label: string; title: string; body: string };

const STEPS: Step[] = [
  { target: "information", label: "Information", title: "See what is going on.", body: "Start with top news, then explore startups or funds. Filter by location, sector, stage, funding and growth." },
  { target: "career", label: "Career", title: "Find a way in.", body: "See VC and startup roles, from internships to full-time jobs. Look for places that are hiring now or have a baby vc alum inside." },
  { target: "opportunities", label: "Opportunities", title: "Know where to show up.", body: "Find events, workshops, bootcamps and fellowships. Filter by location, time and type." },
];

export const INTRO_OPEN_EVENT = OPEN_EVENT;

export default function IntroTour() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const show = () => { setStep(-1); setOpen(true); };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  if (!open) return null;
  const intro = step === -1;
  const current = intro ? null : STEPS[step];
  const final = step === STEPS.length - 1;

  return (
    <div className={`fixed inset-0 z-[70] ${intro ? "grid place-items-center p-4" : ""}`} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="absolute inset-0 bg-ink/55" aria-hidden />
      {current && <div className={`tutorial-target tutorial-target-${current.target}`} aria-hidden />}
      <section className={`tutorial-bubble relative w-full border border-yellow/30 bg-ink-2 p-5 shadow-2xl sm:p-6 ${intro ? "max-w-xl rounded-2xl" : "mx-4 max-w-sm rounded-xl"}`}>
        {intro ? (
          <div className="animate-rise">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-yellow uppercase">baby vc radar</p>
            <h1 id="intro-title" className="mt-3 max-w-md text-3xl leading-[1.04] font-bold tracking-tight text-balance sm:text-4xl">This is a proof of concept.</h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">Hey, thanks for scanning this. I made it because venture can feel pretty closed-off when you are looking in from the outside. I wanted to make it easier to see what is actually going on.</p>
            <p className="mt-4 text-xs leading-relaxed text-dim">The data is hand-picked for this application. The idea is a real, useful home for the whole ecosystem.</p>
            <button onClick={() => setStep(0)} className="mt-6 rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2 focus:ring-offset-ink-2">Show me around</button>
          </div>
        ) : current ? (
          <div className="animate-rise">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-yellow uppercase">{step + 1} / {STEPS.length} · {current.label}</p>
            <h2 id="intro-title" className="mt-2 text-2xl leading-tight font-bold tracking-tight">{current.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{current.body}</p>
            <p className="mt-4 hidden text-[11px] font-semibold text-yellow md:block">↑ Find {current.label} in the top bar</p>
            <p className="mt-4 text-[11px] font-semibold text-yellow md:hidden">↓ Find {current.label} in the bottom bar</p>
            <button onClick={() => final ? setOpen(false) : setStep((s) => s + 1)} className="mt-5 rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2 focus:ring-offset-ink-2">{final ? "Got it, let me look around" : "Next"}</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
