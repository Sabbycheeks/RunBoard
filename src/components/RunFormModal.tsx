"use client";

import { useEffect, useRef, useState } from "react";
import type { PreventableStatus, Run } from "@/lib/types";

export interface TechnicianInfo {
  name: string;
  department: string;
}

export interface RunnerInfo {
  name: string;
  /** Email from this runner's most recent run, or "" if none recorded. */
  email: string;
}

interface Props {
  /** The run to edit; omit to create a new run. */
  run?: Run;
  onClose: () => void;
  onSave: (run: Run) => void;
  technicians: TechnicianInfo[];
  runners: RunnerInfo[];
  supplyHouseAddresses: string[];
}

interface ItemRow {
  name: string;
  quantity: string;
}

const RUN_TYPES = ["Technician", "Supply House", "Trash", "Other"];
const DEPARTMENTS = [
  "Plumbing Service",
  "Plumbing Install",
  "Plumbing Maint.",
  "Electric",
  "HVAC Service",
  "HVAC Install",
  "HVAC Maint.",
  "Duct Cleaning",
  "Sewer Service",
  "Sewer Install",
  "Excavation",
  "HVAC Sales",
  "Plumbing Install Sales",
];
export const PREVENTABLE_REASONS = [
  "Replenishment",
  "Truck Stock",
  "Sales Issue",
  "Warehouse Error",
  "Tech Admitted Fault",
];

// Base input style without a width, so row layouts can size fields themselves.
const fieldCls =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const inputCls = `w-full ${fieldCls}`;

const emptyItem = (): ItemRow => ({ name: "", quantity: "1" });

/**
 * Create / edit form for a run. Changes live in the browser only; nothing is saved.
 * Mounted fresh each time it opens, so state is initialised from `run`.
 */
export default function RunFormModal({ run, onClose, onSave, technicians, runners, supplyHouseAddresses }: Props) {
  const isEdit = !!run;
  const [technician, setTechnician] = useState(run?.technician ?? "");
  const [department, setDepartment] = useState(run ? run.department : DEPARTMENTS[0]);
  // One type per run. Older runs tagged with several (e.g. "Technician, Other") open on the first.
  const [runType, setRunType] = useState(run?.runTypes.find((t) => RUN_TYPES.includes(t)) ?? RUN_TYPES[0]);
  const [technicianAddress, setTechnicianAddress] = useState(run?.technicianAddress ?? "");
  const [supplyHouseAddress, setSupplyHouseAddress] = useState(run?.supplyHouseAddress ?? "");
  const [runner, setRunner] = useState(run?.runnerName ?? "");
  const [runnerEmail, setRunnerEmail] = useState(run?.runnerEmail ?? "");
  const [preventable, setPreventable] = useState<PreventableStatus>(run?.preventable ?? "Unclassified");
  const [reason, setReason] = useState(
    run?.preventable === "Preventable" ? matchReason(run.preventableReason) : "",
  );
  const [items, setItems] = useState<ItemRow[]>(
    run?.subitems.length
      ? run.subitems.map((s) => ({ name: s.name, quantity: s.quantity == null ? "" : String(s.quantity) }))
      : [emptyItem()],
  );
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const needsTechnician = runType === "Technician";
  // Keep a department from older data visible even if it isn't in the standard list.
  const departmentOptions = department && !DEPARTMENTS.includes(department) ? [department, ...DEPARTMENTS] : DEPARTMENTS;

  // Picking a known technician pre-fills their department (the address is always typed in).
  const changeTechnician = (name: string) => {
    setTechnician(name);
    const known = technicians.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
    if (known?.department) setDepartment(known.department);
  };

  // Picking a known runner fills in the email from their most recent run.
  const changeRunner = (name: string) => {
    setRunner(name);
    const known = runners.find((r) => r.name.toLowerCase() === name.trim().toLowerCase());
    if (known?.email) setRunnerEmail(known.email);
  };

  const choosePreventable = (value: PreventableStatus) => {
    // Clicking the selected option again clears it back to Unclassified.
    const next = preventable === value ? "Unclassified" : value;
    setPreventable(next);
    if (next !== "Preventable") setReason("");
  };

  const updateItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subitems = items
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity ? Number(i.quantity) : null }));

    const fields = {
      technician: technician.trim(),
      department,
      technicianAddress: technicianAddress.trim(),
      supplyHouseAddress: supplyHouseAddress.trim(),
      runTypes: [runType],
      runnerName: runner.trim(),
      runnerEmail: runner.trim() ? runnerEmail.trim().toLowerCase() : "",
      preventable,
      preventableReason:
        preventable === "Preventable" ? reason : preventable === "Not Preventable" ? "Not Preventable" : "",
      subitems,
      description: subitems.map((s) => s.name).join(", "),
    };

    if (run) {
      onSave({
        ...run,
        ...fields,
        // The supply house name came from the export; drop it if the address was changed.
        supplyHouseName: fields.supplyHouseAddress === run.supplyHouseAddress ? run.supplyHouseName : "",
        isEdited: !run.isDraft,
      });
      return;
    }

    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    onSave({
      ...fields,
      id: `draft-${now.getTime()}`,
      name: "New run",
      date: local,
      supplyHouseName: "",
      poNumber: "",
      startTrip: null,
      endTrip: null,
      durationText: "",
      durationMinutes: null,
      totalHours: null,
      mileage: null,
      isDraft: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-form-title"
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="run-form-title" className="text-base font-semibold text-slate-900">
              {isEdit ? "Edit Run" : "Add New Run"}
            </h2>
            <p className="text-xs text-slate-500">Prototype only — changes are not saved.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="technician" optional={!needsTechnician}>
                  Technician Name
                </Label>
                <input
                  ref={firstField}
                  id="technician"
                  list="technician-list"
                  className={inputCls}
                  value={technician}
                  onChange={(e) => changeTechnician(e.target.value)}
                  placeholder="Who needs the parts?"
                  autoComplete="off"
                  required={needsTechnician}
                />
                <datalist id="technician-list">
                  {technicians.map((t) => (
                    <option key={t.name} value={t.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  className={inputCls}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {!department && <option value="">Select…</option>}
                  {departmentOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-slate-700">Type of Run</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RUN_TYPES.map((t) => (
                  <ToggleButton key={t} active={runType === t} onClick={() => setRunType(t)}>
                    {t}
                  </ToggleButton>
                ))}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="technicianAddress" optional={!needsTechnician}>
                Technician Address
              </Label>
              <input
                id="technicianAddress"
                className={inputCls}
                value={technicianAddress}
                onChange={(e) => setTechnicianAddress(e.target.value)}
                placeholder="Job site, e.g. 123 Main St, Columbus, OH"
                autoComplete="off"
                required={needsTechnician}
              />
            </div>

            <div>
              <Label htmlFor="supplyHouseAddress" optional>
                Supply House Address
              </Label>
              <input
                id="supplyHouseAddress"
                list="supply-list"
                className={inputCls}
                value={supplyHouseAddress}
                onChange={(e) => setSupplyHouseAddress(e.target.value)}
                placeholder="Where to pick up the parts, if known"
                autoComplete="off"
              />
              <datalist id="supply-list">
                {supplyHouseAddresses.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <Label htmlFor="item-0">Items to Bring to the Technician</Label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      id={`item-${i}`}
                      className={`${fieldCls} min-w-0 flex-1`}
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Part / item name"
                      required={i === 0}
                    />
                    <input
                      type="number"
                      min={1}
                      aria-label="Quantity"
                      className={`${fieldCls} w-20 shrink-0`}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((rows) => rows.filter((_, idx) => idx !== i))}
                        className="shrink-0 rounded-lg px-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setItems((rows) => [...rows, emptyItem()])}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add another item
              </button>
            </div>

            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-slate-700">
                Was this run preventable?
                <span className="ml-1 font-normal text-slate-400">(optional)</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <ToggleButton
                  active={preventable === "Preventable"}
                  onClick={() => choosePreventable("Preventable")}
                  tone="amber"
                >
                  Preventable
                </ToggleButton>
                <ToggleButton
                  active={preventable === "Not Preventable"}
                  onClick={() => choosePreventable("Not Preventable")}
                  tone="emerald"
                >
                  Not Preventable
                </ToggleButton>
              </div>
              {preventable === "Preventable" && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <Label htmlFor="preventableReason">Why was it preventable?</Label>
                  <select
                    id="preventableReason"
                    className={inputCls}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose a reason…
                    </option>
                    {PREVENTABLE_REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="runner" optional>
                  Assign Runner
                </Label>
                <input
                  id="runner"
                  list="runner-list"
                  className={inputCls}
                  value={runner}
                  onChange={(e) => changeRunner(e.target.value)}
                  placeholder="Can be assigned later"
                  autoComplete="off"
                />
                <datalist id="runner-list">
                  {runners.map((r) => (
                    <option key={r.name} value={r.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="runnerEmail" optional>
                  Runner Email
                </Label>
                <input
                  id="runnerEmail"
                  type="email"
                  className={inputCls}
                  value={runnerEmail}
                  onChange={(e) => setRunnerEmail(e.target.value)}
                  placeholder={runner.trim() ? "name@company.com" : "Add a runner first"}
                  disabled={!runner.trim()}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {isEdit ? "Save Changes" : "Create Run"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Maps a reason from the export (any casing) onto the standard list, or "" if it isn't one. */
function matchReason(value: string): string {
  return PREVENTABLE_REASONS.find((r) => r.toLowerCase() === value.trim().toLowerCase()) ?? "";
}

const TONES = {
  blue: "border-blue-600 bg-blue-50 text-blue-700",
  amber: "border-amber-500 bg-amber-50 text-amber-800",
  emerald: "border-emerald-600 bg-emerald-50 text-emerald-700",
};

function ToggleButton({
  active,
  onClick,
  tone = "blue",
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
        active ? TONES[tone] : "border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ htmlFor, optional, children }: { htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
      {children}
      {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
    </label>
  );
}
