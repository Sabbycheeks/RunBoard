import type { Run } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats "YYYY-MM-DDTHH:mm" without going through Date (avoids timezone drift). */
export function formatDate(v: string | null): string {
  if (!v) return "—";
  const [y, mo, d] = v.slice(0, 10).split("-").map(Number);
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

export function formatTime(v: string | null): string {
  if (!v || v.length < 16) return "—";
  let h = Number(v.slice(11, 13));
  const m = v.slice(14, 16);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatDuration(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 1) return "<1m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10" -> "October 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Current local time as "YYYY-MM-DDTHH:mm", the same shape as dates parsed from the export. */
export function nowLocal(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Live stopwatch text: "4:07" or "1:02:05". */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Duration text in the export's style ("1 hr 57 min", "45 min"); under a minute shows seconds. */
export function durationText(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec} sec`;
  const mins = Math.round(totalSec / 60);
  const h = Math.floor(mins / 60);
  return h ? `${h} hr ${mins % 60} min` : `${mins} min`;
}

export function supplyHouseLabel(run: Run): string {
  if (run.supplyHouseName) return run.supplyHouseName;
  // Fall back to the place name before the first comma of the address.
  if (run.supplyHouseAddress) return run.supplyHouseAddress.split(",")[0];
  return "—";
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function directionsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}
