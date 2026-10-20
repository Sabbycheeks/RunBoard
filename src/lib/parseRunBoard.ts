// Server-side only: imported from the server component in app/page.tsx.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { PreventableStatus, Run, RunData, Subitem } from "./types";
import { mockRuns } from "./mockRuns";

export const RUN_BOARD_FILE = "Run_Board_2026_October_2026_1792474982.xlsx";

/** Column headers live on the 3rd row of the monday.com export. */
const HEADER_ROW_INDEX = 2;

type Cell = string | number | boolean | null | undefined;

/**
 * Loads runs from data/<RUN_BOARD_FILE> if it exists, otherwise falls back to
 * the bundled mock data so the prototype always runs.
 */
export function loadRunData(): RunData {
  const filePath = path.join(process.cwd(), "data", RUN_BOARD_FILE);
  if (fs.existsSync(filePath)) {
    try {
      const runs = parseRunBoard(fs.readFileSync(filePath));
      return { runs, source: "excel", sourceLabel: RUN_BOARD_FILE };
    } catch (err) {
      console.error(`Failed to parse ${RUN_BOARD_FILE}, using mock data`, err);
    }
  }
  return { runs: mockRuns, source: "mock", sourceLabel: "Sample data" };
}

/**
 * Parses the "run board" sheet. Layout:
 *
 *   row 3:  headers (Name, Subitems, Date, Technician Address, ...)
 *   row n:  a run              -> "Incoming form answer" | summary | date | ...
 *   row n+1 "Subitems" | "Name" | "Quantity"   (sub-table header, optional)
 *   row n+2 ""         | part   | qty          (one row per subitem)
 */
export function parseRunBoard(buffer: Buffer): Run[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: "" });

  const headers = (rows[HEADER_ROW_INDEX] ?? []).map((h) => String(h).trim());
  const col = (name: string) => headers.indexOf(name);
  const C = {
    name: col("Name"),
    summary: col("Subitems"),
    date: col("Date"),
    techAddress: col("Technician Address"),
    totalHours: col("Total Hours"),
    endTrip: col("End Trip(test)"),
    startTrip: col("Start Trip(test)"),
    supplyAddress: col("Supply House Address"),
    runType: col("Run Type"),
    technician: col("Technician"),
    department: col("Department"),
    supplyName: col("Supply House Name"),
    po: col("PO Number"),
    runner: col("Runner Name"),
    runnerEmail: col("Runner Email"),
    mileageTest: col("Mileage(test)"),
    mileage: col("Mileage"),
    preventable: col("Preventable"),
    preventableReason: col("Preventable Reason"),
    duration: col("Duration(test)"),
  };

  const runs: Run[] = [];
  let current: Run | null = null;
  let inSubitems = false;

  for (let i = HEADER_ROW_INDEX + 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (idx: number): Cell => (idx >= 0 ? row[idx] : "");
    const first = str(row[0]);

    if (first === "Subitems") {
      inSubitems = true;
      continue;
    }

    if (first === "") {
      // Subitem row belongs to the most recent run.
      if (inSubitems && current && str(row[1])) {
        current.subitems.push({ name: str(row[1]), quantity: num(row[2]) });
      }
      continue;
    }

    // A new run row.
    inSubitems = false;
    const date = excelDate(get(C.date));
    if (!date) {
      // Skips monday's empty "New run" placeholder row.
      current = null;
      continue;
    }

    const startTrip = excelDate(get(C.startTrip));
    const endTrip = excelDate(get(C.endTrip));
    const totalHours = num(get(C.totalHours));
    const durationText = str(get(C.duration));

    current = {
      id: `run-${i + 1}`,
      name: first,
      description: str(get(C.summary)),
      date,
      technician: titleCase(str(get(C.technician))),
      department: str(get(C.department)),
      technicianAddress: str(get(C.techAddress)),
      supplyHouseName: str(get(C.supplyName)),
      supplyHouseAddress: str(get(C.supplyAddress)),
      runTypes: str(get(C.runType)).split(",").map((s) => s.trim()).filter(Boolean),
      poNumber: str(get(C.po)),
      runnerName: titleCase(str(get(C.runner))),
      runnerEmail: str(get(C.runnerEmail)).toLowerCase(),
      startTrip,
      endTrip,
      durationText,
      durationMinutes:
        parseDuration(durationText) ??
        tripMinutes(get(C.startTrip), get(C.endTrip)) ??
        (totalHours != null ? Math.round(totalHours * 60) : null),
      totalHours,
      mileage: num(get(C.mileageTest)) ?? num(get(C.mileage)),
      preventable: toPreventable(str(get(C.preventable))),
      preventableReason: cleanReason(str(get(C.preventableReason))),
      subitems: [] as Subitem[],
    };
    runs.push(current);
  }

  // Newest first.
  return runs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

// ---------- helpers ----------

function str(v: Cell): string {
  return v == null ? "" : String(v).trim();
}

function num(v: Cell): number | null {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Excel serial date -> "YYYY-MM-DDTHH:mm" (wall-clock, no timezone shift). */
function excelDate(v: Cell): string | null {
  const serial = num(v);
  if (serial == null || serial <= 0) return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 16);
}

function tripMinutes(start: Cell, end: Cell): number | null {
  const s = num(start);
  const e = num(end);
  if (s == null || e == null || e <= s) return null;
  return Math.round((e - s) * 1440);
}

/** "1 hr 57 min" | "45 min" | "2 hr" -> minutes */
export function parseDuration(text: string): number | null {
  if (!text) return null;
  const h = /(\d+(?:\.\d+)?)\s*h/i.exec(text);
  const m = /(\d+)\s*m/i.exec(text);
  if (!h && !m) return null;
  return Math.round((h ? parseFloat(h[1]) * 60 : 0) + (m ? parseInt(m[1], 10) : 0));
}

function toPreventable(v: string): PreventableStatus {
  if (/^yes$/i.test(v)) return "Preventable";
  if (/^no$/i.test(v)) return "Not Preventable";
  return "Unclassified";
}

function cleanReason(v: string): string {
  return /^blank$/i.test(v) ? "" : v;
}

function titleCase(v: string): string {
  if (!v) return v;
  // Only normalise names typed fully in one case ("DEVIN", "matthew burchwell").
  if (v !== v.toUpperCase() && v !== v.toLowerCase()) return v;
  return v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
