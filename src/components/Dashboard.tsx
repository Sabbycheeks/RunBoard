"use client";

import { useCallback, useMemo, useState } from "react";
import { supplyHouseLabel } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import type { PreventableStatus, Run } from "@/lib/types";
import RunFormModal, { type RunnerInfo, type TechnicianInfo } from "./RunFormModal";
import KpiCards from "./KpiCards";
import RunsTable from "./RunsTable";

interface Props {
  initialRuns: Run[];
  source: "excel" | "mock";
  sourceLabel: string;
}

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export default function Dashboard({ initialRuns, source, sourceLabel }: Props) {
  const [runs, setRuns] = useState<Run[]>(initialRuns);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PreventableStatus | "All">("All");
  const [runType, setRunType] = useState("All");
  // null = closed, "new" = creating, otherwise the run being edited.
  const [form, setForm] = useState<Run | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (status !== "All" && r.preventable !== status) return false;
      if (runType !== "All" && !r.runTypes.includes(runType)) return false;
      if (!q) return true;
      return [
        r.technician,
        r.runnerName,
        r.department,
        r.description,
        supplyHouseLabel(r),
        r.poNumber,
        ...r.subitems.map((s) => s.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [runs, query, status, runType]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const lists = useMemo(() => {
    // Runs are newest first, so the first entry per technician is their latest department/address.
    const techDirectory = new Map<string, TechnicianInfo>();
    for (const r of runs) {
      if (r.technician && !techDirectory.has(r.technician)) {
        techDirectory.set(r.technician, { name: r.technician, department: r.department });
      }
    }
    // Same idea for runners: keep the email from each runner's most recent run that has one.
    const runnerDirectory = new Map<string, RunnerInfo>();
    for (const r of runs) {
      if (!r.runnerName) continue;
      const key = r.runnerName.toLowerCase();
      const known = runnerDirectory.get(key);
      if (!known) runnerDirectory.set(key, { name: r.runnerName, email: r.runnerEmail });
      else if (!known.email && r.runnerEmail) known.email = r.runnerEmail;
    }
    return {
      technicians: [...techDirectory.values()].sort((a, b) => a.name.localeCompare(b.name)),
      runners: [...runnerDirectory.values()].sort((a, b) => a.name.localeCompare(b.name)),
      supplyHouseAddresses: uniq(runs.map((r) => r.supplyHouseAddress)),
      runTypes: uniq(runs.flatMap((r) => r.runTypes)),
    };
  }, [runs]);

  const saveRun = useCallback(
    (run: Run) => {
      const edited = runs.some((r) => r.id === run.id);
      setRuns((cur) => (edited ? cur.map((r) => (r.id === run.id ? run : r)) : [run, ...cur]));
      setForm(null);
      setToast(
        edited
          ? "Run updated (not saved — prototype only)."
          : "Draft run added to the board (not saved — prototype only).",
      );
      window.setTimeout(() => setToast(null), 3500);
    },
    [runs],
  );

  const closeForm = useCallback(() => setForm(null), []);

  const filtersActive = query || status !== "All" || runType !== "All";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinejoin="round" />
                <circle cx="7" cy="17.5" r="1.5" />
                <circle cx="17" cy="17.5" r="1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Run Board</h1>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${source === "excel" ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                {source === "excel" ? `Data: ${sourceLabel}` : "Showing sample data — add the Excel export to /data"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm("new")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <span className="text-lg leading-none">+</span> Add New Run
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <KpiCards stats={stats} />

        <section className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Runs</h2>
              <p className="text-xs text-slate-500">
                {filtered.length} of {runs.length} runs · click a row to see parts and routing
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search technician, runner, part, PO…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-72"
              />
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PreventableStatus | "All")}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none sm:flex-none"
                  aria-label="Filter by preventable status"
                >
                  <option value="All">All statuses</option>
                  <option>Preventable</option>
                  <option>Not Preventable</option>
                  <option>Unclassified</option>
                </select>
                <select
                  value={runType}
                  onChange={(e) => setRunType(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none sm:flex-none"
                  aria-label="Filter by run type"
                >
                  <option value="All">All run types</option>
                  {lists.runTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatus("All");
                      setRunType("All");
                    }}
                    className="rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <RunsTable runs={filtered} onEdit={setForm} />
        </section>
      </main>

      {form && (
        <RunFormModal
          key={form === "new" ? "new" : form.id}
          run={form === "new" ? undefined : form}
          onClose={closeForm}
          onSave={saveRun}
          technicians={lists.technicians}
          runners={lists.runners}
          supplyHouseAddresses={lists.supplyHouseAddresses}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
