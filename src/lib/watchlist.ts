"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "bvc-radar:watchlist";

/** Broadcast so every mounted component re-reads after a change in this tab. */
const EVT = "bvc-radar:watchlist-change";

const EMPTY: string[] = [];

// useSyncExternalStore compares snapshots by reference, so the parsed array has to
// be cached and only rebuilt when the underlying string actually changes.
let cached: string[] = EMPTY;
let cachedRaw: string | null = null;

function getSnapshot(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : EMPTY;
    cached = Array.isArray(parsed) ? (parsed as string[]) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

/** Nothing is watched during prerender; the real list arrives after hydration. */
function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Employer watchlist, persisted per browser.
 *
 * This is the "ping me" mechanism: watch a fund or a company, and the openings tab
 * surfaces anything new they post. In production the same list is what you would
 * hand to an email or push job; here it drives the in-app banner and nav badge.
 */
export function useWatchlist() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const current = getSnapshot();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      return; // private mode or storage full: leave the list untouched
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle };
}

/**
 * False during prerender and the hydration pass, true afterwards. Used to hold back
 * anything that depends on localStorage until it can be read.
 */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
