import type { PreventableStatus } from "@/lib/types";

const PREVENTABLE_STYLES: Record<PreventableStatus, string> = {
  Preventable: "bg-amber-50 text-amber-800 ring-amber-600/20",
  "Not Preventable": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Unclassified: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const DOT: Record<PreventableStatus, string> = {
  Preventable: "bg-amber-500",
  "Not Preventable": "bg-emerald-500",
  Unclassified: "bg-slate-400",
};

export function PreventableBadge({ status, reason }: { status: PreventableStatus; reason?: string }) {
  // Show the reason when it adds information (e.g. "Truck Stock").
  const extra = reason && reason !== status ? ` · ${reason}` : "";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PREVENTABLE_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {status}
      {extra}
    </span>
  );
}

const RUN_TYPE_STYLES: Record<string, string> = {
  Technician: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "Supply House": "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  Other: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function RunTypeBadges({ types }: { types: string[] }) {
  if (!types.length) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {types.map((t) => (
        <span
          key={t}
          className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            RUN_TYPE_STYLES[t] ?? RUN_TYPE_STYLES.Other
          }`}
        >
          {t}
        </span>
      ))}
    </span>
  );
}

/** Marks runs created or changed in this browser session. */
export function ChangeBadge({ run }: { run: { isDraft?: boolean; isEdited?: boolean } }) {
  if (run.isDraft) {
    return (
      <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Draft
      </span>
    );
  }
  if (run.isEdited) {
    return (
      <span className="rounded-md bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Edited
      </span>
    );
  }
  return null;
}
