import { formatDuration } from "@/lib/format";
import { pct, type RunStats } from "@/lib/stats";

function Card({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function KpiCards({ stats }: { stats: RunStats }) {
  const { totalRuns, preventable, notPreventable, unclassified } = stats;
  const pPrev = pct(preventable, totalRuns);
  const pNot = pct(notPreventable, totalRuns);
  const pUnc = Math.max(0, 100 - pPrev - pNot);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Total Runs"
        value={totalRuns.toLocaleString()}
        sub="In current view"
        icon={<TruckIcon />}
      />
      <Card
        label="Average Duration"
        value={formatDuration(stats.avgDurationMinutes)}
        sub="Start trip → end trip"
        icon={<ClockIcon />}
      />
      <Card
        label="Total Mileage"
        value={`${stats.totalMileage.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`}
        sub={totalRuns ? `${(stats.totalMileage / totalRuns).toFixed(1)} mi per run` : undefined}
        icon={<RouteIcon />}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Preventable vs Not Preventable</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{pPrev}%</span>
          <span className="text-sm text-slate-500">preventable</span>
        </div>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
          <div className="bg-amber-500" style={{ width: `${pPrev}%` }} />
          <div className="bg-emerald-500" style={{ width: `${pNot}%` }} />
          <div className="bg-slate-300" style={{ width: `${pUnc}%` }} />
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          <Legend color="bg-amber-500" label="Preventable" n={preventable} p={pPrev} />
          <Legend color="bg-emerald-500" label="Not Preventable" n={notPreventable} p={pNot} />
          <Legend color="bg-slate-300" label="Unclassified" n={unclassified} p={pUnc} />
        </ul>
      </div>
    </div>
  );
}

function Legend({ color, label, n, p }: { color: string; label: string; n: number; p: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="tabular-nums text-slate-500">
        {n} · {p}%
      </span>
    </li>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function TruckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </svg>
  );
}
