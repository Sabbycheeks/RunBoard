"use client";

import { useEffect, useRef, useState } from "react";
import type { Run } from "@/lib/types";

export interface TechnicianInfo {
  name: string;
  department: string;
  address: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (run: Run) => void;
  technicians: TechnicianInfo[];
  runners: string[];
  supplyHouseAddresses: string[];
}

interface ItemRow {
  name: string;
  quantity: string;
}

const RUN_TYPES = ["Technician", "Supply House", "Other"];
const DEPARTMENTS = ["Plumbing Service", "Plumbing Install", "HVAC Service", "HVAC Install"];

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

/** Mock data-entry form. Adds a draft run to local state only; nothing is saved. */
export default function AddRunModal({ open, onClose, onAdd, technicians, runners, supplyHouseAddresses }: Props) {
  const [technician, setTechnician] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [runType, setRunType] = useState(RUN_TYPES[0]);
  const [technicianAddress, setTechnicianAddress] = useState("");
  const [supplyHouseAddress, setSupplyHouseAddress] = useState("");
  const [runner, setRunner] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ name: "", quantity: "1" }]);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setTechnician("");
    setDepartment(DEPARTMENTS[0]);
    setRunType(RUN_TYPES[0]);
    setTechnicianAddress("");
    setSupplyHouseAddress("");
    setRunner("");
    setItems([{ name: "", quantity: "1" }]);
  };

  // Picking a known technician pre-fills their department and last-used address.
  const changeTechnician = (name: string) => {
    setTechnician(name);
    const known = technicians.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
    if (!known) return;
    if (known.department && DEPARTMENTS.includes(known.department)) setDepartment(known.department);
    if (known.address && !technicianAddress) setTechnicianAddress(known.address);
  };

  const updateItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subitems = items
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity ? Number(i.quantity) : null }));
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    onAdd({
      id: `draft-${now.getTime()}`,
      name: "New run",
      description: subitems.map((s) => s.name).join(", "),
      date: local,
      technician: technician.trim(),
      department,
      technicianAddress: technicianAddress.trim(),
      supplyHouseName: "",
      supplyHouseAddress: supplyHouseAddress.trim(),
      runTypes: [runType],
      poNumber: "",
      runnerName: runner.trim(),
      runnerEmail: "",
      startTrip: null,
      endTrip: null,
      durationText: "",
      durationMinutes: null,
      totalHours: null,
      mileage: null,
      preventable: "Unclassified",
      preventableReason: "",
      subitems,
      isDraft: true,
    });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-run-title"
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="add-run-title" className="text-base font-semibold text-slate-900">
              Add New Run
            </h2>
            <p className="text-xs text-slate-500">Prototype only — entries are not saved.</p>
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
                <Label htmlFor="technician">Technician Name</Label>
                <input
                  ref={firstField}
                  id="technician"
                  list="technician-list"
                  className={inputCls}
                  value={technician}
                  onChange={(e) => changeTechnician(e.target.value)}
                  placeholder="Who needs the parts?"
                  autoComplete="off"
                  required
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
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-slate-700">Type of Run</legend>
              <div className="grid grid-cols-3 gap-2">
                {RUN_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRunType(t)}
                    aria-pressed={runType === t}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      runType === t
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="technicianAddress">Technician Address</Label>
              <input
                id="technicianAddress"
                className={inputCls}
                value={technicianAddress}
                onChange={(e) => setTechnicianAddress(e.target.value)}
                placeholder="Job site, e.g. 123 Main St, Columbus, OH"
                autoComplete="off"
                required
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
                      className={inputCls}
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Part / item name"
                      required={i === 0}
                    />
                    <input
                      type="number"
                      min={1}
                      aria-label="Quantity"
                      className={`${inputCls} w-20 shrink-0`}
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
                onClick={() => setItems((rows) => [...rows, { name: "", quantity: "1" }])}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add another item
              </button>
            </div>

            <div>
              <Label htmlFor="runner" optional>
                Assign Runner
              </Label>
              <input
                id="runner"
                list="runner-list"
                className={inputCls}
                value={runner}
                onChange={(e) => setRunner(e.target.value)}
                placeholder="Can be assigned later"
                autoComplete="off"
              />
              <datalist id="runner-list">
                {runners.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
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
              Create Run
            </button>
          </div>
        </form>
      </div>
    </div>
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
