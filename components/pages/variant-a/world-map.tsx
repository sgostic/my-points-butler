"use client";

/* WorldMap — equirectangular dotted map rendered to canvas, with projected
   destination pins as absolutely-positioned HTML (clickable, animatable). */

import { useEffect, useRef, useState } from "react";

interface PinnedDestination {
  id: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  accent: string;
  pinColor: string;
}

interface WorldMapProps {
  destinations: PinnedDestination[];
  selectedId: string;
  onSelect: (id: string) => void;
  dotColor?: string;
  hidden?: boolean;
}

// Rough continent polygons in [lon, lat]. Intentionally stylized, not survey-grade.
const PB_CONTINENTS: number[][][] = [
  // North America
  [[-130, 55], [-125, 48], [-123, 40], [-117, 33], [-110, 30], [-100, 26], [-97, 26], [-90, 29], [-82, 25], [-80, 30], [-75, 37], [-70, 44], [-60, 47], [-56, 52], [-66, 55], [-80, 58], [-95, 60], [-110, 60], [-125, 60], [-130, 55]],
  // Alaska
  [[-168, 62], [-150, 60], [-142, 60], [-148, 66], [-160, 66], [-168, 62]],
  // Greenland
  [[-45, 60], [-22, 60], [-18, 70], [-25, 78], [-45, 80], [-58, 76], [-52, 66], [-45, 60]],
  // Central America
  [[-95, 17], [-88, 15], [-83, 9], [-78, 8], [-82, 14], [-88, 18], [-95, 17]],
  // South America
  [[-78, 8], [-72, 11], [-62, 8], [-52, 3], [-44, -2], [-39, -8], [-39, -18], [-48, -25], [-58, -34], [-66, -44], [-72, -50], [-74, -44], [-71, -32], [-72, -18], [-79, -6], [-80, 2], [-78, 8]],
  // Western Europe
  [[-10, 37], [-9, 43], [-2, 48], [1, 50], [-2, 52], [2, 52], [4, 58], [10, 59], [14, 55], [12, 48], [18, 49], [16, 44], [8, 44], [3, 43], [-2, 40], [-9, 38], [-10, 37]],
  // UK + Ireland
  [[-6, 50], [-2, 52], [-1, 55], [-3, 58], [-7, 57], [-8, 54], [-10, 52], [-6, 50]],
  // Scandinavia
  [[5, 58], [10, 59], [18, 62], [24, 66], [28, 70], [20, 69], [12, 64], [6, 61], [5, 58]],
  // Eastern Europe / West Russia
  [[14, 55], [24, 55], [36, 55], [44, 52], [50, 48], [44, 46], [34, 45], [28, 46], [20, 49], [14, 52], [14, 55]],
  // North Asia (Russia/Siberia)
  [[44, 52], [60, 56], [80, 58], [100, 60], [120, 60], [140, 62], [160, 64], [172, 66], [178, 68], [160, 70], [130, 72], [100, 72], [75, 70], [55, 66], [44, 58], [44, 52]],
  // Central + South + SE Asia
  [[44, 46], [52, 42], [60, 40], [70, 38], [78, 34], [88, 30], [97, 28], [100, 22], [106, 21], [109, 16], [106, 10], [100, 6], [97, 9], [92, 21], [86, 20], [80, 8], [76, 8], [72, 18], [66, 24], [58, 26], [50, 30], [46, 38], [44, 46]],
  // East Asia (China coast / Korea)
  [[100, 22], [110, 20], [118, 24], [122, 31], [126, 38], [122, 40], [118, 38], [112, 32], [106, 28], [100, 28], [100, 22]],
  // Japan
  [[131, 32], [135, 34], [140, 36], [142, 40], [143, 43], [140, 42], [137, 37], [133, 34], [131, 32]],
  // Africa
  [[-16, 15], [-17, 21], [-12, 28], [-6, 32], [6, 33], [11, 34], [20, 32], [28, 31], [33, 28], [36, 22], [39, 15], [43, 11], [51, 12], [51, 5], [44, -2], [40, -12], [35, -21], [28, -32], [20, -35], [16, -29], [13, -18], [9, -3], [5, 4], [-4, 5], [-12, 9], [-16, 15]],
  // Madagascar
  [[44, -15], [48, -16], [50, -22], [46, -25], [44, -20], [44, -15]],
  // Arabia
  [[36, 30], [44, 30], [52, 26], [58, 22], [54, 17], [45, 13], [40, 16], [36, 24], [36, 30]],
  // Australia
  [[114, -22], [113, -28], [116, -34], [123, -34], [131, -32], [138, -35], [146, -39], [151, -37], [153, -30], [146, -19], [136, -12], [130, -13], [122, -18], [116, -20], [114, -22]],
  // Indonesia / New Guinea
  [[95, 3], [104, 1], [112, -2], [120, -3], [131, -3], [141, -3], [147, -8], [138, -9], [125, -9], [114, -8], [104, -7], [97, -1], [95, 3]],
  // New Zealand
  [[167, -44], [171, -44], [174, -41], [178, -38], [176, -41], [172, -46], [167, -47], [167, -44]],
];

function pbPointInPoly(lon: number, lat: number, poly: number[][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pbIsLand(lon: number, lat: number) {
  for (const poly of PB_CONTINENTS) if (pbPointInPoly(lon, lat, poly)) return true;
  return false;
}

// Equirectangular projection into normalized [0..1], clipped to the visible band.
const PB_LAT_TOP = 80;
const PB_LAT_BOT = -58;
function pbProject(lon: number, lat: number) {
  const x = (lon + 180) / 360;
  const y = (PB_LAT_TOP - lat) / (PB_LAT_TOP - PB_LAT_BOT);
  return { x, y };
}

export function WorldMap({ destinations, selectedId, onSelect, dotColor, hidden }: WorldMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const stepDeg = 2.7;
    const r = Math.max(1.05, size.w / 620); // dot radius scales with map
    for (let lat = PB_LAT_TOP; lat >= PB_LAT_BOT; lat -= stepDeg) {
      for (let lon = -180; lon <= 180; lon += stepDeg) {
        if (!pbIsLand(lon, lat)) continue;
        const p = pbProject(lon, lat);
        const px = p.x * size.w;
        const py = p.y * size.h;
        // subtle depth: dots fade slightly toward the edges
        const edge = 1 - Math.min(1, Math.abs(p.y - 0.5) * 1.4);
        ctx.globalAlpha = 0.45 + 0.4 * edge;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor || "#9DB2C9";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, [size, dotColor]);

  return (
    <div ref={wrapRef} className="pb-map" aria-hidden={hidden ? "true" : "false"}>
      <canvas ref={canvasRef} className="pb-map-canvas" />
      {size.w > 0 &&
        destinations.map((d) => {
          const p = pbProject(d.lon, d.lat);
          const active = d.id === selectedId;
          // Flip the label below the pin when it sits near the top edge, and
          // pull it inward at the left/right edges, so it never spills out.
          const labelBelow = p.y < 0.16;
          const labelSide = p.x < 0.1 ? " label-right" : p.x > 0.9 ? " label-left" : "";
          return (
            <button
              key={d.id}
              type="button"
              className={
                "pb-pin" + (active ? " is-active" : "") + (labelBelow ? " label-below" : "") + labelSide
              }
              style={
                {
                  left: p.x * 100 + "%",
                  top: p.y * 100 + "%",
                  "--pin": d.pinColor || d.accent,
                } as React.CSSProperties
              }
              onClick={() => onSelect(d.id)}
              aria-label={d.city + ", " + d.country}
              aria-pressed={active}
            >
              <span className="pb-pin-dot" />
              <span className="pb-pin-pulse" />
              <span className="pb-pin-label">
                {d.flag} {d.city}
              </span>
            </button>
          );
        })}
    </div>
  );
}
