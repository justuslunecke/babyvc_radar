import type { ReactNode } from "react";

export function Card({ children, className = "", onClick, active }: {
  children: ReactNode; className?: string; onClick?: () => void; active?: boolean;
}) {
  const interactive = onClick ? "cursor-pointer hover:border-yellow/35 hover:bg-ink-3" : "";
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-ink-2 p-4 transition ${interactive} ${
        active ? "border-yellow/60 bg-ink-3" : "border-line-soft"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Tag({ children, tone = "line" }: {
  children: ReactNode; tone?: "line" | "yellow" | "alert" | "solid";
}) {
  const tones = {
    line: "border-line-soft text-muted",
    yellow: "border-yellow/40 text-yellow",
    alert: "border-alert/50 text-alert",
    solid: "border-transparent bg-yellow text-black font-semibold",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-5 whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Filter pill. Deliberately square-ish so it reads differently from the round Tag. */
export function Pill({ children, active, onClick }: {
  children: ReactNode; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-yellow bg-yellow text-black"
          : "border-line-soft text-muted hover:border-yellow/40 hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

/** Page heading with the brand's hand-drawn swoosh underneath. */
export function PageHead({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="relative inline-block text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
          <span className="swoosh absolute -bottom-2 left-0 h-2 w-full opacity-90" aria-hidden />
        </h1>
        {/* Brand rule: body sits at roughly half the heading size. */}
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{sub}</p>
      </div>
      {right}
    </div>
  );
}

export function Stat({ value, label, tone = "cream" }: {
  value: ReactNode; label: string; tone?: "cream" | "yellow" | "alert";
}) {
  const c = tone === "yellow" ? "text-yellow" : tone === "alert" ? "text-alert" : "text-cream";
  return (
    <div className="rounded-xl border border-line-soft bg-ink-2 px-4 py-3">
      <div className={`text-2xl font-bold tabular-nums ${c}`}>{value}</div>
      <div className="mt-0.5 text-[11px] tracking-wider text-dim uppercase">{label}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-soft px-6 py-16 text-center text-sm text-dim">
      {children}
    </div>
  );
}

/** Growth figure with a sign and a colour. */
export function Growth({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`font-semibold tabular-nums ${up ? "text-yellow" : "text-alert"}`}>
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

export function fmtRange(a: string, b: string) {
  if (a === b) return fmtDate(a);
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  const sameMonth = da.getUTCMonth() === db.getUTCMonth() && da.getUTCFullYear() === db.getUTCFullYear();
  if (sameMonth) {
    return `${da.getUTCDate()}–${db.getUTCDate()} ${db.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}`;
  }
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

/** "3 days ago" style relative label, computed against a fixed reference. */
export function ago(iso: string, now = new Date()) {
  const d = Math.round((now.getTime() - new Date(iso + "T00:00:00Z").getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}

/** Days until a future date; negative once it has passed. */
export function daysUntil(iso: string, now = new Date()) {
  return Math.ceil((new Date(iso + "T00:00:00Z").getTime() - now.getTime()) / 86400000);
}
