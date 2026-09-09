"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection } from "geojson";

export interface MapItem {
  id: string;
  city: string;
  /** [longitude, latitude] */
  coords: [number, number];
  tone: "yellow" | "cream" | "alert";
  label: string;
  /** Draws the radar ping ring: new, urgent or soon. */
  pulse?: boolean;
}

/** Projection space. Nothing about the container leaks into this. */
const W = 1000;
const H = 520;

/** Camera: k=1 fits the world across the container width. */
type View = { k: number; cx: number; cy: number };

const MIN_K = 0.9;
const MAX_K = 40;

/** Roughly Europe, used as the reset target. */
const EUROPE_LONLAT: [number, number] = [12, 50];

export default function WorldMap({
  items,
  selectedId,
  selectedCity,
  onPickCity,
  children,
}: {
  items: MapItem[];
  /** Highlights the city containing this item. */
  selectedId?: string | null;
  selectedCity?: string | null;
  /** Fires with null when the user clicks empty ocean. */
  onPickCity?: (city: string | null) => void;
  children?: ReactNode;
}) {
  const [land, setLand] = useState<FeatureCollection | null>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [view, setView] = useState<View>({ k: 4, cx: W / 2, cy: H / 2 });
  const [hover, setHover] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
  const didFit = useRef(false);

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().scale(W / 6.1).translate([W / 2, H / 2 + 20]),
    [],
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // Container size drives the viewBox aspect, so the visible rect is always exactly
  // what the viewBox says. Without this, preserveAspectRatio crops and every pan and
  // zoom calculation is quietly wrong.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/geo/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
        // Antarctica is a wide empty band that pulls every auto-fit downward.
        fc.features = fc.features.filter((f) => f.id !== "010");
        setLand(fc);
      })
      .catch(() => setLand(null));
    return () => {
      alive = false;
    };
  }, []);

  const countries = useMemo(
    () => (land ? land.features.map((f, i) => ({ d: pathGen(f) ?? "", key: String(f.id ?? i) })) : []),
    [land, pathGen],
  );

  /** Extent of the drawn world, so panning cannot wander into blank space. */
  const worldBounds = useMemo(() => {
    if (!land) return { x0: 0, y0: 0, x1: W, y1: H };
    const [[x0, y0], [x1, y1]] = pathGen.bounds(land);
    return { x0, y0, x1, y1 };
  }, [land, pathGen]);

  const aspect = size.h / size.w;
  const vw = W / view.k;
  const vh = vw * aspect;

  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
      const w = W / k;
      const h = w * aspect;
      const { x0, y0, x1, y1 } = worldBounds;
      // When the world is smaller than the viewport on an axis, lock to its centre.
      const cx = w >= x1 - x0 ? (x0 + x1) / 2 : Math.min(x1 - w / 2, Math.max(x0 + w / 2, v.cx));
      const cy = h >= y1 - y0 ? (y0 + y1) / 2 : Math.min(y1 - h / 2, Math.max(y0 + h / 2, v.cy));
      return { k, cx, cy };
    },
    [aspect, worldBounds],
  );

  /** Group items sharing a city so dense hubs render as one readable marker. */
  const clusters = useMemo(() => {
    const map = new Map<string, { city: string; xy: [number, number]; items: MapItem[] }>();
    for (const it of items) {
      const existing = map.get(it.city);
      if (existing) {
        existing.items.push(it);
        continue;
      }
      const xy = projection(it.coords);
      if (!xy) continue;
      map.set(it.city, { city: it.city, xy: xy as [number, number], items: [it] });
    }
    // Bigger clusters paint first so small ones stay clickable on top.
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [items, projection]);

  /** Frame the data so every cluster is visible with a margin. */
  const fit = useCallback((): View => {
    if (clusters.length === 0) {
      const p = projection(EUROPE_LONLAT)!;
      return clamp({ k: 5, cx: p[0], cy: p[1] });
    }
    const xs = clusters.map((c) => c.xy[0]);
    const ys = clusters.map((c) => c.xy[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    // Floors stop one pin, or a tight cluster, from zooming to absurd depth.
    const spanX = Math.max(x1 - x0, 40);
    const spanY = Math.max(y1 - y0, 25);
    const pad = 1.35;
    const k = Math.min(W / (spanX * pad), (W / aspect) / (spanY * pad));
    return clamp({ k, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }, [clusters, projection, clamp, aspect]);

  const reset = useCallback(() => {
    const p = projection(EUROPE_LONLAT)!;
    setView(clamp({ k: 6, cx: p[0], cy: p[1] }));
  }, [projection, clamp]);

  // Frame once, when land and data are both ready. Later filtering leaves the camera
  // alone so the map does not lurch under the user; FIT re-frames on demand.
  useEffect(() => {
    if (didFit.current || !land || clusters.length === 0) return;
    didFit.current = true;
    setView(fit());
  }, [land, clusters.length, fit]);

  /** Zoom about a point, keeping whatever is under the cursor under the cursor. */
  const zoomAt = useCallback(
    (factor: number, u = 0.5, v = 0.5) => {
      setView((prev) => {
        const pw = W / prev.k;
        const ph = pw * aspect;
        const px = prev.cx - pw / 2 + u * pw;
        const py = prev.cy - ph / 2 + v * ph;
        const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
        const nw = W / k;
        const nh = nw * aspect;
        return clamp({ k, cx: px - (u - 0.5) * nw, cy: py - (v - 0.5) * nh });
      });
    },
    [aspect, clamp],
  );

  function onWheel(e: React.WheelEvent) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setView((prev) => clamp({ ...prev, cx: d.cx - (dx / size.w) * vw, cy: d.cy - (dy / size.h) * vh }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  /** Projection units per screen pixel: keeps markers a constant on-screen size. */
  const px = vw / size.w;
  const viewBox = `${view.cx - vw / 2} ${view.cy - vh / 2} ${vw} ${vh}`;

  const btn =
    "size-8 grid place-items-center rounded-md border border-line bg-ink/80 text-cream/70 hover:text-yellow hover:border-yellow/40 transition backdrop-blur text-sm";

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-ink-2">
      {/* Radar sweep: sharp leading edge, trail fading behind. Atmosphere only. */}
      <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden opacity-[0.07]">
        <div className="aspect-square w-[150%] animate-sweep rounded-full [background:conic-gradient(from_0deg,var(--color-yellow)_0deg,transparent_75deg,transparent_360deg)]" />
      </div>

      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => {
          if (!drag.current?.moved) onPickCity?.(null);
        }}
      >
        {countries.map((c) => (
          <path
            key={c.key}
            d={c.d}
            fill="rgba(238,251,134,0.06)"
            stroke="rgba(238,251,134,0.18)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {clusters.map((c) => {
          const n = c.items.length;
          const active =
            selectedCity === c.city || hover === c.city || (!!selectedId && c.items.some((i) => i.id === selectedId));
          // Area grows with count but sub-linearly, so London does not swallow Lisbon.
          const r = (n === 1 ? 4.6 : 6 + Math.min(11, Math.sqrt(n) * 3.1)) * px;
          const pulse = c.items.some((i) => i.pulse);
          const tone = c.items.some((i) => i.tone === "alert")
            ? "var(--color-alert)"
            : c.items.some((i) => i.tone === "yellow")
              ? "var(--color-yellow)"
              : "var(--color-cream)";
          const label = n === 1 ? c.items[0].label : `${c.city} · ${n}`;

          return (
            <g
              key={c.city}
              transform={`translate(${c.xy[0]} ${c.xy[1]})`}
              className="cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPickCity?.(selectedCity === c.city ? null : c.city);
              }}
              onMouseEnter={() => setHover(c.city)}
              onMouseLeave={() => setHover(null)}
            >
              {(pulse || active) && (
                <circle
                  r={r}
                  fill={tone}
                  className="animate-ping-slow"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              )}
              {/* Generous invisible hit area: the visible dot is often only a few pixels. */}
              <circle r={Math.max(r, 11 * px)} fill="transparent" />
              <circle
                r={active ? r * 1.25 : r}
                fill={tone}
                fillOpacity={active ? 1 : 0.85}
                stroke="var(--color-ink)"
                strokeWidth={1.2 * px}
              />
              {n > 1 && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none font-bold"
                  fill="var(--color-ink)"
                  fontSize={Math.min(r * 1.15, 11 * px)}
                >
                  {n}
                </text>
              )}
              {active && (
                <text
                  y={-r - 6 * px}
                  textAnchor="middle"
                  className="pointer-events-none font-semibold"
                  fill="var(--color-cream)"
                  fontSize={12 * px}
                  stroke="var(--color-ink)"
                  strokeWidth={3.5 * px}
                  paintOrder="stroke"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5">
        <button className={btn} onClick={() => zoomAt(1.5)} aria-label="Zoom in">+</button>
        <button className={btn} onClick={() => zoomAt(1 / 1.5)} aria-label="Zoom out">−</button>
        <button className={`${btn} text-[9px] font-bold`} onClick={() => setView(fit())} aria-label="Fit to results">FIT</button>
        <button className={`${btn} text-[9px] font-bold`} onClick={reset} aria-label="Back to Europe">EU</button>
      </div>

      {!land && (
        <div className="absolute inset-0 z-20 grid place-items-center text-xs tracking-widest text-dim uppercase">
          loading map
        </div>
      )}

      {children}
    </div>
  );
}
