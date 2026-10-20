"use client";

import { useEffect, useRef, useState } from "react";
import type { Run } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (run: Run) => void;
  technicians: string[];
  runners: string[];
  supplyHouses: string[];
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
export default function AddRunModal({ open, onClose, onAdd, technicians, runners, supplyHouses }: Props) {
  const [technician, setTechnician] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [runner, setRunner] = useState("");
  const [supplyHouse, setSupplyHouse] = useState("");
  const [runType, setRunType] = useState(RUN_TYPES[0]);
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
    setRunner("");
    setSupplyHouse("");
    setRunType(RUN_TYPES[0]);
    setItems([{ name: "", quantity: "1" }]);
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
      department: runType === "Technician" ? department : "",
      technicianAddress: "",
      supplyHouseName: supplyHouse.trim(),
      supplyHouseAddress: "",
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
            <div>
              <Label htmlFor="runType">Run Type</Label>
              <div id="runType" className="grid grid-cols-3 gap-2">
                {RUN_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRunType(t)}
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="technician">Technician</Label>
                <input
                  ref={firstField}
                  id="technician"
                  list="technician-list"
                  className={inputCls}
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Who needs the part?"
                  required={runType === "Technician"}
                />
                <datalist id="technician-list">
                  {technicians.map((t) => (
                    <option key={t} value={t} />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="runner">Runner</Label>
                <input
                  id="runner"
                  list="runner-list"
                  className={inputCls}
                  value={runner}
                  onChange={(e) => setRunner(e.target.value)}
                  placeholder="Assigned runner"
                  required
                />
                <datalist id="runner-list">
                  {runners.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="supplyHouse">Supply House</Label>
                <input
                  id="supplyHouse"
                  list="supply-list"
                  className={inputCls}
                  value={supplyHouse}
                  onChange={(e) => setSupplyHouse(e.target.value)}
                  placeholder="e.g. Carr Supply"
                />
                <datalist id="supply-list">
                  {supplyHouses.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <Label htmlFor="item-0">Items Requested</Label>
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

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}
