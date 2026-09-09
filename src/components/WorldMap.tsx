"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection } from "geojson";

export interface MapPin {
  id: string;
  coords: [number, number];
  /** Drives the pin colour. */
  tone: "yellow" | "cream" | "alert";
  /** Relative importance, 0–1, drives the pin radius. */
  weight: number;
  label: string;
  /** Renders the radar ping ring. */
  pulse?: boolean;
}

/** Fixed coordinate space the projection is fitted to. The SVG scales responsively. */
const VB = { w: 1000, h: 520 };

type View = { k: number; x: number; y: number };

/** Whole world. */
const WORLD: View = { k: 1, x: 0.5, y: 0.5 };
/** Europe framed edge to edge, derived from the projected bounds of Lisbon–Helsinki–Athens–Istanbul. */
const EUROPE: View = { k: 5.4, x: 0.523, y: 0.268 };

const MIN_K = 1;
const MAX_K = 12;

function clampView(v: View): View {
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
  const half = 0.5 / k;
  return {
    k,
    x: Math.min(1 - half, Math.max(half, v.x)),
    y: Math.min(1 - half, Math.max(half, v.y)),
  };
}

export default function WorldMap({
  pins,
  selectedId,
  onSelect,
  focus = "europe",
  children,
}: {
  pins: MapPin[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Framing used before the first fit, and when there is nothing to fit to. */
  focus?: "europe" | "world";
  children?: ReactNode;
}) {
  const [land, setLand] = useState<FeatureCollection | null>(null);
  const [view, setView] = useState<View>(focus === "europe" ? EUROPE : WORLD);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const didFit = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/geo/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
        // Antarctica adds a band of empty height and nothing worth showing.
        fc.features = fc.features.filter((f) => f.id !== "010");
        setLand(fc);
      })
      .catch(() => setLand(null));
    return () => {
      alive = false;
    };
  }, []);

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().scale(VB.w / 6.1).translate([VB.w / 2, VB.h / 2 + 20]),
    [],
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const countries = useMemo(
    () => (land ? land.features.map((f, i) => ({ d: pathGen(f) ?? "", key: `${f.id ?? i}` })) : []),
    [land, pathGen],
  );

  /** Pins with their projected screen positions, computed once per pin set. */
  const placed = useMemo(
    () => pins.map((p) => ({ pin: p, xy: projection(p.coords) ?? ([0, 0] as [number, number]) })),
    [pins, projection],
  );

  /** Framing that brings every current pin into view with a margin. */
  const fit = useCallback((): View => {
    if (placed.length === 0) return focus === "europe" ? EUROPE : WORLD;
    const xs = placed.map((p) => p.xy[0]);
    const ys = placed.map((p) => p.xy[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    // Floors stop a single pin, or a tight cluster, from zooming to absurd depth.
    const w = Math.max(x1 - x0, 55);
    const h = Math.max(y1 - y0, 32);
    const pad = 1.5;
    return clampView({
      k: Math.min(VB.w / (w * pad), VB.h / (h * pad)),
      x: (x0 + x1) / 2 / VB.w,
      y: (y0 + y1) / 2 / VB.h,
    });
  }, [placed, focus]);

  // Frame the data once, as soon as there is any. Later filter changes leave the
  // view alone so the map does not jump under the user; the FIT button re-frames.
  useEffect(() => {
    if (didFit.current || placed.length === 0) return;
    didFit.current = true;
    setView(fit());
  }, [placed.length, fit]);

  const transform = `translate(${VB.w / 2} ${VB.h / 2}) scale(${view.k}) translate(${-VB.w * view.x} ${-VB.h * view.y})`;

  function onWheel(e: React.WheelEvent) {
    setView((v) => clampView({ ...v, k: v.k * (e.deltaY < 0 ? 1.16 : 1 / 1.16) }));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - d.x) / rect.width / view.k;
    const dy = (e.clientY - d.y) / rect.height / view.k;
    if (Math.abs(e.clientX - d.x) > 3 || Math.abs(e.clientY - d.y) > 3) d.moved = true;
    setView((v) => clampView({ ...v, x: d.vx - dx, y: d.vy - dy }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  const btn =
    "size-8 grid place-items-center rounded-md border border-line bg-ink/70 text-cream/70 hover:text-yellow hover:border-yellow/40 transition backdrop-blur text-sm";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-ink-2">
      {/* Radar sweep: sharp leading edge, trail fading behind it. Atmosphere only. */}
      <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden opacity-[0.09]">
        <div className="aspect-square w-[150%] animate-sweep rounded-full [background:conic-gradient(from_0deg,var(--color-yellow)_0deg,transparent_75deg,transparent_360deg)]" />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="relative z-10 h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => {
          if (!drag.current?.moved) onSelect?.(null);
        }}
      >
        <g transform={transform}>
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

          {placed.map(({ pin: p, xy: [x, y] }) => {
            const active = selectedId === p.id || hover === p.id;
            // Radii shrink as you zoom in so dense cities stay readable.
            const r = (2.2 + p.weight * 3.6) / Math.sqrt(view.k);
            const fill =
              p.tone === "yellow"
                ? "var(--color-yellow)"
                : p.tone === "alert"
                  ? "var(--color-alert)"
                  : "var(--color-cream)";
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y})`}
                className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(selectedId === p.id ? null : p.id);
                }}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
              >
                {(p.pulse || active) && <circle r={r} fill={fill} className="origin-center animate-ping-slow" />}
                <circle
                  r={active ? r * 1.8 : r}
                  fill={fill}
                  fillOpacity={active ? 1 : 0.8}
                  stroke="var(--color-ink)"
                  strokeWidth={0.8 / Math.sqrt(view.k)}
                />
                {active && (
                  <text
                    y={-r * 2.6}
                    textAnchor="middle"
                    className="pointer-events-none font-semibold"
                    fill="var(--color-cream)"
                    fontSize={10 / Math.sqrt(view.k)}
                    stroke="var(--color-ink)"
                    strokeWidth={2.6 / Math.sqrt(view.k)}
                    paintOrder="stroke"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5">
        <button className={btn} onClick={() => setView((v) => clampView({ ...v, k: v.k * 1.4 }))} aria-label="Zoom in">+</button>
        <button className={btn} onClick={() => setView((v) => clampView({ ...v, k: v.k / 1.4 }))} aria-label="Zoom out">−</button>
        <button className={`${btn} text-[9px] font-bold`} onClick={() => setView(fit())} aria-label="Fit to results">FIT</button>
        <button className={`${btn} text-[9px] font-bold`} onClick={() => setView(EUROPE)} aria-label="Frame Europe">EU</button>
        <button className={`${btn} text-[9px] font-bold`} onClick={() => setView(WORLD)} aria-label="Frame the world">ALL</button>
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
