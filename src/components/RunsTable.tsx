"use client";

import { Fragment, useState } from "react";
import { formatDate, formatDuration, formatTime, supplyHouseLabel } from "@/lib/format";
import type { Run } from "@/lib/types";
import { DraftBadge, PreventableBadge, RunTypeBadges } from "./Badges";
import RunDetail from "./RunDetail";

export default function RunsTable({ runs }: { runs: Run[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  if (!runs.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No runs match the current filters.
      </div>
    );
  }

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
          <tbody className="divide-y divide-slate-100">
            {runs.map((run) => {
              const open = openId === run.id;
              return (
                <Fragment key={run.id}>
                  <tr
                    onClick={() => toggle(run.id)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${open ? "bg-blue-50/60" : ""}`}
                    aria-expanded={open}
                  >
                    <td className="px-3 py-3">
                      <Chevron open={open} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        {formatDate(run.date)}
                        {run.isDraft && <DraftBadge />}
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
                      {formatDuration(run.durationMinutes)}
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
                        <RunDetail run={run} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {runs.map((run) => {
          const open = openId === run.id;
          return (
            <li key={run.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggle(run.id)}
                aria-expanded={open}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {formatDate(run.date)}
                      <span className="font-normal text-slate-500">{formatTime(run.date)}</span>
                      {run.isDraft && <DraftBadge />}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-700">
                      {run.technician || supplyHouseLabel(run)}
                    </p>
                  </div>
                  <Chevron open={open} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Mini label="Runner" value={run.runnerName || "—"} />
                  <Mini label="Supply" value={supplyHouseLabel(run)} />
                  <Mini label="Duration" value={formatDuration(run.durationMinutes)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <PreventableBadge status={run.preventable} reason={run.preventableReason} />
                  <RunTypeBadges types={run.runTypes} />
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-200 bg-slate-50 p-3">
                  <RunDetail run={run} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
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
