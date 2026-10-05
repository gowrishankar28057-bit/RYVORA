import type { TelemetrySample } from "../types/telemetry";

/** Deterministic PRNG so simulated data is identical on server, client and every demo run. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussian bump centred at `c` with width `w`. */
export function pulse(t: number, c: number, w: number, amp: number): number {
  const z = (t - c) / w;
  return amp * Math.exp(-0.5 * z * z);
}

/** Linear interpolation over [t, value] keyframes. */
export function keyframes(t: number, frames: ReadonlyArray<readonly [number, number]>): number {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    const [t0, v0] = frames[i - 1];
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return frames[frames.length - 1][1];
}

export interface SeriesSpec {
  seed: number;
  from?: number;
  to?: number;
  hz?: number;
  speed: (t: number) => number | null;
  helmet: (t: number) => number | null;
  bike: (t: number) => number | null;
  rotation: (t: number) => number | null;
  phone: (t: number) => number | null;
  /** Relative noise amplitude per channel. */
  noise?: Partial<Record<"speed" | "helmet" | "bike" | "rotation" | "phone", number>>;
}

const round = (v: number | null, d: number) =>
  v === null ? null : Math.round(v * 10 ** d) / 10 ** d;

export function buildSeries(spec: SeriesSpec): TelemetrySample[] {
  const { from = -12, to = 10, hz = 20 } = spec;
  const rand = mulberry32(spec.seed);
  const n = spec.noise ?? {};
  const jitter = (amp = 0) => (rand() - 0.5) * 2 * amp;
  const out: TelemetrySample[] = [];
  const steps = Math.round((to - from) * hz);
  for (let i = 0; i <= steps; i++) {
    const t = Math.round((from + i / hz) * 1000) / 1000;
    const s = spec.speed(t);
    const h = spec.helmet(t);
    const b = spec.bike(t);
    const r = spec.rotation(t);
    const p = spec.phone(t);
    out.push({
      t,
      speedKmh: round(s === null ? null : Math.max(0, s + jitter(n.speed ?? 0.3)), 1),
      helmetAccelG: round(h === null ? null : Math.max(0, h + jitter(n.helmet ?? 0.08)), 2),
      bikeAccelG: round(b === null ? null : Math.max(0, b + jitter(n.bike ?? 0.05)), 2),
      angularRateDps: round(r === null ? null : Math.max(0, r + jitter(n.rotation ?? 3)), 1),
      phoneAccelG: round(p === null ? null : Math.max(0, p + jitter(n.phone ?? 0.04)), 2),
    });
  }
  return out;
}

/** Keep every k-th sample — charts do not need 20 Hz. */
export function downsample<T>(rows: T[], every: number): T[] {
  return rows.filter((_, i) => i % every === 0);
}
