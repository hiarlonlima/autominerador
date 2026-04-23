export type RawSnapshot = {
  capturedAt: string | Date;
  activeCount: number;
};

export type Range = "24h" | "7d" | "30d" | "all";

export type BucketPoint = {
  t: number; // início do bucket em ms
  avg: number; // média de activeCount no bucket
  min: number;
  max: number;
  count: number; // quantas coletas caíram no bucket (0 se vazio)
  range: [number, number]; // [min, max] — formato aceito pelo <Area> do Recharts
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function bucketize(snapshots: RawSnapshot[], range: Range): BucketPoint[] {
  const now = Date.now();
  const bucketSize = range === "24h" ? HOUR_MS : DAY_MS;
  const start =
    range === "24h"
      ? now - 24 * HOUR_MS
      : range === "7d"
        ? now - 7 * DAY_MS
        : range === "30d"
          ? now - 30 * DAY_MS
          : snapshots.length > 0
            ? new Date(snapshots[0].capturedAt).getTime()
            : now - DAY_MS;

  const filtered = snapshots
    .map((s) => ({ t: new Date(s.capturedAt).getTime(), v: s.activeCount }))
    .filter((s) => s.t >= start);

  // ancora o bucket na borda (h/0 ou dia/00:00) pra ficar alinhado visualmente
  const anchor = (t: number) =>
    range === "24h"
      ? Math.floor(t / HOUR_MS) * HOUR_MS
      : Math.floor(t / DAY_MS) * DAY_MS;

  const groups = new Map<number, number[]>();
  for (const s of filtered) {
    const key = anchor(s.t);
    const list = groups.get(key) ?? [];
    list.push(s.v);
    groups.set(key, list);
  }

  // preenche buckets vazios pra linha ficar contínua
  const startAnchor = anchor(start);
  const endAnchor = anchor(now);
  const points: BucketPoint[] = [];
  for (let t = startAnchor; t <= endAnchor; t += bucketSize) {
    const values = groups.get(t);
    if (!values || values.length === 0) continue;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    points.push({
      t,
      avg: Math.round(avg),
      min,
      max,
      count: values.length,
      range: [min, max],
    });
  }

  return points;
}
