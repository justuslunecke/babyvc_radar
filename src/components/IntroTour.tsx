"use client";

import { useEffect, useRef, useState } from "react";

const OPEN_EVENT = "bvc-radar:open-intro";

type Step = { target: string | null; label: string; title: string; body: string; ideas?: string[] };

const STEPS: Step[] = [
  { target: "information", label: "Information", title: "See what is going on.", body: "Start with top news, then explore startups or funds. Filter by location, sector, stage, funding and growth." },
  { target: "career", label: "Career", title: "Find a way in.", body: "See VC and startup roles, from internships to full-time jobs. Look for places that are hiring now or have a baby vc alum inside." },
  { target: "opportunities", label: "Opportunities", title: "Know where to show up.", body: "Find events, workshops, bootcamps and fellowships. Filter by location, time and type." },
  { target: null, label: "Feature ideas", title: "Where this could go next.", body: "A few things I would be excited to add once this is real:", ideas: ["Opt in to news from the companies you care about", "Get a heads-up when a fitting opening appears", "Celebrate alumni moves, new roles and funding wins", "Save a personal shortlist of people, places and events"] },
  { target: null, label: "Thank you", title: "Thank you for your time.", body: "I would genuinely love to build this with baby vc. I think it could make the network more useful for alumni, fellows and anyone trying to find their way in." },
];

export const INTRO_OPEN_EVENT = OPEN_EVENT;

export default function IntroTour() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(-1);
  const targetOutline = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLElement>(null);

  useEffect(() => {
    const show = () => { setStep(-1); setOpen(true); };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    const bubbleNode = bubble.current;
    if (!open || step < 0 || !STEPS[step]?.target) {
      bubbleNode?.removeAttribute("style");
      return;
    }
    const align = () => {
      const target = [...document.querySelectorAll(`[data-tour-target="${STEPS[step].target}"]`)].find((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      });
      const outline = targetOutline.current;
      if (!target || !outline || !bubble.current) return;
      const box = target.getBoundingClientRect();
      Object.assign(outline.style, {
        left: `${box.left - 4}px`, top: `${box.top - 4}px`, width: `${box.width + 8}px`, height: `${box.height + 8}px`,
      });
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      Object.assign(bubble.current.style, mobile
        ? { top: "auto", bottom: `${window.innerHeight - box.top + 16}px`, left: "1rem", right: "auto", width: "calc(100% - 2rem)", transform: "none", maxWidth: "none" }
        : { top: `${box.bottom + 18}px`, bottom: "auto", left: "50%", right: "auto", transform: "translateX(-50%)", maxWidth: "24rem" },
      );
    };
    align();
    window.addEventListener("resize", align);
    window.addEventListener("scroll", align, true);
    return () => { window.removeEventListener("resize", align); window.removeEventListener("scroll", align, true); };
  }, [open, step]);

  if (!open) return null;
  const intro = step === -1;
  const current = intro ? null : STEPS[step];
  const final = step === STEPS.length - 1;

  return (
    <div className={`fixed inset-0 z-[70] ${intro ? "grid place-items-center p-4" : ""}`} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="absolute inset-0 bg-ink/55" aria-hidden />
      {current?.target && <div ref={targetOutline} className="tutorial-target" aria-hidden />}
      <section ref={bubble} className={`tutorial-bubble relative w-full border border-yellow/30 bg-ink-2 p-5 shadow-2xl sm:p-6 ${intro ? "max-w-xl rounded-2xl" : "max-w-sm rounded-xl"}`}>
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
            {current.ideas && <ul className="mt-4 space-y-2 border-l border-yellow/35 pl-3 text-xs leading-relaxed text-cream/85">{current.ideas.map((idea) => <li key={idea}>{idea}</li>)}</ul>}
            {current.target && <><p className="mt-4 hidden text-[11px] font-semibold text-yellow md:block">↑ Find {current.label} in the top bar</p><p className="mt-4 text-[11px] font-semibold text-yellow md:hidden">↓ Find {current.label} in the bottom bar</p></>}
            <button onClick={() => final ? setOpen(false) : setStep((s) => s + 1)} className="mt-5 rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2 focus:ring-offset-ink-2">{final ? "Got it, let me look around" : "Next"}</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
