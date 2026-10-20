import type { Run } from "./types";

export interface RunStats {
  totalRuns: number;
  avgDurationMinutes: number | null;
  totalMileage: number;
  preventable: number;
  notPreventable: number;
  unclassified: number;
}

export function computeStats(runs: Run[]): RunStats {
  const durations = runs.map((r) => r.durationMinutes).filter((d): d is number => d != null);
  return {
    totalRuns: runs.length,
    avgDurationMinutes: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null,
    totalMileage: runs.reduce((sum, r) => sum + (r.mileage ?? 0), 0),
    preventable: runs.filter((r) => r.preventable === "Preventable").length,
    notPreventable: runs.filter((r) => r.preventable === "Not Preventable").length,
    unclassified: runs.filter((r) => r.preventable === "Unclassified").length,
  };
}

export function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}
