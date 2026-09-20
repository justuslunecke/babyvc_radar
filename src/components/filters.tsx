"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type SelectGroup = {
  key: string;
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
};

export type ToggleFilter = {
  key: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

/**
 * The one always-visible control on a view. Keep it to 2–4 options; anything
 * longer belongs in the drawer.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
  return (
    <div className="flex shrink-0 gap-1 rounded-lg border border-line-soft p-1">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-md font-semibold transition ${pad} ${
            value === k ? "bg-yellow text-black" : "text-dim hover:text-cream"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Search + optional primary control + everything else behind one Filters button.
 *
 * Per DESIGN.md §7: content before controls. A view should never open on more than
 * one visible choice, and a user must always be able to see and remove what is active.
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  primary,
  groups = [],
  toggles = [],
  resultCount,
  resultNoun = "results",
}: {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  primary?: ReactNode;
  groups?: SelectGroup[];
  toggles?: ToggleFilter[];
  resultCount: number;
  resultNoun?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const activeGroups = groups.filter((g) => g.value !== null);
  const activeToggles = toggles.filter((t) => t.value);
  const count = activeGroups.length + activeToggles.length;

  function clearAll() {
    groups.forEach((g) => g.onChange(null));
    toggles.forEach((t) => t.onChange(false));
    onSearch?.("");
  }

  const hasDrawer = groups.length > 0 || toggles.length > 0;

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        {primary && <div className="w-full sm:w-auto">{primary}</div>}

        {onSearch && (
          <input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 w-[calc(100%-5.5rem)] flex-1 rounded-lg border border-line-soft bg-ink-2 px-3 py-2 text-xs text-cream outline-none placeholder:text-dim focus:border-yellow/50 sm:w-auto sm:max-w-xs"
          />
        )}

        {hasDrawer && (
          <div ref={wrap} className="relative shrink-0">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                count > 0 || open
                  ? "border-yellow/60 text-yellow"
                  : "border-line-soft text-muted hover:border-yellow/40 hover:text-cream"
              }`}
            >
              Filters
              {count > 0 && (
                <span className="grid size-4 place-items-center rounded-full bg-yellow text-[9px] font-bold text-black tabular-nums">
                  {count}
                </span>
              )}
            </button>

            {open && (
              <div className="animate-rise absolute top-full right-0 z-40 mt-2 max-h-[70vh] w-[min(92vw,26rem)] overflow-y-auto rounded-xl border border-line bg-ink-2 p-4 shadow-2xl shadow-black/60">
                {groups.map((g) => (
                  <div key={g.key} className="mb-4 last:mb-0">
                    <div className="mb-2 text-[10px] tracking-[0.14em] text-dim uppercase">{g.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.options.map((o) => (
                        <button
                          key={o}
                          onClick={() => g.onChange(g.value === o ? null : o)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            g.value === o
                              ? "border-yellow bg-yellow text-black"
                              : "border-line-soft text-muted hover:border-yellow/40 hover:text-cream"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {toggles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line-soft pt-4">
                    {toggles.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => t.onChange(!t.value)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                          t.value
                            ? "border-yellow bg-yellow text-black"
                            : "border-line-soft text-muted hover:border-yellow/40 hover:text-cream"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <span className="ml-auto shrink-0 text-xs text-dim tabular-nums sm:ml-auto">
          {resultCount} {resultNoun}
        </span>
      </div>

      {count > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {activeGroups.map((g) => (
            <Chip key={g.key} onClear={() => g.onChange(null)}>
              <span className="text-dim">{g.label}:</span> {g.value}
            </Chip>
          ))}
          {activeToggles.map((t) => (
            <Chip key={t.key} onClear={() => t.onChange(false)}>
              {t.label}
            </Chip>
          ))}
          <button onClick={clearAll} className="ml-1 text-[11px] text-dim underline underline-offset-4 hover:text-yellow">
            clear all
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow/40 py-1 pr-1.5 pl-2.5 text-[11px] text-yellow">
      {children}
      <button onClick={onClear} aria-label="Remove filter" className="grid size-4 place-items-center rounded-full transition hover:bg-yellow hover:text-black">
        ×
      </button>
    </span>
  );
}
