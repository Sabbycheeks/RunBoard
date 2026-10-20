import { directionsUrl, formatDuration, formatTime, mapsUrl, supplyHouseLabel } from "@/lib/format";
import type { Run } from "@/lib/types";

/** Expanded view: routing + parts requested + trip details. */
export default function RunDetail({ run }: { run: Run }) {
  const from = run.technicianAddress;
  const to = run.supplyHouseAddress;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Routing */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Routing</h4>
        <ol className="relative mt-3 space-y-4 border-l-2 border-dashed border-slate-200 pl-5">
          <Stop
            label="Supply House"
            title={supplyHouseLabel(run)}
            address={to}
            dot="bg-indigo-500"
          />
          <Stop
            label="Technician / Job Site"
            title={run.technician || "—"}
            address={from}
            dot="bg-blue-600"
          />
        </ol>
        {from && to && (
          <a
            href={directionsUrl(to, from)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Open route in Google Maps →
          </a>
        )}
      </section>

      {/* Parts */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Parts Requested ({run.subitems.length})
        </h4>
        {run.subitems.length ? (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-1 font-medium">Item</th>
                <th className="pb-1 text-right font-medium">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {run.subitems.map((s, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-2 text-slate-800">{s.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-600">{s.quantity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{run.description || "No parts listed for this run."}</p>
        )}
      </section>

      {/* Trip */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip Details</h4>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Field label="Start Trip" value={formatTime(run.startTrip)} />
          <Field label="End Trip" value={formatTime(run.endTrip)} />
          <Field label="Duration" value={run.durationText || formatDuration(run.durationMinutes)} />
          <Field label="Total Hours" value={run.totalHours != null ? run.totalHours.toFixed(2) : "—"} />
          <Field label="Mileage" value={run.mileage != null ? `${run.mileage} mi` : "—"} />
          <Field label="PO Number" value={run.poNumber || "—"} />
          <Field label="Department" value={run.department || "—"} />
          <Field
            label="Runner Email"
            value={
              run.runnerEmail ? (
                <a href={`mailto:${run.runnerEmail}`} className="text-blue-600 hover:underline break-all">
                  {run.runnerEmail}
                </a>
              ) : (
                "—"
              )
            }
          />
        </dl>
      </section>
    </div>
  );
}

function Stop({ label, title, address, dot }: { label: string; title: string; address: string; dot: string }) {
  return (
    <li className="relative">
      <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${dot}`} />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {address ? (
        <a
          href={mapsUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-slate-600 hover:text-blue-700 hover:underline"
        >
          {address}
        </a>
      ) : (
        <p className="text-sm text-slate-400">No address recorded</p>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
