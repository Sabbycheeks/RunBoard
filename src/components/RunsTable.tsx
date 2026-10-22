"use client";

import { useState } from "react";
import { formatDate, formatDuration, formatTime, monthLabel, supplyHouseLabel } from "@/lib/format";
import type { Run } from "@/lib/types";
import { ChangeBadge, PreventableBadge, RunTypeBadges } from "./Badges";
import RunDetail from "./RunDetail";
import { canTime, LiveElapsed, RunTimerButton } from "./RunTimer";

interface Props {
  runs: Run[];
  onEdit: (run: Run) => void;
  onToggleTimer: (run: Run) => void;
  /** Split the list into sections with a header per month, newest month first. */
  groupByMonth?: boolean;
}

interface Group {
  /** "YYYY-MM", "" for runs without a date, or null when not grouping. */
  key: string | null;
  runs: Run[];
}

function groupRuns(runs: Run[], byMonth: boolean): Group[] {
  if (!byMonth) return [{ key: null, runs }];
  const map = new Map<string, Run[]>();
  for (const r of runs) {
    const key = r.date?.slice(0, 7) ?? "";
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  // Newest month first; undated runs last.
  return [...map.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : b.localeCompare(a)))
    .map(([key, runs]) => ({ key, runs }));
}

const groupTitle = (g: Group) => (g.key ? monthLabel(g.key) : "No date");
const countLabel = (n: number) => `${n} ${n === 1 ? "run" : "runs"}`;

interface RowProps {
  run: Run;
  open: boolean;
  onToggleOpen: () => void;
  onEdit: (run: Run) => void;
  onToggleTimer: (run: Run) => void;
}

export default function RunsTable({ runs, onEdit, onToggleTimer, groupByMonth = false }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  const groups = groupRuns(runs, groupByMonth);

  if (!runs.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No runs match the current filters.
      </div>
    );
  }

  const rowProps = (run: Run): RowProps => ({
    run,
    open: openId === run.id,
    onToggleOpen: () => toggle(run.id),
    onEdit,
    onToggleTimer,
  });

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 font-semibold">Technician</th>
              <th className="px-3 py-3 font-semibold">Runner</th>
              <th className="px-3 py-3 font-semibold">Supply House</th>
              <th className="hidden px-3 py-3 font-semibold lg:table-cell">Run Type</th>
              <th className="px-3 py-3 text-right font-semibold">Duration</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key ?? "all"} className="divide-y divide-slate-100">
              {group.key !== null && (
                <tr className="border-t-2 border-slate-200 bg-slate-100/80">
                  <th colSpan={8} scope="rowgroup" className="px-4 py-2.5 text-left">
                    <span className="text-sm font-semibold text-slate-900">{groupTitle(group)}</span>
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {countLabel(group.runs.length)}
                    </span>
                  </th>
                </tr>
              )}
              {group.runs.map((run) => (
                <DesktopRow key={run.id} {...rowProps(run)} />
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-5 md:hidden">
        {groups.map((group) => (
          <section key={group.key ?? "all"} className="space-y-3">
            {group.key !== null && (
              <h3 className="flex items-baseline gap-2 border-b border-slate-200 pb-1.5">
                <span className="text-sm font-semibold text-slate-900">{groupTitle(group)}</span>
                <span className="text-xs text-slate-500">{countLabel(group.runs.length)}</span>
              </h3>
            )}
            <ul className="space-y-3">
              {group.runs.map((run) => (
                <MobileCard key={run.id} {...rowProps(run)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function DesktopRow({ run, open, onToggleOpen, onEdit, onToggleTimer }: RowProps) {
  return (
    <>
      <tr
        onClick={onToggleOpen}
        className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${open ? "bg-blue-50/60" : ""}`}
        aria-expanded={open}
      >
        <td className="px-3 py-3">
          <Chevron open={open} />
        </td>
        <td className="whitespace-nowrap px-3 py-3">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            {formatDate(run.date)}
            <ChangeBadge run={run} />
          </div>
          <div className="text-xs text-slate-500">{formatTime(run.date)}</div>
        </td>
        <td className="px-3 py-3">
          <div className="font-medium text-slate-900">{run.technician || "—"}</div>
          <div className="text-xs text-slate-500">{run.department}</div>
        </td>
        <td className="px-3 py-3 text-slate-700">{run.runnerName || "—"}</td>
        <td className="max-w-[16rem] px-3 py-3">
          <div className="truncate text-slate-700" title={run.supplyHouseAddress}>
            {supplyHouseLabel(run)}
          </div>
          {run.description && (
            <div className="truncate text-xs text-slate-500" title={run.description}>
              {run.description}
            </div>
          )}
        </td>
        <td className="hidden px-3 py-3 lg:table-cell">
          <RunTypeBadges types={run.runTypes} />
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-700">
          {canTime(run) ? (
            <RunTimerButton run={run} onToggle={onToggleTimer} size="sm" />
          ) : (
            formatDuration(run.durationMinutes)
          )}
        </td>
        <td className="px-3 py-3">
          <PreventableBadge status={run.preventable} reason={run.preventableReason} />
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50">
          <td colSpan={8} className="px-4 py-4">
            <div className="mb-3 lg:hidden">
              <RunTypeBadges types={run.runTypes} />
            </div>
            <RunDetail run={run} onEdit={onEdit} onToggleTimer={onToggleTimer} />
          </td>
        </tr>
      )}
    </>
  );
}

function MobileCard({ run, open, onToggleOpen, onEdit, onToggleTimer }: RowProps) {
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggleOpen} aria-expanded={open} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {formatDate(run.date)}
              <span className="font-normal text-slate-500">{formatTime(run.date)}</span>
              <ChangeBadge run={run} />
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-700">{run.technician || supplyHouseLabel(run)}</p>
          </div>
          <Chevron open={open} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Mini label="Runner" value={run.runnerName || "—"} />
          <Mini label="Supply" value={supplyHouseLabel(run)} />
          <Mini
            label="Duration"
            value={
              run.timerStartedAt != null ? (
                <span className="text-red-600">
                  <LiveElapsed startedAt={run.timerStartedAt} />
                </span>
              ) : canTime(run) ? (
                "Not started"
              ) : (
                formatDuration(run.durationMinutes)
              )
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <PreventableBadge status={run.preventable} reason={run.preventableReason} />
          <RunTypeBadges types={run.runTypes} />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <RunDetail run={run} onEdit={onEdit} onToggleTimer={onToggleTimer} />
        </div>
      )}
    </li>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-slate-500">{label}</p>
      <p className="truncate font-medium text-slate-800">{value}</p>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-90 text-blue-600" : ""}`}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
