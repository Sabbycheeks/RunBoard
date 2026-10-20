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
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
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
